import type { AgentMemoryScope } from './agentMemory.js'
import {
  EFFORT_LEVELS,
  type EffortValue,
  parseEffortValue,
} from 'src/utils/effort.js'
import {
  PERMISSION_MODES,
  type PermissionMode,
} from 'src/utils/permissions/PermissionMode.js'
import { logForDebugging } from 'src/utils/debug.js'

/**
 * Validation result with parsed value and optional error
 */
type ValidationResult<T> = {
  value: T | undefined
  error?: string
}

/**
 * Valid memory scopes
 */
const VALID_MEMORY_SCOPES: AgentMemoryScope[] = ['user', 'project', 'local']

/**
 * Valid isolation modes (platform-dependent)
 */
type IsolationMode = 'worktree' | 'remote'
const VALID_ISOLATION_MODES: readonly IsolationMode[] =
  process.env.USER_TYPE === 'ant' ? ['worktree', 'remote'] : ['worktree']

/**
 * Parse and validate background flag from frontmatter
 */
export function parseBackground(
  backgroundRaw: unknown,
  filePath: string,
): ValidationResult<boolean> {
  if (backgroundRaw === undefined) {
    return { value: undefined }
  }

  const validValues = ['true', 'false', true, false]
  if (!validValues.includes(backgroundRaw as any)) {
    return {
      value: undefined,
      error: `Invalid background value '${backgroundRaw}'. Must be 'true', 'false', or omitted.`,
    }
  }

  return {
    value:
      backgroundRaw === 'true' || backgroundRaw === true ? true : undefined,
  }
}

/**
 * Parse and validate memory scope from frontmatter
 */
export function parseMemoryScope(
  memoryRaw: unknown,
  filePath: string,
): ValidationResult<AgentMemoryScope> {
  if (memoryRaw === undefined) {
    return { value: undefined }
  }

  if (typeof memoryRaw !== 'string') {
    return { value: undefined, error: `Memory must be a string` }
  }

  if (!VALID_MEMORY_SCOPES.includes(memoryRaw as AgentMemoryScope)) {
    return {
      value: undefined,
      error: `Invalid memory value '${memoryRaw}'. Valid options: ${VALID_MEMORY_SCOPES.join(', ')}`,
    }
  }

  return { value: memoryRaw as AgentMemoryScope }
}

/**
 * Parse and validate isolation mode from frontmatter
 */
export function parseIsolationMode(
  isolationRaw: unknown,
  filePath: string,
): ValidationResult<IsolationMode> {
  if (isolationRaw === undefined) {
    return { value: undefined }
  }

  if (typeof isolationRaw !== 'string') {
    return { value: undefined, error: `Isolation must be a string` }
  }

  if (!VALID_ISOLATION_MODES.includes(isolationRaw as IsolationMode)) {
    return {
      value: undefined,
      error: `Invalid isolation value '${isolationRaw}'. Valid options: ${VALID_ISOLATION_MODES.join(', ')}`,
    }
  }

  return { value: isolationRaw as IsolationMode }
}

/**
 * Parse and validate effort value from frontmatter
 */
export function parseEffortFromFrontmatter(
  effortRaw: unknown,
  filePath: string,
): ValidationResult<EffortValue> {
  if (effortRaw === undefined) {
    return { value: undefined }
  }

  const parsedEffort = parseEffortValue(effortRaw)
  if (parsedEffort === undefined) {
    return {
      value: undefined,
      error: `Invalid effort '${effortRaw}'. Valid options: ${EFFORT_LEVELS.join(', ')} or an integer`,
    }
  }

  return { value: parsedEffort }
}

/**
 * Parse and validate permission mode from frontmatter
 */
export function parsePermissionModeFromFrontmatter(
  permissionModeRaw: unknown,
  filePath: string,
): ValidationResult<PermissionMode> {
  if (permissionModeRaw === undefined) {
    return { value: undefined }
  }

  if (typeof permissionModeRaw !== 'string') {
    return { value: undefined, error: `Permission mode must be a string` }
  }

  const isValid = (PERMISSION_MODES as readonly string[]).includes(
    permissionModeRaw,
  )
  if (!isValid) {
    return {
      value: undefined,
      error: `Invalid permissionMode '${permissionModeRaw}'. Valid options: ${PERMISSION_MODES.join(', ')}`,
    }
  }

  return { value: permissionModeRaw as PermissionMode }
}

/**
 * Parse and validate model from frontmatter
 */
export function parseModel(modelRaw: unknown): string | undefined {
  if (typeof modelRaw !== 'string' || !modelRaw.trim()) {
    return undefined
  }

  const trimmed = modelRaw.trim()
  return trimmed.toLowerCase() === 'inherit' ? 'inherit' : trimmed
}

/**
 * Log validation error
 */
export function logValidationError(filePath: string, error: string): void {
  logForDebugging(`Agent file ${filePath} ${error}`)
}
