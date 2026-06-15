/**
 * 智能命令建议系统
 *
 * 功能：
 * 1. 基于上下文推荐命令（检测 git 仓库、文件类型等）
 * 2. 学习用户习惯，智能排序
 * 3. 命令关联推荐（使用 A 命令后建议 B 命令）
 */

import { getGlobalConfig, saveGlobalConfig } from '../config.js'
import { type Command, getCommandName } from '../../commands.js'
import { existsSync } from 'fs'
import { join } from 'path'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 命令关联记录
 */
export type CommandAssociation = {
  command: string // 当前命令
  nextCommand: string // 后续命令
  count: number // 出现次数
  lastUsedAt: number // 最后使用时间
}

/**
 * 上下文信息
 */
export type ContextInfo = {
  cwd: string
  isGitRepo: boolean
  hasPackageJson: boolean
  hasDockerfile: boolean
  hasPythonFiles: boolean
  hasTypeScriptFiles: boolean
  hasRustFiles: boolean
  hasGoFiles: boolean
  fileCount?: number
}

/**
 * 智能建议配置
 */
export type IntelligentSuggestionsConfig = {
  commandAssociations?: Record<string, CommandAssociation[]> // 命令关联
  lastCommand?: string // 最后执行的命令
  contextPreferences?: Record<string, string[]> // 上下文偏好：上下文类型 -> 常用命令列表
}

// ============================================================================
// 上下文检测
// ============================================================================

/**
 * 检测当前工作目录的上下文信息
 */
export function detectContext(cwd: string): ContextInfo {
  const context: ContextInfo = {
    cwd,
    isGitRepo: false,
    hasPackageJson: false,
    hasDockerfile: false,
    hasPythonFiles: false,
    hasTypeScriptFiles: false,
    hasRustFiles: false,
    hasGoFiles: false,
  }

  try {
    // 检测 Git 仓库
    context.isGitRepo = existsSync(join(cwd, '.git'))

    // 检测项目类型
    context.hasPackageJson = existsSync(join(cwd, 'package.json'))
    context.hasDockerfile = existsSync(join(cwd, 'Dockerfile'))

    // 检测文件类型（简单检查常见文件）
    context.hasPythonFiles =
      existsSync(join(cwd, 'requirements.txt')) ||
      existsSync(join(cwd, 'setup.py')) ||
      existsSync(join(cwd, 'pyproject.toml'))

    context.hasTypeScriptFiles =
      existsSync(join(cwd, 'tsconfig.json')) || context.hasPackageJson

    context.hasRustFiles = existsSync(join(cwd, 'Cargo.toml'))
    context.hasGoFiles = existsSync(join(cwd, 'go.mod'))
  } catch {
    // 忽略文件系统错误
  }

  return context
}

/**
 * 获取上下文类型标识
 */
export function getContextKey(context: ContextInfo): string {
  const keys: string[] = []

  if (context.isGitRepo) keys.push('git')
  if (context.hasPackageJson) keys.push('node')
  if (context.hasDockerfile) keys.push('docker')
  if (context.hasPythonFiles) keys.push('python')
  if (context.hasTypeScriptFiles) keys.push('typescript')
  if (context.hasRustFiles) keys.push('rust')
  if (context.hasGoFiles) keys.push('go')

  return keys.length > 0 ? keys.join(',') : 'generic'
}

// ============================================================================
// 命令关联学习
// ============================================================================

/**
 * 记录命令关联（用户依次使用了两个命令）
 */
export function recordCommandAssociation(
  currentCommand: string,
  nextCommand: string,
): void {
  if (!currentCommand || !nextCommand || currentCommand === nextCommand) {
    return
  }

  saveGlobalConfig(config => {
    const suggestions = config.intelligentSuggestions ?? {}
    const associations = suggestions.commandAssociations ?? {}
    const key = currentCommand
    const existing = associations[key] ?? []

    // 查找是否已有该关联
    const associationIndex = existing.findIndex(
      a => a.nextCommand === nextCommand,
    )

    let updated: CommandAssociation[]
    if (associationIndex >= 0) {
      // 更新现有关联
      updated = [...existing]
      updated[associationIndex] = {
        ...updated[associationIndex]!,
        count: updated[associationIndex]!.count + 1,
        lastUsedAt: Date.now(),
      }
    } else {
      // 添加新关联
      updated = [
        ...existing,
        {
          command: currentCommand,
          nextCommand,
          count: 1,
          lastUsedAt: Date.now(),
        },
      ]
    }

    return {
      ...config,
      intelligentSuggestions: {
        ...suggestions,
        commandAssociations: {
          ...associations,
          [key]: updated,
        },
        lastCommand: nextCommand,
      },
    }
  })
}

/**
 * 获取命令关联建议
 */
