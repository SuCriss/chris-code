# 智能命令建议系统

## 功能概述

chris-code 现在具备智能命令建议功能，可以根据以下因素智能推荐命令：

1. **上下文感知推荐** - 根据当前工作目录的特征推荐相关命令
2. **命令关联学习** - 学习用户的命令使用模式，推荐常见的后续命令
3. **使用习惯学习** - 记录用户在特定上下文中的命令偏好

## 使用方法

### 1. 上下文感知推荐

系统会自动检测当前目录的特征：

- **Git 仓库** → 推荐 `commit`, `diff`, `commit-push-pr`, `branch`
- **Node.js 项目** (有 package.json) → 推荐 `audit`, `init`
- **TypeScript 项目** → 推荐 `audit`
- **Python 项目** → 推荐 `audit`
- **Docker 项目** → 推荐 `audit`

### 2. 命令关联学习

系统会自动学习你的命令使用模式：

```
输入 /audit 后经常使用 /checkpoint
→ 下次输入 / 时，/checkpoint 会排在前面
```

这个学习是自动的，无需手动配置。

### 3. 自动集成

智能建议已集成到命令输入系统中：

- 输入 `/` 时，推荐命令会自动排在前面
- 结合使用频率、时间衰减等因素综合排序

## 技术实现

### 核心模块

- `src/utils/suggestions/intelligentSuggestions.ts` - 智能建议核心逻辑
- `src/utils/suggestions/commandSuggestions.ts` - 已集成智能排序

### 数据存储

所有学习数据存储在全局配置中（`~/.claude/config.json`）：

```json
{
  "intelligentSuggestions": {
    "commandAssociations": {
      "audit": [
        {
          "command": "audit",
          "nextCommand": "checkpoint",
          "count": 5,
          "lastUsedAt": 1718452800000
        }
      ]
    },
    "lastCommand": "checkpoint",
    "contextPreferences": {
      "git,node,typescript": ["audit", "commit", "checkpoint"]
    }
  }
}
```

### API

#### recordCommandAssociation(current, next)
记录命令关联（用户依次使用了两个命令）

```typescript
import { recordCommandAssociation } from './utils/suggestions/intelligentSuggestions.js'

// 用户先执行 /audit，然后执行 /checkpoint
recordCommandAssociation('audit', 'checkpoint')
```

#### getCommandAssociations(lastCommand)
获取命令关联建议

```typescript
import { getCommandAssociations } from './utils/suggestions/intelligentSuggestions.js'

const suggestions = getCommandAssociations('audit')
// 返回: ['checkpoint', 'task', ...]
```

#### detectContext(cwd)
检测当前工作目录的上下文信息

```typescript
import { detectContext } from './utils/suggestions/intelligentSuggestions.js'

const context = detectContext('/path/to/project')
// 返回: { isGitRepo: true, hasPackageJson: true, ... }
```

#### getContextBasedRecommendations(context, commands)
基于上下文获取推荐命令

```typescript
import { getContextBasedRecommendations } from './utils/suggestions/intelligentSuggestions.js'

const recommendations = getContextBasedRecommendations(context, allCommands)
// 返回: ['commit', 'audit', ...]
```

## 时间衰减

系统使用 **7天半衰期** 的时间衰减算法：

- 7 天前的使用记录权重降为 50%
- 14 天前的权重降为 25%
- 最小权重保持在 10%，避免完全丢失历史数据

## 隐私说明

- 所有学习数据存储在本地 `~/.claude/config.json`
- 不会上传到任何服务器
- 可以通过删除配置中的 `intelligentSuggestions` 字段清除数据

## 未来改进

可能的增强方向：

1. 基于文件内容的更精细上下文检测
2. 命令参数学习（记住常用的命令参数）
3. 时间模式识别（工作日 vs 周末的不同使用习惯）
4. 跨项目的命令偏好同步
