/**
 * Session checkpoint system.
 *
 * Saves structured state snapshots to the memory directory so that
 * session resumption can inject context without re-explaining.
 *
 * Checkpoint file: <memoryDir>/checkpoint.md
 * Task tree file:  <memoryDir>/tasks.md
 */

import { readFile, writeFile, stat } from 'fs/promises'
import { join } from 'path'
import { logForDebugging } from '../utils/debug.js'
import { getAutoMemPath } from './paths.js'

const CHECKPOINT_FILENAME = 'checkpoint.md'
const TASKS_FILENAME = 'tasks.md'

// ─── Task Tree ──────────────────────────────────────────────────────

export type TaskNode = {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  children: TaskNode[]
}

export function parseTasksMd(content: string): TaskNode[] {
  const lines = content.split('\n').filter(l => l.trim())
  const roots: TaskNode[] = []
  const stack: { node: TaskNode; indent: number }[] = []

  for (const line of lines) {
    const m = line.match(/^(\s*)- \[(.)\] (\S+):?\s+(.*)$/)
    if (!m) continue

    const indent = m[1].length
    const statusChar = m[2]
    const id = m[3]
    const title = m[4].trim()

    const status =
      statusChar === 'x'
        ? 'completed'
        : statusChar === '-'
          ? 'blocked'
          : statusChar === '~'
            ? 'in_progress'
            : 'pending'

    const node: TaskNode = { id, title, status, children: [] }

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    if (stack.length === 0) {
      roots.push(node)
    } else {
      stack[stack.length - 1].node.children.push(node)
    }

    stack.push({ node, indent })
  }

  return roots
}

export function serializeTasksMd(tasks: TaskNode[]): string {
  const lines: string[] = [
    '# Task Progress',
    '',
    '_Auto-managed task tree. Do not edit manually._',
    '',
  ]

  function renderNode(node: TaskNode, depth: number) {
    const indent = '  '.repeat(depth)
    const checkbox =
      node.status === 'completed'
        ? 'x'
        : node.status === 'blocked'
          ? '-'
          : node.status === 'in_progress'
            ? '~'
            : ' '
    lines.push(`${indent}- [${checkbox}] ${node.id}: ${node.title}`)
    for (const child of node.children) {
      renderNode(child, depth + 1)
    }
  }

  for (const task of tasks) {
    renderNode(task, 0)
  }

  return lines.join('\n') + '\n'
}

export function updateTaskStatus(
  tasks: TaskNode[],
  taskId: string,
  status: TaskNode['status'],
): boolean {
  for (const task of tasks) {
    if (task.id === taskId) {
      task.status = status
      return true
    }
    if (updateTaskStatus(task.children, taskId, status)) {
      return true
    }
  }
  return false
}

export function addTask(
  tasks: TaskNode[],
  parentId: string | null,
  id: string,
  title: string,
): boolean {
  if (!parentId) {
    tasks.push({ id, title, status: 'pending', children: [] })
    return true
  }
  for (const task of tasks) {
    if (task.id === parentId) {
      task.children.push({ id, title, status: 'pending', children: [] })
      return true
    }
    if (addTask(task.children, parentId, id, title)) {
      return true
    }
  }
  return false
}

// ─── Checkpoint ─────────────────────────────────────────────────────

export type CheckpointData = {
  title: string
  currentState: string
  keyFiles: string[]
  recentErrors: string
  nextSteps: string
  taskSummary: string
  timestamp: string
}

export function parseCheckpoint(content: string): Partial<CheckpointData> {
  const sections: Record<string, string> = {}
  let currentSection = ''
  let currentContent: string[] = []

  for (const line of content.split('\n')) {
    const headerMatch = line.match(/^## (.+)$/)
    if (headerMatch) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim()
      }
      currentSection = headerMatch[1].toLowerCase()
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim()
  }

  return {
    title: sections['session'] || '',
    currentState: sections['current state'] || '',
    keyFiles: (sections['key files'] || '')
      .split('\n')
      .filter(l => l.startsWith('- '))
      .map(l => l.slice(2)),
    recentErrors: sections['recent errors'] || '',
    nextSteps: sections['next steps'] || '',
    taskSummary: sections['task progress'] || '',
    timestamp: sections['updated'] || '',
  }
}

export function serializeCheckpoint(data: CheckpointData): string {
  return `# Session Checkpoint

_Auto-generated checkpoint for session resumption._

## Session
${data.title}

## Updated
${data.timestamp}

## Current State
${data.currentState}

## Key Files
${data.keyFiles.map(f => `- ${f}`).join('\n') || '- _(none yet)_'}

## Recent Errors
${data.recentErrors || '- _(none)_'}

## Next Steps
${data.nextSteps || '- _(none specified)_'}

## Task Progress
${data.taskSummary || '- _(no tasks tracked)_'}
`
}

// ─── File I/O ───────────────────────────────────────────────────────

function getCheckpointPath(): string {
  return join(getAutoMemPath(), CHECKPOINT_FILENAME)
}

function getTasksPath(): string {
  return join(getAutoMemPath(), TASKS_FILENAME)
}

export async function loadCheckpoint(): Promise<Partial<CheckpointData> | null> {
  try {
    const content = await readFile(getCheckpointPath(), 'utf-8')
    return parseCheckpoint(content)
  } catch {
    return null
  }
}

export async function saveCheckpoint(data: CheckpointData): Promise<void> {
  try {
    await writeFile(getCheckpointPath(), serializeCheckpoint(data), 'utf-8')
    logForDebugging('checkpoint: saved', { level: 'debug' })
  } catch (e) {
    logForDebugging(`checkpoint: save failed: ${String(e)}`, { level: 'warn' })
  }
}

export async function loadTasks(): Promise<TaskNode[]> {
  try {
    const content = await readFile(getTasksPath(), 'utf-8')
    return parseTasksMd(content)
  } catch {
    return []
  }
}

export async function saveTasks(tasks: TaskNode[]): Promise<void> {
  try {
    await writeFile(getTasksPath(), serializeTasksMd(tasks), 'utf-8')
    logForDebugging('checkpoint: tasks saved', { level: 'debug' })
  } catch (e) {
    logForDebugging(`checkpoint: tasks save failed: ${String(e)}`, {
      level: 'warn',
    })
  }
}

export async function hasRecentCheckpoint(): Promise<boolean> {
  try {
    const fileStat = await stat(getCheckpointPath())
    const age = Date.now() - fileStat.mtimeMs
    return age < 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export async function buildCheckpointContext(): Promise<string | null> {
  const checkpoint = await loadCheckpoint()
  if (!checkpoint || !checkpoint.title) return null

  const tasks = await loadTasks()
  const taskLines =
    tasks.length > 0
      ? serializeTasksMd(tasks).split('\n').slice(4).join('\n')
      : ''

  const parts = [`## Session Resumption Context`]
  parts.push('')
  if (checkpoint.title) parts.push(`**Previous session:** ${checkpoint.title}`)
  if (checkpoint.currentState)
    parts.push(`**State:** ${checkpoint.currentState}`)
  if (checkpoint.keyFiles?.length)
    parts.push(`**Key files:** ${checkpoint.keyFiles.join(', ')}`)
  if (checkpoint.nextSteps)
    parts.push(`**Next steps:** ${checkpoint.nextSteps}`)
  if (taskLines.trim()) {
    parts.push('')
    parts.push('**Task progress:**')
    parts.push(taskLines)
  }

  return parts.join('\n')
}
