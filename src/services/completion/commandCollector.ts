/**
 * 命令收集器 — 从 commands.ts 提取命令信息
 */

import type { CommandInfo } from './completionGenerator.js'
import type { Command } from '../../commands.js'

/**
 * 从命令对象提取补全信息
 */
export function collectCommands(
  commands: Record<string, Command>,
): CommandInfo[] {
  const commandInfos: CommandInfo[] = []

  for (const [name, cmd] of Object.entries(commands)) {
    if (!cmd || name.startsWith('_')) continue // 跳过内部命令

    commandInfos.push({
      name,
      description: cmd.description || name,
    })
  }

  return commandInfos.sort((a, b) => a.name.localeCompare(b.name))
}
