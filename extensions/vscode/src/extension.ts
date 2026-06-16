import * as vscode from 'vscode'

let terminal: vscode.Terminal | undefined

export function activate(context: vscode.ExtensionContext) {
  // 启动 Chris Code 终端会话
  context.subscriptions.push(
    vscode.commands.registerCommand('chris-code.start', () => {
      launchTerminal(context)
    }),
  )

  // 解释选中代码
  context.subscriptions.push(
    vscode.commands.registerCommand('chris-code.explain', async () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) return

      const selection = editor.document.getText(editor.selection)
      if (!selection) {
        vscode.window.showWarningMessage('Please select some code first.')
        return
      }

      const filePath = editor.document.fileName
      const prompt = `Explain this code from ${filePath}:\n\`\`\`\n${selection}\n\`\`\``
      launchTerminal(context, `--print "${escapeShellArg(prompt)}"`)
    }),
  )

  // 修复选中代码
  context.subscriptions.push(
    vscode.commands.registerCommand('chris-code.fix', async () => {
      const editor = vscode.window.activeTextEditor
      if (!editor) return

      const selection = editor.document.getText(editor.selection)
      if (!selection) {
        vscode.window.showWarningMessage('Please select some code first.')
        return
      }

      const filePath = editor.document.fileName
      const line = editor.selection.start.line + 1
      const prompt = `Fix the code at ${filePath}:${line}:\n\`\`\`\n${selection}\n\`\`\``
      launchTerminal(context, `--print "${escapeShellArg(prompt)}"`)
    }),
  )
}

function launchTerminal(context: vscode.ExtensionContext, args?: string) {
  const config = vscode.workspace.getConfiguration('chris-code')
  const cliPath = config.get<string>('cliPath', 'chris')

  // 获取当前工作区目录
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

  if (terminal) {
    terminal.show()
    if (args) {
      terminal.sendText(`${cliPath} ${args}`)
    }
    return
  }

  terminal = vscode.window.createTerminal({
    name: 'Chris Code',
    iconPath: new vscode.ThemeIcon('robot'),
    cwd: workspaceFolder,
  })

  terminal.show()
  terminal.sendText(`${cliPath} ${args || ''}`)

  // 监听终端关闭
  const disposable = vscode.window.onDidCloseTerminal(closedTerminal => {
    if (closedTerminal === terminal) {
      terminal = undefined
      disposable.dispose()
    }
  })
  context.subscriptions.push(disposable)
}

function escapeShellArg(str: string): string {
  // 转义 shell 特殊字符
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`')
    .replace(/\n/g, '\\n')
}

export function deactivate() {
  terminal?.dispose()
}
