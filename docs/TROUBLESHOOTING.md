# Troubleshooting Guide

Chris Code 常见问题排查和解决方案。

## 📋 目录

- [安装问题](#安装问题)
- [启动问题](#启动问题)
- [性能问题](#性能问题)
- [记忆系统问题](#记忆系统问题)
- [安全扫描问题](#安全扫描问题)
- [协作模式问题](#协作模式问题)
- [API 连接问题](#api-连接问题)

---

## 安装问题

### 问题：npm install 失败

**症状**：
```bash
npm install -g chris-code
# Error: EACCES: permission denied
```

**解决方案**：

**选项 1：使用 sudo（Linux/macOS）**
```bash
sudo npm install -g chris-code
```

**选项 2：修改 npm 全局目录（推荐）**
```bash
# 创建全局目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# 添加到 PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 重新安装
npm install -g chris-code
```

**选项 3：使用 Bun**
```bash
bun install -g chris-code
```

---

### 问题：命令未找到

**症状**：
```bash
chris-code
# command not found: chris-code
```

**诊断**：
```bash
# 检查是否安装成功
npm list -g chris-code

# 检查 PATH
echo $PATH

# 查找安装位置
which chris-code
npm bin -g
```

**解决方案**：
```bash
# 添加 npm 全局 bin 目录到 PATH
export PATH="$(npm bin -g):$PATH"

# 永久生效
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

### 问题：Windows 上运行失败

**症状**：
```powershell
chris-code
# 'chris-code' 不是内部或外部命令
```

**解决方案**：

**选项 1：使用完整路径**
```powershell
# 查找安装位置
npm root -g
# 运行
node "C:\Users\<user>\AppData\Roaming\npm\node_modules\chris-code\dist\cli-node.js"
```

**选项 2：添加到 PATH**
```powershell
# 获取 npm 全局目录
$npmPath = npm bin -g
# 添加到系统 PATH（需要管理员权限）
[Environment]::SetEnvironmentVariable("Path", "$env:Path;$npmPath", "User")
```

**选项 3：使用 WSL**
```bash
# 在 WSL 中安装
npm install -g chris-code
chris-code
```

---

## 启动问题

### 问题：启动时卡住

**症状**：
```bash
chris-code
# 长时间无响应
```

**诊断**：
```bash
# 启用详细日志
chris-code --verbose

# 检查进程
ps aux | grep chris

# 检查端口占用
lsof -i :37777
```

**可能原因和解决方案**：

**1. FTS5 索引构建中**
- 首次启动会构建索引，大型项目可能需要 1-2 分钟
- 等待完成或按 Ctrl+C 取消

**2. 记忆目录损坏**
```bash
# 备份记忆
cp -r ~/.claude/memory ~/.claude/memory.backup

# 重建索引
rm ~/.claude/memory-index.db

# 重新启动
chris-code
```

**3. 端口冲突**
```bash
# 修改端口
export CHRIS_CODE_PORT=38888
chris-code
```

---

### 问题：启动后立即崩溃

**症状**：
```bash
chris-code
# Segmentation fault
# 或
# Error: Cannot find module '...'
```

**诊断**：
```bash
# 检查错误日志
cat ~/.claude/logs/error.log

# 检查 Node 版本
node --version  # 需要 >= 18

# 检查 Bun 版本
bun --version   # 需要 >= 1.3
```

**解决方案**：

**1. 更新 Node.js**
```bash
# 使用 nvm
nvm install 20
nvm use 20

# 重新安装
npm install -g chris-code
```

**2. 清除缓存**
```bash
# npm 缓存
npm cache clean --force

# Bun 缓存
rm -rf ~/.bun/install/cache

# 重新安装
npm install -g chris-code
```

**3. 重新构建**
```bash
# 从源码构建
git clone https://github.com/SuCriss/chris-code.git
cd chris-code
bun install
bun run build
bun link
```

---

## 性能问题

### 问题：启动速度慢

**症状**：启动超过 5 秒

**诊断**：
```bash
# 测量启动时间
time chris-code --version

# 分析瓶颈
chris-code --profile
```

**优化方案**：

**1. 清理旧记忆**
```bash
# 删除 30 天前的记忆
chris-code
> /memory clean --older-than 30d
```

**2. 禁用自动功能**
```bash
# 禁用自动 dream
export CHRIS_CODE_DISABLE_AUTO_DREAM=1

# 禁用遥测
export CHRIS_CODE_DISABLE_TELEMETRY=1
```

**3. 使用 SSD**
- 将 `~/.claude/` 移动到 SSD
```bash
# 创建符号链接
mv ~/.claude /path/to/ssd/.claude
ln -s /path/to/ssd/.claude ~/.claude
```

---

### 问题：内存占用过高

**症状**：Chris Code 占用 > 1GB 内存

**诊断**：
```bash
# 查看内存使用
chris-code
> /profile memory

# 系统监控
top -p $(pgrep -f chris-code)
```

**解决方案**：

**1. 手动压缩上下文**
```bash
> /compact
```

**2. 减少记忆条目**
```bash
> /memory clean --older-than 14d
```

**3. 调整配置**
```json
// ~/.claude/settings.json
{
  "performance": {
    "maxMemoryEntries": 3000,
    "compactionThreshold": 0.6
  }
}
```

**4. 重启会话**
```bash
# 简单粗暴但有效
exit
chris-code
```

---

### 问题：响应速度慢

**症状**：命令执行 > 5 秒才有响应

**诊断**：
```bash
> /profile report
```

**可能原因和解决方案**：

**1. 网络延迟**
```bash
# 测试 API 延迟
curl -w "@-" -o /dev/null -s https://api.anthropic.com << 'EOF'
time_total: %{time_total}\n
EOF

# 切换 API 提供商
> /login
# 选择延迟低的提供商
```

**2. FTS5 搜索慢**
```bash
# 重建索引
rm ~/.claude/memory-index.db
# 重启 chris-code
```

**3. 大文件操作**
```bash
# 避免一次性读取大文件
# ❌ 慢
Read({ file_path: 'huge-bundle.js' })

# ✅ 快
Read({ file_path: 'huge-bundle.js', limit: 100 })
```

---

## 记忆系统问题

### 问题：记忆搜索无结果

**症状**：
```bash
> /memory search "用户认证"
# 无结果
```

**诊断**：
```bash
# 检查记忆文件
ls ~/.claude/projects/*/memory/

# 检查索引
sqlite3 ~/.claude/memory-index.db "SELECT COUNT(*) FROM memories"
```

**解决方案**：

**1. 重建索引**
```bash
rm ~/.claude/memory-index.db
# 重启 chris-code，索引会自动重建
```

**2. 检查记忆文件格式**
```bash
# 记忆文件需要 frontmatter
cat ~/.claude/projects/demo/memory/auth.md

# 正确格式：
# ---
# name: auth-implementation
# description: 用户认证实现
# ---
# 
# 内容...
```

**3. 手动添加记忆**
```bash
> /checkpoint 完成用户认证
```

---

### 问题：检查点未保存

**症状**：
```bash
> /checkpoint 完成功能
# ✓ 保存成功

# 但重启后丢失
```

**诊断**：
```bash
# 检查检查点文件
ls ~/.claude/projects/*/memory/checkpoint.md

# 检查权限
ls -la ~/.claude/projects/*/memory/
```

**解决方案**：

**1. 检查磁盘空间**
```bash
df -h ~
```

**2. 检查权限**
```bash
chmod -R u+w ~/.claude/
```

**3. 手动导出检查点**
```bash
> /checkpoint --export backup.json
```

---

### 问题：任务列表混乱

**症状**：任务显示不正确或重复

**诊断**：
```bash
# 检查任务文件
cat ~/.claude/projects/*/memory/tasks.md
```

**解决方案**：

**1. 清理任务**
```bash
# 删除所有任务
rm ~/.claude/projects/*/memory/tasks.md

# 重新创建
> /task add ROOT 主任务
```

**2. 手动编辑任务文件**
```bash
# 编辑任务文件
vi ~/.claude/projects/current/memory/tasks.md

# 确保格式正确：
# - [ ] TASK_ID 任务描述
# - [x] TASK_ID 已完成任务
```

---

## 安全扫描问题

### 问题：扫描无结果

**症状**：
```bash
> /audit src/
# ✓ 扫描完成，未发现问题

# 但代码确实有安全问题
```

**诊断**：
```bash
# 检查扫描规则
chris-code
> /audit --help

# 手动测试规则
grep -r "password.*=.*['\"]" src/
```

**可能原因**：

**1. 文件被排除**
- 检查 `.gitignore` 是否排除了要扫描的文件

**2. 扫描级别过高**
```bash
# 降低级别
> /audit --severity low
```

**3. 规则未启用**
```bash
# 查看可用规则
> /audit --list-rules

# 启用特定规则
> /audit --rules hardcoded-secrets,sql-injection
```

---

### 问题：误报过多

**症状**：扫描报告大量不相关的问题

**解决方案**：

**1. 排除测试文件**
```bash
> /audit --exclude "*.test.ts,*.spec.ts"
```

**2. 调整严重级别**
```bash
> /audit --severity high
```

**3. 添加白名单注释**
```typescript
// chris-code-ignore: hardcoded-secret (这是测试密钥)
const TEST_API_KEY = 'test-key-12345'
```

---

## 协作模式问题

### 问题：无法连接对等方

**症状**：
```bash
> /collab start
# ✓ 协作模式已启动

> /collab peers
# 无对等方
```

**诊断**：
```bash
# 检查网络连接
ping <对方 IP>

# 检查防火墙
# Windows
netsh advfirewall firewall show rule name=all | grep 7337

# Linux
sudo iptables -L | grep 7337

# macOS
sudo pfctl -s rules | grep 7337
```

**解决方案**：

**1. 开放端口**
```bash
# Windows（管理员权限）
netsh advfirewall firewall add rule name="Chris Code Collab" dir=in action=allow protocol=UDP localport=7337

# Linux
sudo ufw allow 7337/udp

# macOS
# 系统偏好设置 → 安全性与隐私 → 防火墙 → 防火墙选项
# 添加 chris-code 到允许列表
```

**2. 检查 VPN**
- 某些 VPN 会阻止 LAN 广播
- 临时禁用 VPN 测试

**3. 使用直接连接**
```bash
# 获取本机 IP
ifconfig | grep "inet "

# 对方直接连接
> /collab connect <your-ip>:7337
```

---

### 问题：连接中断

**症状**：协作会话突然断开

**可能原因**：

**1. 网络不稳定**
- 使用有线连接
- 靠近路由器

**2. 电源管理**
```bash
# 禁用网络适配器的电源管理（Windows）
# 设备管理器 → 网络适配器 → 属性 → 电源管理
# 取消勾选"允许计算机关闭此设备以节约电源"
```

**3. 超时设置**
```json
// ~/.claude/settings.json
{
  "collab": {
    "timeout": 60000,        // 60 秒
    "keepAlive": 30000       // 30 秒心跳
  }
}
```

---

## API 连接问题

### 问题：API 调用失败

**症状**：
```bash
chris-code
# Error: API request failed
# Error: Invalid API key
```

**解决方案**：

**1. 检查 API 密钥**
```bash
> /login
# 重新输入 API 密钥

# 或设置环境变量
export ANTHROPIC_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
```

**2. 检查网络连接**
```bash
# 测试连接
curl https://api.anthropic.com

# 设置代理
export HTTP_PROXY=http://proxy:8080
export HTTPS_PROXY=http://proxy:8080
```

**3. 切换 API 提供商**
```bash
> /login
# 选择不同的提供商（Anthropic, OpenAI, Gemini 等）
```

---

### 问题：API 限流

**症状**：
```bash
# Error: Rate limit exceeded
```

**解决方案**：

**1. 等待重试**
- API 限流通常会在几分钟后恢复

**2. 减少并发请求**
```json
// ~/.claude/settings.json
{
  "api": {
    "maxConcurrent": 2,
    "retryDelay": 5000
  }
}
```

**3. 升级 API 套餐**
- 联系 API 提供商升级配额

---

### 问题：代理设置不生效

**症状**：设置了代理但仍无法连接

**解决方案**：

**1. 使用正确的代理格式**
```bash
# HTTP 代理
export HTTP_PROXY=http://user:pass@proxy.com:8080

# HTTPS 代理
export HTTPS_PROXY=https://user:pass@proxy.com:8080

# SOCKS5 代理
export ALL_PROXY=socks5://proxy.com:1080
```

**2. 添加 NO_PROXY**
```bash
export NO_PROXY=localhost,127.0.0.1
```

**3. 使用配置文件**
```json
// ~/.claude/settings.json
{
  "proxy": {
    "http": "http://proxy.com:8080",
    "https": "https://proxy.com:8080"
  }
}
```

---

## 日志和调试

### 启用详细日志

```bash
# 启动时启用
chris-code --verbose

# 或设置环境变量
export CHRIS_CODE_LOG_LEVEL=debug
chris-code
```

### 查看日志文件

```bash
# 错误日志
cat ~/.claude/logs/error.log

# 完整日志
cat ~/.claude/logs/chris-code.log

# 实时查看
tail -f ~/.claude/logs/chris-code.log
```

### 生成诊断报告

```bash
# 收集系统信息
chris-code --diagnose > diagnose.txt

# 报告包含：
# - 版本信息
# - 系统环境
# - 配置文件
# - 最近错误日志
# - 性能指标
```

---

## 获取帮助

### 社区支持

- **GitHub Issues**: https://github.com/SuCriss/chris-code/issues
- **讨论区**: https://github.com/SuCriss/chris-code/discussions

### 报告 Bug

提交 issue 时请包含：
1. Chris Code 版本（`chris-code --version`）
2. 操作系统和版本
3. 复现步骤
4. 错误日志
5. 诊断报告（`chris-code --diagnose`）

### 功能请求

在 GitHub Discussions 中提出功能建议，包含：
1. 功能描述
2. 使用场景
3. 预期行为
4. 相关示例

---

## 📚 相关文档

- [API Reference](API.md)
- [Performance Guide](PERFORMANCE.md)
- [Architecture](../CLAUDE.md)

---

**最后更新**: 2026-06-15
