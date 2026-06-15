import { describe, test, expect, beforeEach } from 'bun:test'
import { ProgressTracker, formatProgress } from '../ProgressTracker.js'

describe('ProgressTracker', () => {
  let tracker: ProgressTracker

  beforeEach(() => {
    tracker = new ProgressTracker()
  })

  test('应该添加步骤', () => {
    tracker.addStep('step1', '第一步')
    tracker.addStep('step2', '第二步')

    const steps = tracker.getSteps()
    expect(steps).toHaveLength(2)
    expect(steps[0]?.id).toBe('step1')
    expect(steps[0]?.label).toBe('第一步')
    expect(steps[0]?.status).toBe('pending')
  })

  test('应该开始和完成步骤', () => {
    tracker.addStep('step1', '第一步')
    tracker.startStep('step1', '正在执行...')

    let step = tracker.getSteps()[0]
    expect(step?.status).toBe('running')
    expect(step?.message).toBe('正在执行...')
    expect(step?.startTime).toBeGreaterThan(0)

    tracker.completeStep('step1', '完成')
    step = tracker.getSteps()[0]
    expect(step?.status).toBe('completed')
    expect(step?.progress).toBe(100)
    expect(step?.endTime).toBeGreaterThan(0)
  })

  test('应该更新步骤进度', () => {
    tracker.addStep('step1', '第一步')
    tracker.startStep('step1')
    tracker.updateStep('step1', 50, '进行中...')

    const step = tracker.getSteps()[0]
    expect(step?.progress).toBe(50)
    expect(step?.message).toBe('进行中...')
  })

  test('应该计算整体进度', () => {
    tracker.addStep('step1', '第一步')
    tracker.addStep('step2', '第二步')
    tracker.addStep('step3', '第三步')

    expect(tracker.getOverallProgress()).toBe(0)

    tracker.startStep('step1')
    tracker.completeStep('step1')
    expect(tracker.getOverallProgress()).toBe(33) // 1/3 完成

    tracker.startStep('step2')
    tracker.updateStep('step2', 50)
    expect(tracker.getOverallProgress()).toBe(50) // 1 完成 + 0.5 进行中

    tracker.completeStep('step2')
    tracker.startStep('step3')
    tracker.completeStep('step3')
    expect(tracker.getOverallProgress()).toBe(100)
  })

  test('应该获取统计信息', () => {
    tracker.addStep('step1', '第一步')
    tracker.addStep('step2', '第二步')
    tracker.addStep('step3', '第三步')
    tracker.addStep('step4', '第四步')

    tracker.startStep('step1')
    tracker.completeStep('step1')
    tracker.startStep('step2')
    tracker.failStep('step3', '失败')

    const stats = tracker.getStats()
    expect(stats.total).toBe(4)
    expect(stats.completed).toBe(1)
    expect(stats.running).toBe(1)
    expect(stats.failed).toBe(1)
    expect(stats.pending).toBe(1)
  })

  test('应该获取当前运行步骤', () => {
    tracker.addStep('step1', '第一步')
    tracker.addStep('step2', '第二步')

    expect(tracker.getCurrentStep()).toBeNull()

    tracker.startStep('step1')
    expect(tracker.getCurrentStep()?.id).toBe('step1')

    tracker.completeStep('step1')
    tracker.startStep('step2')
    expect(tracker.getCurrentStep()?.id).toBe('step2')
  })

  test('应该重置跟踪器', () => {
    tracker.addStep('step1', '第一步')
    tracker.startStep('step1')
    tracker.reset()

    expect(tracker.getSteps()).toHaveLength(0)
    expect(tracker.getOverallProgress()).toBe(0)
  })

  test('应该格式化进度信息', () => {
    tracker.addStep('step1', '扫描文件')
    tracker.addStep('step2', '分析问题')

    tracker.startStep('step1')
    tracker.completeStep('step1')
    tracker.startStep('step2')
    tracker.updateStep('step2', 50, '正在分析...')

    const formatted = formatProgress(tracker)
    expect(formatted).toContain('⏳ 整体进度')
    expect(formatted).toContain('✅ 扫描文件')
    expect(formatted).toContain('🔵 分析问题')
    expect(formatted).toContain('[50%]')
    expect(formatted).toContain('正在分析...')
    expect(formatted).toContain('1/2 已完成')
  })

  test('应该调用回调函数', () => {
    const calls: any[] = []
    const trackerWithCallback = new ProgressTracker(steps => {
      calls.push([...steps])
    })

    trackerWithCallback.addStep('step1', '第一步')
    expect(calls).toHaveLength(1)

    trackerWithCallback.startStep('step1')
    expect(calls).toHaveLength(2)

    trackerWithCallback.completeStep('step1')
    expect(calls).toHaveLength(3)
  })
})
