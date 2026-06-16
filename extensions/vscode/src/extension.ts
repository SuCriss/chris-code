import * as vscode from 'vscode'

let terminal: vscode.Terminal | undefined
let chatPanel: vscode.WebviewPanel | undefined

// 侧边栏 TreeDataProvider
class ChrisCodeActionsProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element
  }

  getChildren(): vscode.TreeItem[] {
    const startItem = new vscode.TreeItem(
      'Start Session',
      vscode.TreeItemCollapsibleState.None,
    )
    startItem.command = { command: 'chris-code.start', title: 'Start Session' }
    startItem.iconPath = new vscode.ThemeIcon('terminal')

    const chatItem = new vscode.TreeItem(
      'Open Chat',
      vscode.TreeItemCollapsibleState.None,
    )
    chatItem.command = { command: 'chris-code.openChat', title: 'Open Chat' }
    chatItem.iconPath = new vscode.ThemeIcon('comment-discussion')

    const explainItem = new vscode.TreeItem(
      'Explain Selection',
      vscode.TreeItemCollapsibleState.None,
    )
    explainItem.command = {
      command: 'chris-code.explain',
      title: 'Explain Selection',
    }
    explainItem.iconPath = new vscode.ThemeIcon('info')

    const fixItem = new vscode.TreeItem(
      'Fix Code',
      vscode.TreeItemCollapsibleState.None,
    )
    fixItem.command = { command: 'chris-code.fix', title: 'Fix Code' }
    fixItem.iconPath = new vscode.ThemeIcon('lightbulb')

    const auditItem = new vscode.TreeItem(
      'Run Audit',
      vscode.TreeItemCollapsibleState.None,
    )
    auditItem.command = { command: 'chris-code.audit', title: 'Run Audit' }
    auditItem.iconPath = new vscode.ThemeIcon('shield')

    return [startItem, chatItem, explainItem, fixItem, auditItem]
  }
}

export function activate(context: vscode.ExtensionContext) {
  // 注册侧边栏 TreeView
  const actionsProvider = new ChrisCodeActionsProvider()
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      'chris-code-actions',
      actionsProvider,
    ),
  )

  // 打开聊天面板
  context.subscriptions.push(
    vscode.commands.registerCommand('chris-code.openChat', () => {
      createChatPanel(context)
    }),
  )

  // 启动终端会话
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
      createChatPanel(context, prompt)
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
      createChatPanel(context, prompt)
    }),
  )

  // 运行审计
  context.subscriptions.push(
    vscode.commands.registerCommand('chris-code.audit', () => {
      createChatPanel(context, '/audit')
    }),
  )
}

function createChatPanel(
  context: vscode.ExtensionContext,
  initialPrompt?: string,
) {
  if (chatPanel) {
    chatPanel.reveal()
    if (initialPrompt) {
      chatPanel.webview.postMessage({ type: 'prompt', text: initialPrompt })
    }
    return
  }

  chatPanel = vscode.window.createWebviewPanel(
    'chrisCodeChat',
    'Chris Code',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    },
  )

  chatPanel.webview.html = getChatHtml(chatPanel.webview, context.extensionUri)

  // 处理来自 WebView 的消息
  chatPanel.webview.onDidReceiveMessage(
    message => {
      switch (message.type) {
        case 'send':
          // 将用户输入发送到终端
          if (terminal) {
            terminal.sendText(message.text)
          } else {
            launchTerminal(context, `--print "${escapeShellArg(message.text)}"`)
          }
          break
        case 'ready':
          if (initialPrompt) {
            chatPanel?.webview.postMessage({
              type: 'prompt',
              text: initialPrompt,
            })
          }
          break
      }
    },
    undefined,
    context.subscriptions,
  )

  chatPanel.onDidDispose(
    () => {
      chatPanel = undefined
    },
    null,
    context.subscriptions,
  )
}

function getChatHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
): string {
  const style = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header h1 {
      font-size: 14px;
      font-weight: 600;
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .message {
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 6px;
      max-width: 85%;
    }
    .message.user {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      margin-left: auto;
    }
    .message.assistant {
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
    }
    .input-area {
      padding: 12px 16px;
      border-top: 1px solid var(--vscode-panel-border);
      display: flex;
      gap: 8px;
    }
    .input-area input {
      flex: 1;
      padding: 8px 12px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      outline: none;
      font-size: inherit;
    }
    .input-area input:focus {
      border-color: var(--vscode-focusBorder);
    }
    .input-area button {
      padding: 8px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: inherit;
    }
    .input-area button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .quick-actions {
      display: flex;
      gap: 8px;
      padding: 8px 16px;
      flex-wrap: wrap;
    }
    .quick-action {
      padding: 4px 12px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 12px;
      cursor: pointer;
      font-size: 12px;
    }
    .quick-action:hover {
      opacity: 0.8;
    }
  `

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${style}</style>
</head>
<body>
  <div class="header">
    <span>🤖</span>
    <h1>Chris Code</h1>
  </div>

  <div class="quick-actions">
    <span class="quick-action" onclick="sendQuick('/help')">/help</span>
    <span class="quick-action" onclick="sendQuick('/audit')">/audit</span>
    <span class="quick-action" onclick="sendQuick('/compact')">/compact</span>
    <span class="quick-action" onclick="sendQuick('/memory')">/memory</span>
  </div>

  <div class="messages" id="messages"></div>

  <div class="input-area">
    <input type="text" id="input" placeholder="Ask Chris Code anything..." />
    <button onclick="send()">Send</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messagesDiv = document.getElementById('messages');
    const input = document.getElementById('input');

    function send() {
      const text = input.value.trim();
      if (!text) return;
      addMessage(text, 'user');
      vscode.postMessage({ type: 'send', text });
      input.value = '';
    }

    function sendQuick(text) {
      addMessage(text, 'user');
      vscode.postMessage({ type: 'send', text });
    }

    function addMessage(text, role) {
      const div = document.createElement('div');
      div.className = 'message ' + role;
      div.textContent = text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    // 监听来自扩展的消息
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'prompt') {
        addMessage(message.text, 'user');
        vscode.postMessage({ type: 'send', text: message.text });
      }
    });

    // 通知扩展已准备好
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`
}

function launchTerminal(context: vscode.ExtensionContext, args?: string) {
  const config = vscode.workspace.getConfiguration('chris-code')
  const cliPath = config.get<string>('cliPath', 'chris')
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

  const disposable = vscode.window.onDidCloseTerminal(closedTerminal => {
    if (closedTerminal === terminal) {
      terminal = undefined
      disposable.dispose()
    }
  })
  context.subscriptions.push(disposable)
}

function escapeShellArg(str: string): string {
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
