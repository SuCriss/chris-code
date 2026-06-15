import type { LocalCommandCall } from '../../types/command.js'
import {
  startCollab,
  stopCollab,
  getCollabStatus,
  getActivePeers,
} from '../../services/collab/collab.js'

const call: LocalCommandCall = async (args, context) => {
  const cmd = args?.trim() || 'status'
  if (cmd === 'start') {
    await startCollab()
    return {
      type: 'text',
      value: '✓ Collaboration started. Broadcasting on LAN...',
    }
  }
  if (cmd === 'stop') {
    stopCollab()
    return { type: 'text', value: '✓ Collaboration stopped.' }
  }
  if (cmd === 'peers') {
    const peers = getActivePeers()
    return {
      type: 'text',
      value: peers.length
        ? peers.map(p => `• ${p.name} (${p.host})`).join('\n')
        : 'No peers found.',
    }
  }
  return { type: 'text', value: getCollabStatus() }
}

export { call }
