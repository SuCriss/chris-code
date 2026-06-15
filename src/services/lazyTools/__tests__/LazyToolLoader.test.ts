import { describe, test, expect, beforeEach } from 'bun:test'
import { LazyToolLoader, type ToolDefinition } from '../LazyToolLoader.js'
import type { Tool } from '../../../Tool.js'

// 模拟工具（简化版本，仅用于测试）
const createMockTool = (name: string): Tool => {
  return {
    name,
  } as Tool
}

describe('LazyToolLoader', () => {
  let loader: LazyToolLoader

  beforeEach(() => {
    loader = new LazyToolLoader()
  })

  test('应该注册工具定义', () => {
    const def: ToolDefinition = {
      name: 'test-tool',
      category: 'core',
      loader: () => createMockTool('test-tool'),
    }

    loader.register(def)
    const stats = loader.getStats()
    expect(stats.total).toBe(1)
    expect(stats.loaded).toBe(0)
  })

  test('应该懒加载工具', () => {
    let loadCount = 0
    const def: ToolDefinition = {
      name: 'lazy-tool',
      category: 'core',
      loader: () => {
        loadCount++
        return createMockTool('lazy-tool')
      },
    }

    loader.register(def)
    expect(loadCount).toBe(0) // 注册时不加载

    const tool = loader.get('lazy-tool')
    expect(loadCount).toBe(1) // 第一次获取时加载
    expect(tool?.name).toBe('lazy-tool')

    const tool2 = loader.get('lazy-tool')
    expect(loadCount).toBe(1) // 第二次获取时使用缓存
    expect(tool2).toBe(tool) // 相同的实例
  })

  test('应该批量注册工具', () => {
    const defs: ToolDefinition[] = [
      {
        name: 'tool1',
        category: 'core',
        loader: () => createMockTool('tool1'),
      },
      {
        name: 'tool2',
        category: 'extended',
        loader: () => createMockTool('tool2'),
      },
      {
        name: 'tool3',
        category: 'feature',
        loader: () => createMockTool('tool3'),
      },
    ]

    loader.registerMany(defs)
    expect(loader.getStats().total).toBe(3)
  })

  test('应该处理 isEnabled 检查', () => {
    let enabled = false
    const def: ToolDefinition = {
      name: 'conditional-tool',
      category: 'feature',
      loader: () => createMockTool('conditional-tool'),
      isEnabled: () => enabled,
    }

    loader.register(def)

    // 禁用状态
    const tool1 = loader.get('conditional-tool')
    expect(tool1).toBeNull()

    // 清空缓存并启用
    loader.clear()
    enabled = true
    const tool2 = loader.get('conditional-tool')
    expect(tool2?.name).toBe('conditional-tool')
  })

  test('应该按分类获取工具', () => {
    loader.registerMany([
      {
        name: 'core1',
        category: 'core',
        loader: () => createMockTool('core1'),
      },
      {
        name: 'core2',
        category: 'core',
        loader: () => createMockTool('core2'),
      },
      {
        name: 'ext1',
        category: 'extended',
        loader: () => createMockTool('ext1'),
      },
    ])

    const coreTools = loader.getByCategory('core')
    expect(coreTools).toHaveLength(2)
    expect(coreTools.map(t => t.name).sort()).toEqual(['core1', 'core2'])

    const extTools = loader.getByCategory('extended')
    expect(extTools).toHaveLength(1)
    expect(extTools[0]?.name).toBe('ext1')
  })

  test('应该获取所有工具', () => {
    loader.registerMany([
      {
        name: 'tool1',
        category: 'core',
        loader: () => createMockTool('tool1'),
      },
      {
        name: 'tool2',
        category: 'core',
        loader: () => createMockTool('tool2'),
      },
      { name: 'disabled', category: 'feature', loader: () => null },
    ])

    const allTools = loader.getAll()
    expect(allTools).toHaveLength(2)
    expect(allTools.map(t => t.name).sort()).toEqual(['tool1', 'tool2'])
  })

  test('应该检查工具是否已加载', () => {
    loader.register({
      name: 'check-tool',
      category: 'core',
      loader: () => createMockTool('check-tool'),
    })

    expect(loader.isLoaded('check-tool')).toBe(false)
    loader.get('check-tool')
    expect(loader.isLoaded('check-tool')).toBe(true)
  })

  test('应该收集加载统计', () => {
    loader.registerMany([
      {
        name: 'tool1',
        category: 'core',
        loader: () => createMockTool('tool1'),
      },
      {
        name: 'tool2',
        category: 'extended',
        loader: () => createMockTool('tool2'),
      },
      {
        name: 'tool3',
        category: 'feature',
        loader: () => createMockTool('tool3'),
      },
    ])

    // 只加载部分工具
    loader.get('tool1')
    loader.get('tool2')

    const stats = loader.getStats()
    expect(stats.total).toBe(3)
    expect(stats.loaded).toBe(2)
    expect(stats.percentage).toBe(67) // 2/3 ≈ 67%
    expect(stats.byCategory.core).toBe(1)
    expect(stats.byCategory.extended).toBe(1)
    expect(stats.totalLoadTime).toBeGreaterThan(0)
  })

  test('应该获取加载详情', () => {
    loader.registerMany([
      {
        name: 'tool1',
        category: 'core',
        loader: () => createMockTool('tool1'),
      },
      {
        name: 'tool2',
        category: 'core',
        loader: () => createMockTool('tool2'),
      },
    ])

    loader.get('tool1')

    const details = loader.getLoadDetails()
    expect(details).toHaveLength(2)

    const tool1Detail = details.find(d => d.name === 'tool1')
    expect(tool1Detail?.loaded).toBe(true)
    expect(tool1Detail?.loadTime).toBeGreaterThan(0)

    const tool2Detail = details.find(d => d.name === 'tool2')
    expect(tool2Detail?.loaded).toBe(false)
    expect(tool2Detail?.loadTime).toBeUndefined()
  })

  test('应该处理不存在的工具', () => {
    const tool = loader.get('non-existent')
    expect(tool).toBeNull()
  })

  test('应该清空缓存', () => {
    loader.register({
      name: 'clear-test',
      category: 'core',
      loader: () => createMockTool('clear-test'),
    })

    loader.get('clear-test')
    expect(loader.isLoaded('clear-test')).toBe(true)

    loader.clear()
    expect(loader.isLoaded('clear-test')).toBe(false)
  })
})
