# Contributing to Chris Code

感谢你考虑为 Chris Code 做贡献！

## 开发环境设置

### 前置要求
- **Bun** ≥ 1.3.0（推荐）或 **Node.js** ≥ 18
- Git

### 安装
```bash
git clone https://github.com/SuCriss/chris-code.git
cd chris-code
bun install
bun run dev
```

### 测试
```bash
bun test              # 所有测试
bun run precheck      # typecheck + lint + test
```

## Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档
- `refactor`: 重构
- `test`: 测试

示例：`feat: add /export command`

## Pull Request

1. Fork 仓库
2. 创建分支：`git checkout -b feat/your-feature`
3. 提交：`git commit -m "feat: your feature"`
4. 推送：`git push origin feat/your-feature`
5. 创建 PR

**提交前必须运行 `bun run precheck` 并通过。**

## 项目结构

```
src/
├── commands/         # 斜杠命令
├── memdir/          # 记忆系统
├── services/        # 核心服务
└── tools/           # 内置工具
```

## 许可证

MIT License
