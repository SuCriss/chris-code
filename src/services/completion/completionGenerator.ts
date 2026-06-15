/**
 * Shell 命令自动补全生成器
 */

export type CompletionShell = 'bash' | 'zsh' | 'fish'

export type CommandInfo = {
  name: string
  description?: string
  args?: string[]
  flags?: Array<{ name: string; description?: string }>
}

/**
 * 生成 Bash 补全脚本
 */
export function generateBashCompletion(
  programName: string,
  commands: CommandInfo[],
): string {
  const commandNames = commands.map(c => c.name).join(' ')

  return `# ${programName} bash completion

_${programName}_completions() {
    local cur prev
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # 命令列表
    local commands="${commandNames}"

    # 如果是第一个参数，补全命令
    if [ \${COMP_CWORD} -eq 1 ]; then
        COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
        return 0
    fi

    return 0
}

complete -F _${programName}_completions ${programName}
`
}

/**
 * 生成 Zsh 补全脚本
 */
export function generateZshCompletion(
  programName: string,
  commands: CommandInfo[],
): string {
  const commandList = commands
    .map(c => `    '${c.name}:${c.description || c.name}'`)
    .join('\n')

  return `#compdef ${programName}

_${programName}() {
    local -a commands
    commands=(
${commandList}
    )

    _arguments -C \\
        '1: :->command' \\
        '*::arg:->args'

    case $state in
        command)
            _describe 'command' commands
            ;;
    esac
}

_${programName}
`
}

/**
 * 生成 Fish 补全脚本
 */
export function generateFishCompletion(
  programName: string,
  commands: CommandInfo[],
): string {
  const completions = commands
    .map(
      c =>
        `complete -c ${programName} -n "__fish_use_subcommand" -a "${c.name}" -d "${c.description || c.name}"`,
    )
    .join('\n')

  return `# ${programName} fish completion

${completions}
`
}

/**
 * 生成所有 Shell 的补全脚本
 */
export function generateAllCompletions(
  programName: string,
  commands: CommandInfo[],
): Record<CompletionShell, string> {
  return {
    bash: generateBashCompletion(programName, commands),
    zsh: generateZshCompletion(programName, commands),
    fish: generateFishCompletion(programName, commands),
  }
}
