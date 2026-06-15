/**
 * 工具懒加载系统 — 按需加载工具，提升启动速度
 */

import type { Tool } from '../../Tool.js'

export type ToolLoader = () => Tool | null

export type ToolDefinition = {
  name: string
  category: 'core' | 'extended' | 'feature' | 'mcp'
  loader: ToolLoader
  featureFlag?: string
  isEnabled?: () => boolean
}

export class LazyToolLoader {
  private definitions: Map<string, ToolDefinition> = new Map()
  private loadedTools: Map<string, Tool | null> = new Map()
  private loadStats: Map<string, { loadTime: number; loadedAt: number }> =
    new Map()

  /**
   * 注册工具定义（不立即加载）
   */
  register(definition: ToolDefinition): void {
    this.definitions.set(definition.name, definition)
  }

  /**
   * 批量注册工具
   */
  registerMany(definitions: ToolDefinition[]): void {
    for (const def of definitions) {
      this.register(def)
    }
  }

  /**
   * 获取工具（懒加载）
   */
  get(name: string): Tool | null {
    // 如果已加载，直接返回缓存
    if (this.loadedTools.has(name)) {
      return this.loadedTools.get(name) ?? null
    }

    // 查找定义
    const definition = this.definitions.get(name)
    if (!definition) return null

    // 检查是否启用
    if (definition.isEnabled && !definition.isEnabled()) {
      this.loadedTools.set(name, null)
      return null
    }

    // 加载工具
    const startTime = performance.now()
    const tool = definition.loader()
    const loadTime = performance.now() - startTime

    // 缓存结果
    this.loadedTools.set(name, tool)
    if (tool) {
      this.loadStats.set(name, {
        loadTime,
        loadedAt: Date.now(),
      })
    }

    return tool
  }

  /**
   * 预加载核心工具（在空闲时）
   */
  preloadCore(): void {
    const coreTools = Array.from(this.definitions.values()).filter(
      def => def.category === 'core' && !this.loadedTools.has(def.name),
    )

    // 使用 requestIdleCallback 在空闲时加载
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        for (const def of coreTools) {
          this.get(def.name)
        }
      })
    } else {
      // 降级：使用 setTimeout
      setTimeout(() => {
        for (const def of coreTools) {
          this.get(def.name)
        }
      }, 100)
    }
  }

  /**
   * 获取所有已启用的工具（懒加载）
   */
  getAll(): Tool[] {
    const tools: Tool[] = []
    for (const definition of this.definitions.values()) {
      const tool = this.get(definition.name)
      if (tool) tools.push(tool)
    }
    return tools
  }

  /**
   * 按分类获取工具
   */
  getByCategory(category: ToolDefinition['category']): Tool[] {
    const tools: Tool[] = []
    for (const definition of this.definitions.values()) {
      if (definition.category === category) {
        const tool = this.get(definition.name)
        if (tool) tools.push(tool)
      }
    }
    return tools
  }

  /**
   * 检查工具是否已加载
   */
  isLoaded(name: string): boolean {
    return this.loadedTools.has(name)
  }

  /**
   * 获取加载统计
   */
  getStats() {
    const loaded = this.loadedTools.size
    const total = this.definitions.size
    const byCategory: Record<string, number> = {}

    for (const definition of this.definitions.values()) {
      if (this.loadedTools.has(definition.name)) {
        byCategory[definition.category] =
          (byCategory[definition.category] || 0) + 1
      }
    }

    const loadTimes = Array.from(this.loadStats.values()).map(s => s.loadTime)
    const totalLoadTime = loadTimes.reduce((sum, t) => sum + t, 0)
    const avgLoadTime =
      loadTimes.length > 0 ? totalLoadTime / loadTimes.length : 0

    return {
      loaded,
      total,
      percentage: Math.round((loaded / total) * 100),
      byCategory,
      totalLoadTime: Math.round(totalLoadTime * 100) / 100,
      avgLoadTime: Math.round(avgLoadTime * 100) / 100,
    }
  }

  /**
   * 获取详细的加载信息
   */
  getLoadDetails(): Array<{
    name: string
    category: string
    loaded: boolean
    loadTime?: number
    loadedAt?: number
  }> {
    const details = []
    for (const definition of this.definitions.values()) {
      const loaded = this.loadedTools.has(definition.name)
      const stats = this.loadStats.get(definition.name)
      details.push({
        name: definition.name,
        category: definition.category,
        loaded,
        loadTime: stats?.loadTime,
        loadedAt: stats?.loadedAt,
      })
    }
    return details.sort((a, b) => (b.loadTime || 0) - (a.loadTime || 0))
  }

  /**
   * 清空缓存（用于测试）
   */
  clear(): void {
    this.loadedTools.clear()
    this.loadStats.clear()
  }
}

// 全局单例
export const lazyToolLoader = new LazyToolLoader()
