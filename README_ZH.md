# Chris Code

> 开源 AI 编程助手，支持持久化记忆、安全审计和局域网协作。

[![GitHub Stars](https://img.shields.io/github/stars/SuCriss/chris-code?style=flat-square&logo=github)](https://github.com/SuCriss/chris-code/stargazers)
[![npm version](https://img.shields.io/npm/v/chris-code?style=flat-square&logo=npm)](https://www.npmjs.com/package/chris-code)
[![License](https://img.shields.io/github/license/SuCriss/chris-code?style=flat-square)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-black?style=flat-square&logo=bun)](https://bun.sh/)

[English](README.md) | 简体中文

## 快速开始

```bash
# 一键安装
curl -fsSL https://raw.githubusercontent.com/SuCriss/chris-code/main/install | bash

# 或通过 npm 安装
npm install -g chris-code

# 或通过 bun 安装
bun install -g chris-code
```

启动：

```bash
chris
```

首次运行：使用 `/login` 配置 LLM 提供商（支持 Anthropic、OpenAI、Gemini 或任何兼容 OpenAI 的 API）。

## 核心特性

### 🧠 持久化记忆系统
- **SQLite FTS5 全文搜索** — 毫秒级记忆检索，无需额外 API 调用
- **会话检查点** — `/checkpoint` 保存状态，下次自动恢复
- **任务树** — `/task` 跨会话追踪任务进度
- **知识提炼** — `/dream` 提取会话知识，`/distill` 发现可复用工作流

### 🔒 内置安全审计
```bash
/audit          # 扫描整个项目
/audit src/     # 扫描指定目录
```
检测：硬编码密钥、SQL 注入、XSS、弱加密、路径遍历等 20+ 种漏洞。

### 🤝 局域网协作
```bash
/collab start   # 启动局域网广播
/collab peers   # 查看已连接的开发者
/collab stop    # 停止协作
```
与同一网络的开发者共享 AI 会话。

### 🌐 多 LLM 支持
支持 Anthropic Claude、OpenAI GPT、Google Gemini、xAI Grok，以及任何 OpenAI 兼容 API。

### 🛠️ 60+ 内置工具
文件操作、Shell 命令、Web 搜索、代码智能分析、MCP 集成等。

## 为什么选择 Chris Code？

| 功能 | Chris Code | Claude Code | Aider |
|------|-----------|-------------|-------|
| 持久化记忆 | ✅ SQLite FTS5 | ❌ | ❌ |
| 会话恢复 | ✅ 自动检查点 | ❌ | ✅ |
| 安全审计 | ✅ 内置扫描器 | ❌ | ❌ |
| 局域网协作 | ✅ | ❌ | ❌ |
| 知识提炼 | ✅ /dream /distill | ❌ | ❌ |
| 多 LLM | ✅ 4+ 提供商 | ✅ Anthropic | ✅ 多模型 |
| 开源 | ✅ MIT | ❌ 部分开源 | ✅ Apache |

## 常用命令

| 命令 | 说明 |
|-----|------|
| `/audit` | 安全漏洞扫描 |
| `/checkpoint` | 保存会话检查点 |
| `/task` | 任务树管理 |
| `/dream` | 从会话中提取知识 |
| `/distill` | 发现可复用工作流 |
| `/collab` | 局域网协作模式 |
| `/login` | 配置 LLM 提供商 |
| `/compact` | 压缩对话上下文 |
| `/memory` | 浏览记忆文件 |
| `/review` | 代码审查 |

## 使用示例

### 持久化记忆
```bash
# 保存当前会话检查点
/checkpoint "完成了用户认证模块"

# 添加任务
/task add "实现支付接口"

# 查看任务进度
/task list
```

### 安全审计
```bash
# 扫描项目寻找安全问题
/audit

# 只扫描特定目录
/audit src/api/

# 扫描后自动修复
/audit --fix
```

### 知识提炼
```bash
# 从当前会话提取知识点
/dream

# 发现可复用的工作模式
/distill
```

## 架构

```
src/
├── memdir/           # 记忆系统（FTS5、检查点、路径）
├── services/
│   ├── security/     # 安全扫描器
│   ├── collab/       # 协作模式
│   ├── compact/      # 上下文压缩
│   └── SessionMemory/# 会话笔记
├── commands/         # 斜杠命令
├── components/       # React Ink UI
└── constants/        # 提示词、配置
```

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/SuCriss/chris-code.git
cd chris-code

# 安装依赖
bun install

# 开发模式（版本显示为 888）
bun run dev

# 构建生产版本
bun run build

# 运行测试
bun test

# 代码检查
bun run precheck
```

## 环境要求

- **Bun** ≥ 1.3.0（推荐）或 **Node.js** ≥ 18
- Git
- 支持的操作系统：macOS、Linux、Windows（WSL 或原生）

## 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md)。

常见贡献方向：
- 🐛 修复 bug
- ✨ 添加新功能
- 📝 改进文档
- 🌐 翻译
- 🧪 添加测试

## 致谢

本项目基于 [claude-code-best](https://github.com/claude-code-best/claude-code) 构建，新增功能：
- SQLite FTS5 持久化记忆
- 会话检查点和任务追踪
- 安全漏洞扫描器
- 局域网协作模式
- 知识提炼（Dream & Distill）

## 开源协议

MIT License - 详见 [LICENSE](LICENSE)

## 联系方式

- GitHub Issues: [提交问题](https://github.com/SuCriss/chris-code/issues)
- 讨论: [GitHub Discussions](https://github.com/SuCriss/chris-code/discussions)

---

如果觉得有用，请给个 ⭐️ Star！
