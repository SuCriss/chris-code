/**
 * 工具懒加载使用示例
 */

import {
  LazyToolLoader,
  registerToolDefinitions,
  formatLoadStats,
} from '../src/services/lazyTools/index.js'

// 示例 1: 基本使用
async function basicExample() {
  console.log('=== 示例 1: 基本懒加载 ===\n')

  const loader = new LazyToolLoader()
  registerToolDefinitions(loader)

  console.log('初始状态:', loader.getStats())
  console.log('已加载工具数:', loader.getStats().loaded)

  // 获取一个工具（触发懒加载）
  const readTool = loader.get('Read')
  console.log('\n获取 Read 工具:', readTool ? '✓' : '✗')
  console.log('已加载工具数:', loader.getStats().loaded)

  // 再次获取相同工具（使用缓存）
  const readTool2 = loader.get('Read')
  console.log(
    '再次获取 Read 工具（缓存）:',
    readTool === readTool2 ? '✓ 相同实例' : '✗',
  )

  console.log('\n最终统计:')
  console.log(formatLoadStats(loader))
}

// 示例 2: 按分类加载
async function categoryExample() {
  console.log('\n=== 示例 2: 按分类加载 ===\n')

  const loader = new LazyToolLoader()
  registerToolDefinitions(loader)

  // 只加载核心工具
  console.log('加载核心工具...')
  const coreTools = loader.getByCategory('core')
  console.log(`核心工具数量: ${coreTools.length}`)
  console.log('核心工具:', coreTools.map(t => t.name).join(', '))

  console.log('\n加载扩展工具...')
  const extendedTools = loader.getByCategory('extended')
  console.log(`扩展工具数量: ${extendedTools.length}`)
  console.log('扩展工具:', extendedTools.map(t => t.name).join(', '))

  console.log('\n统计信息:')
  console.log(formatLoadStats(loader))
}

// 示例 3: 性能对比
async function performanceExample() {
  console.log('\n=== 示例 3: 性能对比 ===\n')

  const loader = new LazyToolLoader()
  registerToolDefinitions(loader)

  // 场景 1: 全部预加载
  console.log('场景 1: 全部预加载')
  const start1 = performance.now()
  const allTools = loader.getAll()
  const time1 = performance.now() - start1
  console.log(`加载 ${allTools.length} 个工具耗时: ${time1.toFixed(2)}ms`)

  // 场景 2: 按需加载
  console.log('\n场景 2: 按需加载')
  const loader2 = new LazyToolLoader()
  registerToolDefinitions(loader2)

  const start2 = performance.now()
  // 只加载常用的 3 个工具
  loader2.get('Read')
  loader2.get('Write')
  loader2.get('Bash')
  const time2 = performance.now() - start2

  console.log(`加载 3 个常用工具耗时: ${time2.toFixed(2)}ms`)
  console.log(`性能提升: ${(((time1 - time2) / time1) * 100).toFixed(1)}%`)
}

// 示例 4: 加载详情
async function detailsExample() {
  console.log('\n=== 示例 4: 加载详情 ===\n')

  const loader = new LazyToolLoader()
  registerToolDefinitions(loader)

  // 加载几个工具
  loader.get('Read')
  loader.get('Write')
  loader.get('Bash')
  loader.get('Agent')

  const details = loader.getLoadDetails()
  console.log('已加载工具详情:\n')
  console.log('工具名称         | 类别     | 加载时间')
  console.log('---------------|----------|----------')

  for (const detail of details.filter(d => d.loaded)) {
    const name = detail.name.padEnd(15)
    const category = detail.category.padEnd(8)
    const loadTime = `${detail.loadTime?.toFixed(2)}ms`
    console.log(`${name} | ${category} | ${loadTime}`)
  }
}

// 运行所有示例
if (import.meta.main) {
  await basicExample()
  await categoryExample()
  await performanceExample()
  await detailsExample()
}
