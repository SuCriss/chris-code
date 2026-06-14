import type { LocalCommandCall } from '../../types/command.js'
import {
  scanDirectory,
  formatFindings,
} from '../../services/security/scanner.js'

export default async function auditCommand(
  call: LocalCommandCall,
): Promise<void> {
  const { args, setMessages } = call
  const dir = args?.trim() || undefined

  setMessages?.([
    {
      type: 'text' as const,
      text: '🔍 Scanning for security vulnerabilities...',
    },
  ])

  try {
    const findings = await scanDirectory(dir)
    const report = formatFindings(findings)
    setMessages?.([{ type: 'text' as const, text: report }])
  } catch (e) {
    setMessages?.([
      { type: 'text' as const, text: `✗ Audit failed: ${String(e)}` },
    ])
  }
}
