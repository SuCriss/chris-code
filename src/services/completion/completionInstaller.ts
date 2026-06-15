/**
 * 补全脚本安装器
 */

import type { CompletionShell } from './completionGenerator.js'

/**
 * 获取补全脚本的安装路径
 */
export function getCompletionPath(
  shell: CompletionShell,
  programName: string,
): string {
  const home = process.env.HOME || process.env.USERPROFILE || '~'

  switch (shell) {
    case 'bash':
      return `${home}/.bash_completion.d/${programName}`
    case 'zsh':
      return `${home}/.zsh/completion/_${programName}`
    case 'fish':
      return `${home}/.config/fish/completions/${programName}.fish`
  }
}

/**
 * 获取安装说明
 */
export function getInstallInstructions(
  shell: CompletionShell,
  programName: string,
): string {
  const path = getCompletionPath(shell, programName)

  switch (shell) {
    case 'bash':
      return `# 安装 Bash 补全:
1. 保存补全脚本到: ${path}
2. 在 ~/.bashrc 中添加:
   [ -f ${path} ] && . ${path}
3. 重新加载: source ~/.bashrc`

    case 'zsh':
      return `# 安装 Zsh 补全:
1. 创建目录: mkdir -p ~/.zsh/completion
2. 保存补全脚本到: ${path}
3. 在 ~/.zshrc 中添加:
   fpath=(~/.zsh/completion $fpath)
   autoload -U compinit && compinit
4. 重新加载: source ~/.zshrc`

    case 'fish':
      return `# 安装 Fish 补全:
1. 创建目录: mkdir -p ~/.config/fish/completions
2. 保存补全脚本到: ${path}
3. 补全会自动生效`
  }
}

/**
 * 安装补全脚本（写入文件）
 */
export async function installCompletion(
  shell: CompletionShell,
  programName: string,
  script: string,
): Promise<{ success: boolean; path: string; error?: string }> {
  const path = getCompletionPath(shell, programName)

  try {
    const { mkdir, writeFile } = await import('fs/promises')
    const { dirname } = await import('path')

    // 创建目录
    await mkdir(dirname(path), { recursive: true })

    // 写入脚本
    await writeFile(path, script, 'utf-8')

    return { success: true, path }
  } catch (e) {
    return { success: false, path, error: String(e) }
  }
}
