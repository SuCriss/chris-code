# Chris Code 演示视频方案

## 视频概览
- **时长**: 3-5 分钟
- **风格**: 技术演示 + 实战场景
- **目标受众**: 开发者、AI 工具使用者

## 快速开始方案（推荐）

### 方案一：1分钟终端演示 GIF
**适合**: GitHub README, 社交媒体
**工具**: Asciinema → agg (转 GIF)
**时间成本**: 30 分钟

```bash
# 安装工具
npm install -g asciinema
cargo install --git https://github.com/asciinema/agg

# 录制
asciinema rec demo.cast

# 转换为 GIF
agg demo.cast demo.gif
```

**演示内容**:
```bash
# 场景 1: 启动 (5s)
chris-code

# 场景 2: 创建项目 (15s)
> 创建一个 TypeScript + Express 项目

# 场景 3: 安全扫描 (10s)
> /audit src/

# 场景 4: 保存检查点 (10s)
> /checkpoint 完成基础框架

# 场景 5: 任务追踪 (10s)
> /task add SERVER 服务器开发
> /task

# 结尾 (5s)
✨ Chris Code - AI 编程助手
```

---

### 方案二：3分钟完整演示视频
**适合**: 哔哩哔哩、YouTube
**工具**: OBS Studio + DaVinci Resolve (免费)
**时间成本**: 4-6 小时

#### 分镜脚本

**[0:00-0:15] 开场动画**
- Logo 淡入
- 项目名称: Chris Code v1.0.2
- Slogan: AI 编程助手，持久记忆

**[0:15-0:45] 核心特性快速预览**
分屏展示：
```
左侧终端                    右侧说明
─────────────────────────────────────
chris-code 启动          → ✨ 零配置启动
创建项目代码生成中...     → 🤖 智能代码生成
/checkpoint 保存         → 💾 持久化记忆
/audit 扫描中...         → 🔒 安全审计
/distill 分析中...       → 🎯 工作流学习
```

**[0:45-1:30] 实战演示：持久化记忆**
```bash
# Session 1
用户: 创建一个用户认证模块
AI: [生成代码...]
用户: /checkpoint 完成基础认证

# 关闭终端，重新打开
# Session 2 (新会话)
用户: 继续完成密码加密功能
AI: 我记得你之前完成了基础认证，现在添加加密...
[展示 AI 能够记住之前的上下文]
```

**[1:30-2:10] 安全审计功能**
```bash
# 演示扫描含漏洞的代码
/audit src/

# 展示检测结果
✗ 发现 3 个安全问题:
  1. 硬编码 API Key (config.ts:12)
  2. SQL 注入风险 (db.ts:45)
  3. XSS 漏洞 (render.ts:78)

# AI 自动修复
用户: 修复这些安全问题
[展示修复过程]
```

**[2:10-2:50] 智能工作流学习**
```bash
/distill

# 展示分析结果
🔬 分析了 8 个历史会话
发现 3 个重复工作流:
  • TDD 流程 (12次)
  • 批量重构 (8次)
  • API 开发 (6次)

[可视化展示工作流程图]
```

**[2:50-3:00] 结尾 CTA**
```
✨ Chris Code
开源 | MIT License

npm install -g chris-code

GitHub: [链接]
文档: [链接]
```

---

## 录制准备清单

### 环境配置
```bash
# 1. 清理演示环境
rm -rf ~/.claude/projects/demo
mkdir -p ~/.claude/projects/demo

# 2. 准备示例项目（含安全漏洞）
cat > demo-project/config.ts << 'DEMO'
export const config = {
  apiKey: 'sk-1234567890abcdef', // 硬编码密钥
  dbHost: 'localhost'
}
DEMO

cat > demo-project/db.ts << 'DEMO'
export function query(sql: string) {
  return db.raw(sql) // SQL 注入风险
}
DEMO

# 3. 配置好看的终端主题
# 推荐: Dracula / Nord / One Dark
```

### 终端美化
```bash
# .bashrc 或 .zshrc 添加
export PS1="\[\033[36m\]➜\[\033[0m\] \[\033[33m\]\w\[\033[0m\] "

# 设置终端大小 (适合录制)
# 推荐: 80x24 或 100x30
```

### 测试脚本
```bash
# test-demo.sh - 运行一遍确保流畅
#!/bin/bash
echo "测试演示流程..."
chris-code << 'EOF'
创建一个 TypeScript 项目
