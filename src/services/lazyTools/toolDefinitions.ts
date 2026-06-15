/**
 * 工具懒加载配置 — 定义哪些工具应该懒加载
 */

import { LazyToolLoader, type ToolDefinition } from './LazyToolLoader.js'
import { feature } from 'bun:bundle'

/**
 * 创建工具定义的辅助函数
 */
export function defineCoreTool(
  name: string,
  loader: () => any,
): ToolDefinition {
  return {
    name,
    category: 'core',
    loader,
  }
}

export function defineExtendedTool(
  name: string,
  loader: () => any,
): ToolDefinition {
  return {
    name,
    category: 'extended',
    loader,
  }
}

export function defineFeatureTool(
  name: string,
  featureFlag: string,
  loader: () => any,
): ToolDefinition {
  return {
    name,
    category: 'feature',
    featureFlag,
    loader,
    isEnabled: () => feature(featureFlag as any),
  }
}

/**
 * 注册所有工具定义
 */
export function registerToolDefinitions(loader: LazyToolLoader): void {
  // 核心工具 — 最常用，启动时预加载
  loader.registerMany([
    defineCoreTool(
      'Read',
      () =>
        require('@chris-code/builtin-tools/tools/FileReadTool/FileReadTool.js')
          .FileReadTool,
    ),
    defineCoreTool(
      'Write',
      () =>
        require('@chris-code/builtin-tools/tools/FileWriteTool/FileWriteTool.js')
          .FileWriteTool,
    ),
    defineCoreTool(
      'Edit',
      () =>
        require('@chris-code/builtin-tools/tools/FileEditTool/FileEditTool.js')
          .FileEditTool,
    ),
    defineCoreTool(
      'Bash',
      () =>
        require('@chris-code/builtin-tools/tools/BashTool/BashTool.js')
          .BashTool,
    ),
    defineCoreTool(
      'Glob',
      () =>
        require('@chris-code/builtin-tools/tools/GlobTool/GlobTool.js')
          .GlobTool,
    ),
    defineCoreTool(
      'Grep',
      () =>
        require('@chris-code/builtin-tools/tools/GrepTool/GrepTool.js')
          .GrepTool,
    ),
  ])

  // 扩展工具 — 较常用，按需加载
  loader.registerMany([
    defineExtendedTool(
      'Agent',
      () =>
        require('@chris-code/builtin-tools/tools/AgentTool/AgentTool.js')
          .AgentTool,
    ),
    defineExtendedTool(
      'Skill',
      () =>
        require('@chris-code/builtin-tools/tools/SkillTool/SkillTool.js')
          .SkillTool,
    ),
    defineExtendedTool(
      'WebFetch',
      () =>
        require('@chris-code/builtin-tools/tools/WebFetchTool/WebFetchTool.js')
          .WebFetchTool,
    ),
    defineExtendedTool(
      'WebSearch',
      () =>
        require('@chris-code/builtin-tools/tools/WebSearchTool/WebSearchTool.js')
          .WebSearchTool,
    ),
    defineExtendedTool(
      'TodoWrite',
      () =>
        require('@chris-code/builtin-tools/tools/TodoWriteTool/TodoWriteTool.js')
          .TodoWriteTool,
    ),
    defineExtendedTool(
      'AskUserQuestion',
      () =>
        require('@chris-code/builtin-tools/tools/AskUserQuestionTool/AskUserQuestionTool.js')
          .AskUserQuestionTool,
    ),
    defineExtendedTool(
      'EnterPlanMode',
      () =>
        require('@chris-code/builtin-tools/tools/EnterPlanModeTool/EnterPlanModeTool.js')
          .EnterPlanModeTool,
    ),
    defineExtendedTool(
      'ExitPlanMode',
      () =>
        require('@chris-code/builtin-tools/tools/ExitPlanModeTool/ExitPlanModeV2Tool.js')
          .ExitPlanModeV2Tool,
    ),
  ])

  // 功能工具 — feature flag 控制
  if (feature('WORKFLOW_SCRIPTS')) {
    loader.register(
      defineFeatureTool('Workflow', 'WORKFLOW_SCRIPTS', () => {
        require('@chris-code/builtin-tools/tools/WorkflowTool/bundled/index.js').initBundledWorkflows()
        return require('@chris-code/builtin-tools/tools/WorkflowTool/WorkflowTool.js')
          .WorkflowTool
      }),
    )
  }

  if (feature('WEB_BROWSER_TOOL')) {
    loader.register(
      defineFeatureTool(
        'WebBrowser',
        'WEB_BROWSER_TOOL',
        () =>
          require('@chris-code/builtin-tools/tools/WebBrowserTool/WebBrowserTool.js')
            .WebBrowserTool,
      ),
    )
  }
}

/**
 * 格式化加载统计为可读文本
 */
export function formatLoadStats(loader: LazyToolLoader): string {
  const stats = loader.getStats()
  const lines: string[] = []

  lines.push('# 工具加载统计')
  lines.push('')
  lines.push(`- 已加载: ${stats.loaded}/${stats.total} (${stats.percentage}%)`)
  lines.push(`- 总加载时间: ${stats.totalLoadTime.toFixed(2)}ms`)
  lines.push(`- 平均加载时间: ${stats.avgLoadTime.toFixed(2)}ms`)
  lines.push('')

  if (Object.keys(stats.byCategory).length > 0) {
    lines.push('## 按类别统计')
    lines.push('')
    for (const [category, count] of Object.entries(stats.byCategory)) {
      lines.push(`- ${category}: ${count}`)
    }
    lines.push('')
  }

  const details = loader.getLoadDetails()
  const loadedDetails = details.filter(d => d.loaded).slice(0, 10)

  if (loadedDetails.length > 0) {
    lines.push('## 加载最慢的工具 (top 10)')
    lines.push('')
    for (const detail of loadedDetails) {
      lines.push(
        `- ${detail.name} (${detail.category}): ${detail.loadTime?.toFixed(2)}ms`,
      )
    }
  }

  return lines.join('\n')
}
