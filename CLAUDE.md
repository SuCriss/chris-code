# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Chris Code** — open-source AI coding agent with persistent memory, security audit, and collaboration mode. Built on claude-code-best with additional features.

TypeScript strict mode is enforced — **`bun run precheck` 必须零错误通过**（包含 typecheck + lint fix + test）。

## Git Commit Message Convention

使用 **Conventional Commits** 规范：

```
<type>: <描述>
```

常见 type：`feat`、`fix`、`docs`、`chore`、`refactor`

## Commands

```bash
# Install dependencies
bun install

# Dev mode
bun run dev

# Build
bun run build

# Test
bun test                                    # run all tests
bun test src/utils/__tests__/hash.test.ts   # run single file

# Lint & Format (Biome)
bun run lint              # lint check
bun run lint:fix          # auto-fix
bun run format            # format all
bun run check             # lint + format check
bun run check:fix         # auto-fix all

# Full check (typecheck + lint fix + test)
bun run precheck
```

## Architecture

### Runtime & Build

- **Runtime**: Bun (not Node.js). All imports, builds, and execution use Bun APIs.
- **Build**: `build.ts` 执行 `Bun.build()` with `splitting: true`，入口 `src/entrypoints/cli.tsx`，输出 `dist/cli.js` + chunk files。
- **Module system**: ESM (`"type": "module"`), TSX with `react-jsx` transform.
- **Monorepo**: Bun workspaces — 17 workspace packages in `packages/`.
- **Lint/Format**: Biome (`biome.json`).
- **Defines**: 集中管理在 `scripts/defines.ts`。

### Core Loop

- **`src/query.ts`** — Main API query function. Handles streaming, tool calls, conversation turn loop.
- **`src/QueryEngine.ts`** — Higher-level orchestrator. Manages conversation state, compaction, attribution.
- **`src/screens/REPL.tsx`** — Interactive REPL screen (React/Ink).

### API Layer

- **`src/services/api/claude.ts`** — Core API client.
- **7 providers**: `firstParty` (Anthropic), `bedrock` (AWS), `vertex` (Google), `foundry`, `openai`, `gemini`, `grok` (xAI).

### Tool System

- **`src/Tool.ts`** — Tool interface definition.
- **`src/tools.ts`** — Tool registry. Tools from `@chris-code/builtin-tools`.
- **`packages/builtin-tools/src/tools/`** — 60 tool directories.

### Memory System (Chris Code additions)

- **`src/memdir/memoryIndex.ts`** — SQLite FTS5 full-text search index for memory files. Uses `bun:sqlite` (zero deps). DB at `~/.claude/memory-index.db`.
- **`src/memdir/checkpoint.ts`** — Session checkpoint + task tree system. Saves `checkpoint.md` and `tasks.md` to memory dir.
- **`src/memdir/findRelevantMemories.ts`** — FTS5-first memory retrieval, Sonnet side-query fallback.
- **`src/memdir/memdir.ts`** — Memory prompt builder. Auto-builds FTS5 index on startup. Injects checkpoint context on session resume.
- **`src/memdir/memoryScan.ts`** — Scans memory directory for `.md` files, reads frontmatter.
- **`src/memdir/paths.ts`** — Memory directory path resolution.

### Security Scanner (Chris Code addition)

- **`src/services/security/scanner.ts`** — Regex-based security vulnerability scanner. Detects hardcoded secrets, SQL injection, XSS, weak crypto, path traversal, etc.
- **`src/commands/audit/`** — `/audit` command.

### Collaboration Mode (Chris Code addition)

- **`src/services/collab/collab.ts`** — LAN collaboration framework. UDP broadcast + TCP session sync (stub).
- **`src/commands/collab/`** — `/collab` command.

### Commands System

- **`src/commands.ts`** — Command registry. All slash commands listed here.
- **`src/commands/*/`** — Individual command implementations.
- Chris Code commands: `/audit`, `/checkpoint`, `/task`, `/dream`, `/distill`, `/collab`

### UI Layer (Ink)

- **`packages/@ant/ink/`** — Custom Ink framework (forked).
- **`src/components/`** — React/Ink UI components.
- **`src/components/LogoV2/Clawd.tsx`** — Chris Code avatar (code chip design).

### State Management

- **`src/state/AppState.tsx`** — Central app state.
- **`src/bootstrap/state.ts`** — Module-level singletons for session-global state.

### Workspace Packages

| Package | 说明 |
|---------|------|
| `packages/@ant/ink/` | Forked Ink 框架 |
| `packages/builtin-tools/` | 内置工具集（60 个 tool） |
| `packages/agent-tools/` | Agent 工具集 |
| `packages/mcp-client/` | MCP 客户端库 |
| `packages/remote-control-server/` | Remote Control Server |
| `packages/acp-link/` | ACP 代理服务器 |

### Feature Flags

Feature flags via `import { feature } from 'bun:bundle'`. Enable via `FEATURE_<NAME>=1`.

### Multi-API 兼容层

所有兼容层采用流适配器模式。通过 `/login` 命令配置。
- OpenAI: `CLAUDE_CODE_USE_OPENAI=1`
- Gemini: `CLAUDE_CODE_USE_GEMINI=1`
- Grok: `CLAUDE_CODE_USE_GROK=1`
