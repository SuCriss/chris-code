/**
 * /completion 命令 — 生成 Shell 补全脚本
 */

import type { LocalCommandCall } from '../../types/command.js'
import {
  generateAllCompletions,
  collectCommands,
  getInstallInstructions,
} from '../../services/completion/index.js'
import { getCommands } from '../../commands.js'

const call: LocalCommandCall = async (args, context) => {
  const shell = args?.trim() as 'bash' | 'zsh' | 'fish' | undefined

  try {
    // 收集所有命令
    const allCommands = await getCommands(process.cwd())
    const commandsRecord: Record<string, any> = {}
    for (const cmd of allCommands) {
      commandsRecord[cmd.name] = cmd
    }
    const commandInfos = collectCommands(commandsRecord)

    if (!shell) {
      // 显示帮助信息
      return {
        type: 'text',
        value: `# Shell 补全脚本生成

用法: /completion <shell>

支持的 Shell:
- bash
- zsh
- fish

示例:
  /completion bash
  /completion zsh
  /completion fish
`,
      }
    }

    if (!['bash', 'zsh', 'fish'].includes(shell)) {
      return {
        type: 'text',
        value: `✗ 不支持的 Shell: ${shell}\n支持: bash, zsh, fish`,
      }
    }

    // 生成补全脚本
    const completions = generateAllCompletions('chris-code', commandInfos)
    const script = completions[shell]
    const instructions = getInstallInstructions(shell, 'chris-code')

    return {
      type: 'text',
      value: `# ${shell.toUpperCase()} 补全脚本

${script}

---

${instructions}`,
    }
  } catch (e) {
    return { type: 'text', value: `✗ 生成失败: ${String(e)}` }
  }
}

export default {
  type: 'local' as const,
  name: 'completion',
  description: 'Generate shell completion scripts',
  call,
}
