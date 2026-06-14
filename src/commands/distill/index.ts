import type { Command } from '../../commands.js'

const distill = {
  type: 'local',
  name: 'distill',
  description:
    'Discover repeated workflows from recent sessions and suggest reusable skills.',
  supportsNonInteractive: true,
  argumentHint: '',
  load: () => import('./distill.js'),
} satisfies Command

export default distill
