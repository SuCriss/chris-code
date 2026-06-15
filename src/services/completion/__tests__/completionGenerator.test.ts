import { describe, test, expect } from 'bun:test'
import {
  generateBashCompletion,
  generateZshCompletion,
  generateFishCompletion,
  type CommandInfo,
} from '../completionGenerator.js'

describe('completionGenerator', () => {
  const testCommands: CommandInfo[] = [
    { name: 'audit', description: 'Security audit' },
    { name: 'checkpoint', description: 'Save checkpoint' },
    { name: 'dream', description: 'Memory consolidation' },
  ]

  test('应该生成 Bash 补全脚本', () => {
    const script = generateBashCompletion('chris-code', testCommands)

    expect(script).toContain('_chris-code_completions')
    expect(script).toContain('audit checkpoint dream')
    expect(script).toContain('complete -F')
  })

  test('应该生成 Zsh 补全脚本', () => {
    const script = generateZshCompletion('chris-code', testCommands)

    expect(script).toContain('#compdef chris-code')
    expect(script).toContain('audit:Security audit')
    expect(script).toContain('checkpoint:Save checkpoint')
    expect(script).toContain('_chris-code')
  })

  test('应该生成 Fish 补全脚本', () => {
    const script = generateFishCompletion('chris-code', testCommands)

    expect(script).toContain('complete -c chris-code')
    expect(script).toContain('-a "audit"')
    expect(script).toContain('-d "Security audit"')
  })
})
