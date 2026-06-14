import type { Command } from '../../commands.js'

const task = {
  type: 'local',
  name: 'task',
  description:
    'Track tasks in a tree structure. Usage: /task [add|done|start] <id> <title>',
  supportsNonInteractive: true,
  argumentHint: '[add|done|start] <id> <title>',
  load: () => import('./task.js'),
} satisfies Command

export default task