export function getCommandAssociations(
  lastCommand: string | undefined,
): string[] {
  if (!lastCommand) return []

  const config = getGlobalConfig()
  const suggestions = config.intelligentSuggestions
  if (!suggestions?.commandAssociations) return []

  const associations = suggestions.commandAssociations[lastCommand] ?? []

  // 按使用频率和时间排序
  const sorted = [...associations].sort((a, b) => {
    // 时间衰减：7天半衰期
    const daysSinceA = (Date.now() - a.lastUsedAt) / (1000 * 60 * 60 * 24)
    const daysSinceB = (Date.now() - b.lastUsedAt) / (1000 * 60 * 60 * 24)
    const recencyA = 0.5 ** (daysSinceA / 7)
    const recencyB = 0.5 ** (daysSinceB / 7)

    const scoreA = a.count * Math.max(recencyA, 0.1)
    const scoreB = b.count * Math.max(recencyB, 0.1)

    return scoreB - scoreA
  })

  // 返回前 3 个关联命令
  return sorted.slice(0, 3).map(a => a.nextCommand)
}

// ============================================================================
// 上下文感知推荐
// ============================================================================

/**
 * 基于上下文的命令推荐规则
 */
const CONTEXT_RECOMMENDATIONS: Record<string, string[]> = {
  git: ['commit', 'diff', 'commit-push-pr', 'branch'],
  node: ['audit', 'init'],
  typescript: ['audit'],
  python: ['audit'],
  rust: ['audit'],
  go: ['audit'],
  docker: ['audit'],
}

/**
 * 获取基于上下文的推荐命令
 */
export function getContextBasedRecommendations(
  context: ContextInfo,
  commands: Command[],
): string[] {
  const contextKey = getContextKey(context)
  const contextTypes = contextKey.split(',')

  const recommendations = new Set<string>()

  // 添加预定义的推荐
  for (const type of contextTypes) {
    const recs = CONTEXT_RECOMMENDATIONS[type]
    if (recs) {
      recs.forEach(cmd => recommendations.add(cmd))
    }
  }

  // 添加用户的上下文偏好
  const config = getGlobalConfig()
  const preferences = config.intelligentSuggestions?.contextPreferences ?? {}
  const userPrefs = preferences[contextKey] ?? []
  userPrefs.forEach(cmd => recommendations.add(cmd))

  // 过滤出实际存在的命令
  const commandNames = new Set(commands.map(cmd => getCommandName(cmd)))
  return Array.from(recommendations).filter(cmd => commandNames.has(cmd))
}

/**
 * 记录用户在特定上下文中使用的命令（用于学习偏好）
 */
export function recordContextPreference(
  context: ContextInfo,
  commandName: string,
): void {
  const contextKey = getContextKey(context)

  saveGlobalConfig(config => {
    const suggestions = config.intelligentSuggestions ?? {}
    const preferences = suggestions.contextPreferences ?? {}
    const existing = preferences[contextKey] ?? []

    // 如果命令不在列表中，添加它
    if (!existing.includes(commandName)) {
      return {
        ...config,
        intelligentSuggestions: {
          ...suggestions,
          contextPreferences: {
            ...preferences,
            [contextKey]: [...existing, commandName].slice(0, 10), // 最多保留 10 个
          },
        },
      }
    }

    return config
  })
}

// ============================================================================
// 综合智能排序
// ============================================================================

/**
 * 计算命令的智能推荐分数
 */
export function calculateIntelligentScore(
  commandName: string,
  context: ContextInfo,
  lastCommand: string | undefined,
): number {
  let score = 0

  // 1. 上下文相关性（权重 3）
  const contextRecommendations = getContextBasedRecommendations(context, [])
  if (contextRecommendations.includes(commandName)) {
    score += 3
  }

  // 2. 命令关联（权重 5）
  const associations = getCommandAssociations(lastCommand)
  const associationIndex = associations.indexOf(commandName)
  if (associationIndex >= 0) {
    // 第一个关联命令得 5 分，第二个得 3 分，第三个得 1 分
    score += [5, 3, 1][associationIndex] ?? 0
  }

  return score
}

/**
 * 对命令列表进行智能排序
 */
export function applyIntelligentSorting(
  commands: Command[],
  context: ContextInfo,
): Command[] {
  const config = getGlobalConfig()
  const lastCommand = config.intelligentSuggestions?.lastCommand

  return [...commands].sort((a, b) => {
    const nameA = getCommandName(a)
    const nameB = getCommandName(b)

    const scoreA = calculateIntelligentScore(nameA, context, lastCommand)
    const scoreB = calculateIntelligentScore(nameB, context, lastCommand)

    return scoreB - scoreA
  })
}

// ============================================================================
// 导出工具函数
// ============================================================================

/**
 * 获取最后执行的命令
 */
export function getLastCommand(): string | undefined {
  const config = getGlobalConfig()
  return config.intelligentSuggestions?.lastCommand
}

/**
 * 清除智能建议数据（用于测试或重置）
 */
export function clearIntelligentSuggestions(): void {
  saveGlobalConfig(config => ({
    ...config,
    intelligentSuggestions: undefined,
  }))
}
