/**
 * 进度跟踪器 — 为长时间运行的命令提供统一的进度反馈
 */

export type ProgressStatus = 'pending' | 'running' | 'completed' | 'failed'

export type ProgressStep = {
  id: string
  label: string
  status: ProgressStatus
  progress?: number // 0-100
  message?: string
  startTime?: number
  endTime?: number
}

export type ProgressCallback = (steps: ProgressStep[]) => void

export class ProgressTracker {
  private steps: Map<string, ProgressStep> = new Map()
  private callback: ProgressCallback | null = null
  private stepOrder: string[] = []

  constructor(callback?: ProgressCallback) {
    this.callback = callback || null
  }

  /**
   * 添加新步骤
   */
  addStep(id: string, label: string): void {
    if (this.steps.has(id)) return

    this.steps.set(id, {
      id,
      label,
      status: 'pending',
    })
    this.stepOrder.push(id)
    this.notifyChange()
  }

  /**
   * 开始步骤
   */
  startStep(id: string, message?: string): void {
    const step = this.steps.get(id)
    if (!step) return

    step.status = 'running'
    step.startTime = Date.now()
    if (message) step.message = message
    this.notifyChange()
  }

  /**
   * 更新步骤进度
   */
  updateStep(id: string, progress: number, message?: string): void {
    const step = this.steps.get(id)
    if (!step) return

    step.progress = Math.max(0, Math.min(100, progress))
    if (message) step.message = message
    this.notifyChange()
  }

  /**
   * 完成步骤
   */
  completeStep(id: string, message?: string): void {
    const step = this.steps.get(id)
    if (!step) return

    step.status = 'completed'
    step.progress = 100
    step.endTime = Date.now()
    if (message) step.message = message
    this.notifyChange()
  }

  /**
   * 步骤失败
   */
  failStep(id: string, message?: string): void {
    const step = this.steps.get(id)
    if (!step) return

    step.status = 'failed'
    step.endTime = Date.now()
    if (message) step.message = message
    this.notifyChange()
  }

  /**
   * 获取所有步骤（按添加顺序）
   */
  getSteps(): ProgressStep[] {
    return this.stepOrder.map(id => this.steps.get(id)!).filter(Boolean)
  }

  /**
   * 获取当前运行中的步骤
   */
  getCurrentStep(): ProgressStep | null {
    for (const id of this.stepOrder) {
      const step = this.steps.get(id)
      if (step?.status === 'running') return step
    }
    return null
  }

  /**
   * 获取整体进度百分比
   */
  getOverallProgress(): number {
    const steps = this.getSteps()
    if (steps.length === 0) return 0

    let total = 0
    for (const step of steps) {
      if (step.status === 'completed') total += 100
      else if (step.status === 'running') total += step.progress || 0
    }
    return Math.round(total / steps.length)
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const steps = this.getSteps()
    const completed = steps.filter(s => s.status === 'completed').length
    const failed = steps.filter(s => s.status === 'failed').length
    const running = steps.filter(s => s.status === 'running').length
    const pending = steps.filter(s => s.status === 'pending').length

    return {
      total: steps.length,
      completed,
      failed,
      running,
      pending,
    }
  }

  /**
   * 清空所有步骤
   */
  reset(): void {
    this.steps.clear()
    this.stepOrder = []
    this.notifyChange()
  }

  private notifyChange(): void {
    if (this.callback) {
      this.callback(this.getSteps())
    }
  }
}

/**
 * 格式化进度信息为文本
 */
export function formatProgress(tracker: ProgressTracker): string {
  const steps = tracker.getSteps()
  if (steps.length === 0) return ''

  const lines: string[] = []
  const overall = tracker.getOverallProgress()

  lines.push(`⏳ 整体进度: ${overall}%`)
  lines.push('')

  const icons = {
    pending: '⚪',
    running: '🔵',
    completed: '✅',
    failed: '❌',
  }

  for (const step of steps) {
    const icon = icons[step.status]
    const progressBar =
      step.progress !== undefined ? ` [${step.progress}%]` : ''
    const elapsed =
      step.startTime && step.endTime
        ? ` (${((step.endTime - step.startTime) / 1000).toFixed(1)}s)`
        : step.startTime
          ? ` (${((Date.now() - step.startTime) / 1000).toFixed(1)}s)`
          : ''

    lines.push(`${icon} ${step.label}${progressBar}${elapsed}`)
    if (step.message) {
      lines.push(`   ${step.message}`)
    }
  }

  const stats = tracker.getStats()
  lines.push('')
  lines.push(`📊 ${stats.completed}/${stats.total} 已完成`)

  return lines.join('\n')
}
