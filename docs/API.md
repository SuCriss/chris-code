# API Reference

Chris Code 工具和命令完整 API 参考。

## 📋 目录

- [核心命令](#核心命令)
- [内置工具](#内置工具)
- [记忆系统 API](#记忆系统-api)
- [安全扫描 API](#安全扫描-api)
- [协作模式 API](#协作模式-api)

---

## 核心命令

### `/audit` - 安全审计

扫描项目代码以检测安全漏洞。

**语法**：
```bash
/audit [path] [options]
```

**参数**：
- `path` (可选) - 扫描目标路径，默认当前目录

**选项**：
- `--fix` - 自动修复可修复的问题
- `--severity <level>` - 最低严重级别：low | medium | high | critical
- `--exclude <pattern>` - 排除文件模式
- `--report <file>` - 生成 HTML 报告

**示例**：
```bash
# 扫描整个项目
/audit

# 扫描特定目录
/audit src/

# 只显示高危和严重漏洞
/audit --severity high

# 自动修复
/audit --fix

# 生成报告
/audit --report security-report.html
```

**检测规则**：
- 硬编码密钥/凭据
- SQL 注入风险
- XSS 漏洞
- 命令注入
- 路径遍历
- 不安全的加密
- 敏感信息泄露

**返回**：
```typescript
interface AuditResult {
  totalIssues: number
  byLevel: {
    critical: number
    high: number
    medium: number
    low: number
  }
  issues: Array<{
    file: string
    line: number
    column: number
    level: 'critical' | 'high' | 'medium' | 'low'
    rule: string
    message: string
    fix?: string
  }>
}
```

---

### `/checkpoint` - 保存检查点

保存当前会话状态到持久记忆。

**语法**：
```bash
/checkpoint [message] [options]
```

**参数**：
- `message` (可选) - 检查点描述

**选项**：
- `--export <file>` - 导出为 JSON 文件
- `--tag <name>` - 添加标签

**示例**：
```bash
# 保存检查点
/checkpoint 完成用户认证模块

# 带标签
/checkpoint --tag milestone 完成 v1.0

# 导出
/checkpoint --export backup.json
```

**检查点内容**：
- 会话 ID
- 时间戳
- 项目状态
- 任务列表
- 关键决策
- 相关文件

---

### `/task` - 任务管理

管理开发任务树。

**语法**：
```bash
/task <command> [args]
```

**子命令**：

**`/task add <id> <description>`** - 添加任务
```bash
/task add AUTH 实现用户认证
/task add AUTH.LOGIN 登录功能
/task add AUTH.REGISTER 注册功能
```

**`/task done <id>`** - 标记完成
```bash
/task done AUTH.LOGIN
```

**`/task list`** - 显示任务列表
```bash
/task list
# 或简写
/task
```

**`/task remove <id>`** - 删除任务
```bash
/task remove AUTH.LOGIN
```

**任务树结构**：
```
AUTH
├── AUTH.LOGIN ✓
├── AUTH.REGISTER ☐
└── AUTH.RESET ☐
```

---

### `/dream` - 知识提取

从历史会话中提取可复用的知识。

**语法**：
```bash
/dream [options]
```

**选项**：
- `--sessions <count>` - 分析最近 N 个会话，默认 10
- `--output <file>` - 输出到文件

**示例**：
```bash
# 分析最近 10 个会话
/dream

# 分析最近 20 个会话
/dream --sessions 20

# 导出知识
/dream --output knowledge.md
```

**提取内容**：
- 设计模式
- 常用工作流
- 领域知识
- 最佳实践
- 常见问题解决方案

---

### `/distill` - 工作流学习

发现重复的工作流并建议自动化。

**语法**：
```bash
/distill [options]
```

**选项**：
- `--min-count <n>` - 最小重复次数，默认 3
- `--output <file>` - 输出工作流定义

**示例**：
```bash
# 发现重复工作流
/distill

# 只显示重复 5 次以上的
/distill --min-count 5

# 导出工作流
/distill --output workflows.json
```

**工作流示例**：
```
🔁 发现 3 个重复工作流：

1. TDD 流程 (12次)
   - 创建测试文件
   - 编写失败测试
   - 实现功能
   - 运行测试
   - 重构

2. API 开发 (8次)
   - 定义路由
   - 添加验证
   - 实现处理器
   - 编写测试
   - 更新文档

3. 组件开发 (6次)
   - 创建组件文件
   - 编写样式
   - 添加测试
   - 更新 Story
```

---

### `/collab` - 协作模式

LAN 协作功能。

**语法**：
```bash
/collab <command> [args]
```

**子命令**：

**`/collab start`** - 启动协作
```bash
/collab start
# 输出：
# 🌐 协作模式已启动
# 📡 广播地址：192.168.1.100:7337
# 🔗 连接码：ABC123
```

**`/collab peers`** - 查看对等方
```bash
/collab peers
# 输出：
# 👥 已连接的开发者：
#   - Alice (192.168.1.101)
#   - Bob (192.168.1.102)
```

**`/collab stop`** - 停止协作
```bash
/collab stop
```

**`/collab join <code>`** - 加入会话
```bash
/collab join ABC123
```

---

## 内置工具

### Read - 读取文件

读取文件内容。

**参数**：
```typescript
interface ReadParams {
  file_path: string       // 文件路径（绝对路径）
  offset?: number        // 起始行号（可选）
  limit?: number         // 读取行数（可选）
}
```

**示例**：
```typescript
// 读取整个文件
Read({ file_path: '/path/to/file.ts' })

// 读取前 100 行
Read({ file_path: '/path/to/file.ts', limit: 100 })

// 从第 50 行开始读 100 行
Read({ file_path: '/path/to/file.ts', offset: 50, limit: 100 })
```

---

### Write - 写入文件

创建或覆盖文件。

**参数**：
```typescript
interface WriteParams {
  file_path: string       // 文件路径（绝对路径）
  content: string         // 文件内容
}
```

**示例**：
```typescript
Write({
  file_path: '/path/to/file.ts',
  content: 'export const hello = "world"'
})
```

**注意**：
- 会覆盖已存在的文件
- 自动创建目录
- 大文件建议分块写入

---

### Edit - 编辑文件

精确替换文件内容。

**参数**：
```typescript
interface EditParams {
  file_path: string       // 文件路径
  old_string: string      // 要替换的内容（必须精确匹配）
  new_string: string      // 新内容
  replace_all?: boolean   // 是否替换所有匹配，默认 false
}
```

**示例**：
```typescript
// 替换单个匹配
Edit({
  file_path: '/path/to/file.ts',
  old_string: 'const x = 1',
  new_string: 'const x = 2'
})

// 替换所有匹配
Edit({
  file_path: '/path/to/file.ts',
  old_string: 'console.log',
  new_string: 'logger.info',
  replace_all: true
})
```

---

### Bash - 执行命令

执行 Shell 命令。

**参数**：
```typescript
interface BashParams {
  command: string                  // Shell 命令
  description: string              // 命令描述（必需）
  timeout?: number                 // 超时（毫秒），默认 120000
  run_in_background?: boolean      // 后台运行
}
```

**示例**：
```typescript
// 简单命令
Bash({
  command: 'ls -la',
  description: '列出文件'
})

// 后台任务
Bash({
  command: 'npm run dev',
  description: '启动开发服务器',
  run_in_background: true
})

// 长时间运行
Bash({
  command: 'npm run build',
  description: '构建项目',
  timeout: 300000  // 5 分钟
})
```

---

### Grep - 内容搜索

搜索文件内容。

**参数**：
```typescript
interface GrepParams {
  pattern: string                            // 正则表达式
  path?: string                             // 搜索路径
  glob?: string                             // 文件模式
  type?: string                             // 文件类型（js, ts, py 等）
  output_mode?: 'content' | 'files_with_matches' | 'count'
  context?: number                          // 上下文行数
  multiline?: boolean                       // 多行模式
  head_limit?: number                       // 限制结果数
}
```

**示例**：
```typescript
// 搜索内容
Grep({
  pattern: 'function.*test',
  output_mode: 'content'
})

// 只列出文件
Grep({
  pattern: 'TODO',
  output_mode: 'files_with_matches'
})

// 统计匹配数
Grep({
  pattern: 'console\.log',
  output_mode: 'count'
})

// 限制文件类型
Grep({
  pattern: 'import.*React',
  type: 'tsx',
  glob: 'src/**/*'
})
```

---

### Glob - 文件匹配

查找匹配的文件路径。

**参数**：
```typescript
interface GlobParams {
  pattern: string         // Glob 模式
  path?: string          // 搜索目录
}
```

**示例**：
```typescript
// 查找所有 TypeScript 文件
Glob({ pattern: '**/*.ts' })

// 查找测试文件
Glob({ pattern: '**/*.test.ts' })

// 特定目录
Glob({
  pattern: '*.tsx',
  path: '/path/to/src/components'
})
```

---

## 记忆系统 API

### memoryIndex

FTS5 全文搜索索引。

**方法**：

```typescript
class MemoryIndex {
  // 构建或重建索引
  buildIndex(memoryDir: string): Promise<void>
  
  // 搜索记忆
  search(query: string, limit?: number): Promise<SearchResult[]>
  
  // 添加记忆到索引
  addMemory(path: string, content: string): Promise<void>
  
  // 移除记忆
  removeMemory(path: string): Promise<void>
  
  // 获取统计信息
  getStats(): Promise<IndexStats>
}

interface SearchResult {
  path: string
  score: number
  snippet: string
  metadata?: Record<string, any>
}

interface IndexStats {
  totalEntries: number
  dbSize: number
  lastUpdated: Date
}
```

**使用示例**：
```typescript
import { MemoryIndex } from '@/memdir/memoryIndex'

const index = new MemoryIndex()

// 搜索
const results = await index.search('用户认证', 10)
for (const result of results) {
  console.log(`${result.path}: ${result.snippet}`)
}

// 统计
const stats = await index.getStats()
console.log(`记忆条目：${stats.totalEntries}`)
```

---

### checkpoint

检查点系统。

**方法**：

```typescript
// 保存检查点
function saveCheckpoint(
  message: string,
  options?: CheckpointOptions
): Promise<void>

// 加载检查点
function loadCheckpoint(
  sessionId: string
): Promise<Checkpoint | null>

// 列出检查点
function listCheckpoints(
  limit?: number
): Promise<CheckpointSummary[]>

interface CheckpointOptions {
  tag?: string
  export?: string
}

interface Checkpoint {
  sessionId: string
  timestamp: Date
  message: string
  tag?: string
  tasks: TaskTree
  files: string[]
  context: string
}
```

---

## 安全扫描 API

### scanner

安全漏洞扫描器。

**方法**：

```typescript
class SecurityScanner {
  // 扫描文件
  scanFile(path: string): Promise<Issue[]>
  
  // 扫描目录
  scanDirectory(
    path: string,
    options?: ScanOptions
  ): Promise<ScanResult>
  
  // 修复问题
  fix(issue: Issue): Promise<boolean>
}

interface ScanOptions {
  severity?: 'low' | 'medium' | 'high' | 'critical'
  exclude?: string[]
  rules?: string[]
}

interface Issue {
  file: string
  line: number
  column: number
  level: 'critical' | 'high' | 'medium' | 'low'
  rule: string
  message: string
  fix?: string
}

interface ScanResult {
  totalIssues: number
  byLevel: Record<string, number>
  issues: Issue[]
}
```

**使用示例**：
```typescript
import { SecurityScanner } from '@/services/security/scanner'

const scanner = new SecurityScanner()

// 扫描目录
const result = await scanner.scanDirectory('src/', {
  severity: 'high',
  exclude: ['*.test.ts']
})

console.log(`发现 ${result.totalIssues} 个问题`)

// 自动修复
for (const issue of result.issues) {
  if (issue.fix) {
    await scanner.fix(issue)
  }
}
```

---

## 协作模式 API

### collab

LAN 协作系统。

**方法**：

```typescript
class CollabSession {
  // 启动协作
  start(): Promise<string>  // 返回连接码
  
  // 停止协作
  stop(): Promise<void>
  
  // 加入会话
  join(code: string): Promise<void>
  
  // 获取对等方
  getPeers(): Promise<Peer[]>
  
  // 广播消息
  broadcast(message: Message): Promise<void>
}

interface Peer {
  id: string
  name: string
  address: string
  joinedAt: Date
}

interface Message {
  type: 'checkpoint' | 'task' | 'chat'
  data: any
  timestamp: Date
}
```

**使用示例**：
```typescript
import { CollabSession } from '@/services/collab/collab'

const session = new CollabSession()

// 启动
const code = await session.start()
console.log(`连接码：${code}`)

// 广播任务更新
await session.broadcast({
  type: 'task',
  data: { id: 'AUTH.LOGIN', status: 'done' },
  timestamp: new Date()
})

// 查看对等方
const peers = await session.getPeers()
console.log(`${peers.length} 个开发者在线`)
```

---

## 📚 相关文档

- [Performance Guide](PERFORMANCE.md)
- [Plugin Development](PLUGIN_GUIDE.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Architecture](../CLAUDE.md)

---

**最后更新**: 2026-06-15
