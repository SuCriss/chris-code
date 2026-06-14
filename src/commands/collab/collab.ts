import type { LocalCommandCall } from '../../types/command.js'
import {
  startCollab,
  stopCollab,
  getCollabStatus,
  getActivePeers,
} from '../../services/collab/collab.js'
export default async function collabCommand(
  call: LocalCommandCall,
): Promise<void> {
  const { args, setMessages } = call
  const cmd = args?.trim() || 'status'
  if (cmd === 'start') {
    await startCollab()
    setMessages?.([
      {
        type: 'text' as const,
        text: '✓ Collaboration started. Broadcasting on LAN...',
      },
    ])
  } else if (cmd === 'stop') {
    stopCollab()
    setMessages?.([{ type: 'text' as const, text: '✓ Collaboration stopped.' }])
  } else if (cmd === 'peers') {
    const peers = getActivePeers()
    setMessages?.([
      {
        type: 'text' as const,
        text: peers.length
          ? peers.map(p => `• ${p.name} (${p.host})`).join('\n')
          : 'No peers found.',
      },
    ])
  } else {
    setMessages?.([{ type: 'text' as const, text: getCollabStatus() }])
  }
}
