/**
 * 命令自动补全系统导出
 */

export {
  generateBashCompletion,
  generateZshCompletion,
  generateFishCompletion,
  generateAllCompletions,
  type CompletionShell,
  type CommandInfo,
} from './completionGenerator.js'

export { collectCommands } from './commandCollector.js'
export {
  installCompletion,
  getInstallInstructions,
} from './completionInstaller.js'
