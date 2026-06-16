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

- **Runtime**: Bun (primary) 和 Node.js (npm 包)。所有 imports、builds 和 execution 使用 Bun APIs。
- **Build**: `build.ts` 执行 `Bun.build()` with `splitting: true`，入口 `src/entrypoints/cli.tsx`，输出 `dist/cli.js` + chunk files。Build 后会 patch `import.meta.require` 和 `globalThis.Bun` 以兼容 Node.js。
- **Module system**: ESM (`"type": "module"`), TSX with `react-jsx` transform.
- **Monorepo**: Bun workspaces — 11 workspace packages in `packages/`.
- **Lint/Format**: Biome (`biome.json`)。
- **Defines**: 集中管理在 `scripts/defines.ts`，包括 `MACRO.*` 宏和 `DEFAULT_BUILD_FEATURES`。

### Dual Runtime Support

Build 后的产物同时支持 Bun 和 Node.js：
- `dist/cli-bun.js` — Bun shebang 入口
- `dist/cli-node.js` — Node.js shebang 入口
- `src/memdir/memoryIndex.ts` — SQLite 层根据运行时选择 `bun:sqlite` 或 `libsql`

### Core Loop

- **`src/query.ts`** — Main API query function. Handles streaming, tool calls, conversation turn loop.
- **`src/QueryEngine.ts`** — Higher-level orchestrator. Manages conversation state, compaction, attribution.
- **`src/screens/REPL.tsx`** — Interactive REPL screen (React/Ink)。

### API Layer

- **`src/services/api/claude.ts`** — Core API client.
- **7 providers**: `firstParty` (Anthropic), `bedrock` (AWS), `vertex` (Google), `foundry`, `openai`, `gemini`, `grok` (xAI)。
- **OpenAI 兼容层**: `src/services/api/openai/` — 流适配器模式，通过 `/login` 命令配置。
- **Gemini 兼容层**: `src/services/api/gemini/`
- **Grok 兼容层**: `src/services/api/grok/`

### Tool System

- **`src/Tool.ts`** — Tool interface definition.
- **`src/tools.ts`** — Tool registry. Tools from `@chris-code/builtin-tools`.
- **`packages/builtin-tools/src/tools/`** — 60+ tool directories.

### Memory System (Chris Code additions)

- **`src/memdir/memoryIndex.ts`** — SQLite FTS5 full-text search index for memory files. Uses `bun:sqlite` (zero deps)。DB at `~/.claude/memory-index.db`。
- **`src/memdir/checkpoint.ts`** — Session checkpoint + task tree system. Saves `checkpoint.md` and `tasks.md` to memory dir。
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
- **`src/components/LogoV2/Clawd.tsx`** — Chris Code avatar (code chip design)。

### State Management

- **`src/state/AppState.tsx`** — Central app state.
- **`src/bootstrap/state.ts`** — Module-level singletons for session-global state.

### Workspace Packages

| Package | 说明 |
|---------|------|
| `packages/@ant/ink/` | Forked Ink 框架 |
| `packages/builtin-tools/` | 内置工具集（60+ 个 tool） |
| `packages/agent-tools/` | Agent 工具集 |
| `packages/mcp-client/` | MCP 客户端库 |
| `packages/remote-control-server/` | Remote Control Server |
| `packages/acp-link/` | ACP 代理服务器 |
| `packages/weixin/` | 微信集成 |
| `packages/audio-capture-napi/` | 音频捕获 N-API 模块 |
| `packages/image-processor-napi/` | 图像处理 N-API 模块 |
| `packages/color-diff-napi/` | 颜色差异 N-API 模块 |
| `packages/modifiers-napi/` | 修饰键 N-API 模块 |
| `packages/url-handler-napi/` | URL 处理 N-API 模块 |

### Feature Flags

Feature flags via `import { feature } from 'bun:bundle'`。Enable via `FEATURE_<NAME>=1`。

默认启用的 feature flags 定义在 `scripts/defines.ts` 的 `DEFAULT_BUILD_FEATURES` 中，包括：
- `BUDDY` — 陪伴宠物角色
- `BRIDGE_MODE` — Remote Control / Bridge 模式
- `VOICE_MODE` — Push-to-Talk 语音输入模式
- `AGENT_TRIGGERS` — 本地 Agent 触发器
- `ULTRATHINK` — 超深度思考模式
- `DAEMON` — 守护进程模式
- `ACP` — ACP 代理协议
- `SSH_REMOTE` — SSH 远程连接
- `AUTOFIX_PR` — /autofix-pr 命令

### Multi-API 兼容层

所有兼容层采用流适配器模式。通过 `/login` 命令配置。
- OpenAI: `CLAUDE_CODE_USE_OPENAI=1`
- Gemini: `CLAUDE_CODE_USE_GEMINI=1`
- Grok: `CLAUDE_CODE_USE_GROK=1`

### Entrypoints

- **`src/entrypoints/cli.tsx`** — CLI 主入口，包含 fast-path 优化（--version、--daemon-worker、--acp 等）。
- **`src/entrypoints/init.ts`** — 初始化逻辑。
- **`src/entrypoints/mcp.ts`** — MCP 服务器入口。
- **`src/main.tsx`** — Commander 命令行定义，REPL 启动逻辑。

### Key Directories

```
src/
├── entrypoints/       # 入口文件 (cli.tsx, init.ts, mcp.ts)
├── commands/          # Slash 命令实现
├── services/          # 服务层
│   ├── api/           # API 客户端 (claude, openai, gemini, grok)
│   ├── security/      # 安全扫描器
│   ├── collab/        # 协作模式
│   ├── compact/       # 上下文压缩
│   ├── analytics/     # 遥测与分析
│   ├── mcp/           # MCP 服务端
│   └── acp/           # ACP 代理协议
├── memdir/            # 记忆系统 (FTS5, checkpoint, paths)
├── components/        # React/Ink UI 组件
├── state/             # 状态管理
├── utils/             # 工具函数
├── constants/         # 提示词、配置
└── bootstrap/         # 启动初始化
```

### Pre-commit Hooks

项目使用 Husky + lint-staged。提交时自动对 `*.{ts,tsx,js,mjs,jsx}` 文件运行 `biome check --fix`。
