/**
 * 工具懒加载系统导出
 */

export {
  LazyToolLoader,
  lazyToolLoader,
  type ToolLoader,
  type ToolDefinition,
} from './LazyToolLoader.js'

export {
  registerToolDefinitions,
  defineCoreTool,
  defineExtendedTool,
  defineFeatureTool,
  formatLoadStats,
} from './toolDefinitions.js'
