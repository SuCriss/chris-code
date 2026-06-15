# Chris Code

> Open-source AI coding agent with persistent memory, security audit, and collaboration mode.

[![GitHub Stars](https://img.shields.io/github/stars/SuCriss/chris-code?style=flat-square&logo=github)](https://github.com/SuCriss/chris-code/stargazers)
[![License](https://img.shields.io/github/license/SuCriss/chris-code?style=flat-square)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-black?style=flat-square&logo=bun)](https://bun.sh/)

## Quick Start

```bash
# One-line install
curl -fsSL https://raw.githubusercontent.com/SuCriss/chris-code/main/install | bash

# Or install via npm
npm install -g chris-code

# Or install via bun
bun install -g chris-code
```

Then just run:

```bash
chris
```

First run: use `/login` to configure your LLM provider (Anthropic, OpenAI, Gemini, or any compatible API).

## Features

### Persistent Memory System
- **SQLite FTS5 full-text search** — instant memory retrieval, no extra API calls
- **Session checkpoints** — `/checkpoint` saves state, auto-injects on resume
- **Task tree** — `/task` tracks progress across sessions
- **Dream & Distill** — `/dream` extracts knowledge from sessions, `/distill` finds reusable workflows

### Security Audit
```bash
/audit          # Scan project for vulnerabilities
/audit src/     # Scan specific directory
```
Detects: hardcoded secrets, SQL injection, XSS, weak crypto, path traversal, and more.

### Collaboration Mode
```bash
/collab start   # Start LAN broadcast
/collab peers   # See connected developers
/collab stop    # Stop
```
Share AI sessions with developers on the same network.

### Multi-Provider Support
Supports Anthropic, OpenAI, Gemini, Grok, and any OpenAI-compatible API via `/login`.

### Built-in Tools
40+ tools: file operations, shell commands, web search, code intelligence, MCP integration, and more.

## Commands

| Command | Description |
|---------|-------------|
| `/audit` | Security vulnerability scan |
| `/checkpoint` | Save session checkpoint |
| `/task` | Task tree management |
| `/dream` | Extract knowledge from sessions |
| `/distill` | Discover reusable workflows |
| `/collab` | LAN collaboration mode |
| `/login` | Configure LLM provider |
| `/compact` | Compress conversation context |
| `/memory` | Browse memory files |
| `/review` | Code review |

## Architecture

```
src/
├── memdir/           # Memory system (FTS5, checkpoint, paths)
├── services/
│   ├── security/     # Security scanner
│   ├── collab/       # Collaboration mode
│   ├── compact/      # Context compaction
│   └── SessionMemory/# Session notes
├── commands/         # Slash commands
├── components/       # React Ink UI
└── constants/        # Prompts, config
```

## Development

```bash
bun install           # Install dependencies
bun run dev           # Dev mode (version 888)
bun run build         # Build for production
```

## Credits

Built on top of [claude-code-best](https://github.com/claude-code-best/claude-code) with additional features:
- Persistent memory with SQLite FTS5
- Session checkpoints and task tracking
- Security audit scanner
- LAN collaboration mode
- Dream & Distill self-evolution

## License

MIT
