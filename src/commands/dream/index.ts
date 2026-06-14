import type { Command } from '../../commands.js'

const dream = {
  type: 'local',
  name: 'dream',
  description:
    'Scan recent sessions, extract persistent knowledge to memory, clean outdated entries.',
  supportsNonInteractive: true,
  argumentHint: '',
  load: () => import('./dream.js'),
} satisfies Command

export default dream
