import type { Command } from '../../commands.js'
const collab = {
  type: 'local',
  name: 'collab',
  description: 'Share AI sessions with developers on the same LAN.',
  supportsNonInteractive: true,
  argumentHint: '[start|stop|status|peers]',
  load: () => import('./collab.js'),
} satisfies Command
export default collab
