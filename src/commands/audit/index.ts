import type { Command } from '../../commands.js'

const audit = {
  type: 'local',
  name: 'audit',
  description:
    'Scan project for security vulnerabilities (secrets, injection, XSS, weak crypto).',
  supportsNonInteractive: true,
  argumentHint: '[path]',
  load: () => import('./audit.js'),
} satisfies Command

export default audit
