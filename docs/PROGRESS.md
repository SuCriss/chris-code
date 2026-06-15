# 进度指示器系统

进度指示器系统为长时间运行的命令提供统一的进度反馈机制。

## 架构设计

### 核心组件

1. **ProgressTracker** (`src/services/progress/ProgressTracker.ts`)
   - 跟踪多步骤任务进度
   - 支持步骤状态管理（pending/running/completed/failed）
   - 支持进度百分比更新
   - 支持回调通知

2. **ProgressIndicator** (`src/components/ProgressIndicator.tsx`)
   - React/Ink 组件，用于渲染进度
   - 显示整体进度条
   - 显示当前运行步骤
   - 显示详细步骤列表
   - 实时更新运行时长

## 使用方法

### 在命令中使用

```typescript
import { ProgressTracker, formatProgress } from '../../services/progress/ProgressTracker.js'

const call: LocalCommandCall = async (args, context) => {
  // 1. 创建进度跟踪器
  const progress = new ProgressTracker()
  
  // 2. 添加步骤
  progress.addStep('scan', '扫描文件')
  progress.addStep('analyze', '分析数据')
  progress.addStep('report', '生成报告')

  try {
    // 3. 开始第一步
    progress.startStep('scan', '正在扫描...')
    
    // 4. 执行任务并更新进度
    await scanFiles((current, total) => {
      const percentage = Math.round((current / total) * 100)
      progress.updateStep('scan', percentage, `扫描中: ${current}/${total}`)
    })
    
    // 5. 完成步骤
    progress.completeStep('scan', '扫描完成')

    // 6. 继续下一步...
    progress.startStep('analyze', '正在分析...')
    await analyzeData()
    progress.completeStep('analyze', '分析完成')

    progress.startStep('report', '正在生成报告...')
    const report = await generateReport()
    progress.completeStep('report', '报告生成完成')

    // 7. 格式化进度摘要
    const progressSummary = formatProgress(progress)

    return {
      type: 'text',
      value: `${progressSummary}\n\n${report}`,
    }
  } catch (e) {
    progress.failStep(progress.getCurrentStep()?.id || '', String(e))
    return { type: 'text', value: `✗ 失败: ${String(e)}` }
  }
}
```

### 在 UI 中使用

```typescript
import { ProgressIndicator } from '../components/ProgressIndicator.js'
import { ProgressTracker } from '../services/progress/ProgressTracker.js'

// 在组件中
const [steps, setSteps] = useState<ProgressStep[]>([])

const tracker = new ProgressTracker(newSteps => {
  setSteps(newSteps)
})

// 渲染进度
return <ProgressIndicator steps={steps} showDetails={true} />
```

## 进度输出示例

### 文本格式（formatProgress）

```
⏳ 整体进度: 67%

⚪ 扫描文件 [100%] (2.3s)
   扫描完成，检查了 150 个文件
🔵 分析数据 [50%] (1.5s)
   正在分析安全问题...
⚪ 生成报告

📊 1/3 已完成
```

### UI 渲染（ProgressIndicator）

```
⏳ 进度: [████████████░░░░░░░░] 67% (1/3)

▶ 分析数据 [50%] (1.5s)
   正在分析安全问题...

⚪ 扫描文件
✅ 分析数据
⚪ 生成报告
```

## API 参考

### ProgressTracker

#### 构造函数

```typescript
constructor(callback?: ProgressCallback)
```

#### 方法

- `addStep(id: string, label: string): void` — 添加新步骤
- `startStep(id: string, message?: string): void` — 开始执行步骤
- `updateStep(id: string, progress: number, message?: string): void` — 更新步骤进度（0-100）
- `completeStep(id: string, message?: string): void` — 完成步骤
- `failStep(id: string, message?: string): void` — 标记步骤失败
- `getSteps(): ProgressStep[]` — 获取所有步骤
- `getCurrentStep(): ProgressStep | null` — 获取当前运行中的步骤
- `getOverallProgress(): number` — 获取整体进度（0-100）
- `getStats()` — 获取统计信息（total/completed/failed/running/pending）
- `reset(): void` — 清空所有步骤

### ProgressStep

```typescript
type ProgressStep = {
  id: string
  label: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number // 0-100
  message?: string
  startTime?: number
  endTime?: number
}
```

## 已集成的命令

- `/audit` — 安全审计命令
- `/dream` — 记忆整合命令

## 扩展到其他命令

其他长时间运行的命令可以按照相同模式集成进度指示器：

- `/checkpoint` — 保存会话状态
- `/task` — 任务管理
- `/distill` — 蒸馏会话
- `/collab` — 协作模式

只需：
1. 导入 `ProgressTracker` 和 `formatProgress`
2. 在命令开始时创建跟踪器并添加步骤
3. 在关键点更新进度
4. 在返回结果时包含进度摘要

## 性能考虑

- 进度更新应该节制（不要每毫秒更新）
- 建议每处理一定数量项（如每 10 个文件）或每隔一定时间（如 100ms）更新一次
- `formatProgress` 是纯函数，可以安全地频繁调用

## 测试

运行测试：

```bash
bun test src/services/progress/__tests__/ProgressTracker.test.ts
```

测试覆盖：
- 步骤添加和状态管理
- 进度计算
- 统计信息
- 回调通知
- 格式化输出
