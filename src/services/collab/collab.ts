/**
 * Collaboration mode — share AI sessions between developers on the same LAN.
 * Uses UDP broadcast for discovery + TCP for session sync.
 */

import { logForDebugging } from '../../utils/debug.js'

export type Peer = {
  id: string
  name: string
  host: string
  port: number
  lastSeen: number
  project: string
}

export type CollabMessage = {
  type: 'discover' | 'announce' | 'sync' | 'chat'
  from: Peer
  payload: unknown
  timestamp: number
}

type CollabOptions = {
  port?: number
  broadcastInterval?: number
  onPeerFound?: (peer: Peer) => void
  onMessage?: (msg: CollabMessage) => void
}

const DEFAULT_PORT = 48910
const BROADCAST_INTERVAL = 5000 // 5s
const PEER_TIMEOUT = 15000 // 15s

let _peers = new Map<string, Peer>()
let _broadcastTimer: ReturnType<typeof setInterval> | null = null
let _running = false

export function getPeers(): Peer[] {
  return Array.from(_peers.values())
}

export function getActivePeers(): Peer[] {
  const now = Date.now()
  return getPeers().filter(p => now - p.lastSeen < PEER_TIMEOUT)
}

export async function startCollab(opts: CollabOptions = {}): Promise<void> {
  if (_running) return
  _running = true

  const port = opts.port || DEFAULT_PORT

  logForDebugging(`collab: starting on port ${port}`, { level: 'debug' })

  // Periodically announce presence
  _broadcastTimer = setInterval(() => {
    announcePresence(port)
  }, opts.broadcastInterval || BROADCAST_INTERVAL)

  logForDebugging('collab: started', { level: 'debug' })
}

export function stopCollab(): void {
  _running = false
  if (_broadcastTimer) {
    clearInterval(_broadcastTimer)
    _broadcastTimer = null
  }
  _peers.clear()
  logForDebugging('collab: stopped', { level: 'debug' })
}

function announcePresence(port: number): void {
  // In a real implementation, this would broadcast via UDP
  // For now, just log
  logForDebugging(`collab: announcing on port ${port}`, { level: 'debug' })
}

export function sendMessage(to: Peer, message: CollabMessage): void {
  // In a real implementation, this would send via TCP
  logForDebugging(`collab: sending to ${to.name}: ${message.type}`, {
    level: 'debug',
  })
}

export function broadcastMessage(message: CollabMessage): void {
  const peers = getActivePeers()
  for (const peer of peers) {
    sendMessage(peer, message)
  }
}

export function getCollabStatus(): string {
  const peers = getActivePeers()
  if (!_running) return 'Collaboration mode: not running'
  if (peers.length === 0) return 'Collaboration mode: running, no peers found'
  return `Collaboration mode: ${peers.length} peer(s) connected\n${peers.map(p => `  • ${p.name} (${p.host}) — ${p.project}`).join('\n')}`
}
