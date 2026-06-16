# Chris Code - AI Coding Assistant

Open-source AI coding agent with persistent memory, security audit, and collaboration mode.

## Features

- **Persistent Memory** — SQLite FTS5 full-text search for instant memory retrieval
- **Security Audit** — `/audit` scans for vulnerabilities
- **Multi-Provider** — Supports Anthropic, OpenAI, Gemini, Grok, and more
- **40+ Built-in Tools** — File ops, shell commands, web search, code intelligence

## Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `Chris Code: Start Session` | Launch Chris Code terminal | `Ctrl+Shift+C` |
| `Chris Code: Explain Selection` | Explain selected code | Right-click menu |
| `Chris Code: Fix Code` | Fix selected code | Right-click menu |

## Requirements

Install Chris Code CLI globally:

```bash
npm install -g chris-code
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `chris-code.cliPath` | `chris` | Path to the chris-code CLI binary |

## Links

- [GitHub](https://github.com/SuCriss/chris-code)
- [npm](https://www.npmjs.com/package/chris-code)
- [Issues](https://github.com/SuCriss/chris-code/issues)

## License

MIT
