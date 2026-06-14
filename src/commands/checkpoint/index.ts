import type { Command } from '../../commands.js'

const checkpoint = {
  type: 'local',
  name: 'checkpoint',
  description:
    'Save a session checkpoint with current state, task progress, and key files. Optional: /checkpoint <title>',
  supportsNonInteractive: true,
  argumentHint: '<optional session title>',
  load: () => import('./checkpoint.js'),
} satisfies Command

export default checkpoint
