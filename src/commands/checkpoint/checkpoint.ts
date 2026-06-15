import type { LocalCommandCall } from '../../types/command.js'
import {
  saveCheckpoint,
  loadTasks,
  saveTasks,
  updateTaskStatus,
  addTask,
  type CheckpointData,
  type TaskNode,
} from '../../memdir/checkpoint.js'
import { getAutoMemPath } from '../../memdir/paths.js'

const call: LocalCommandCall = async (args, context) => {
  const title = args?.trim() || 'Untitled session'

  const now = new Date().toISOString()

  const data: CheckpointData = {
    title,
    currentState: 'Session checkpoint saved',
    keyFiles: [],
    recentErrors: '',
    nextSteps: '',
    taskSummary: '',
    timestamp: now,
  }

  await saveCheckpoint(data)

  return {
    type: 'text',
    value: `✓ Checkpoint saved: "${title}"\nLocation: ${getAutoMemPath()}checkpoint.md`,
  }
}

export { call }

export const taskCall: LocalCommandCall = async (args, context) => {
  if (!args?.trim()) {
    const tasks = await loadTasks()
    if (tasks.length === 0) {
      return {
        type: 'text',
        value: 'No tasks tracked. Use: /task add <id> <title>',
      }
    }
    const lines = serializeTaskTree(tasks)
    return { type: 'text', value: lines }
  }

  const parts = args.trim().split(/\s+/)
  const subcommand = parts[0]

  if (subcommand === 'add') {
    const id = parts[1]
    const taskTitle = parts.slice(2).join(' ')
    if (!id || !taskTitle) {
      return {
        type: 'text',
        value: 'Usage: /task add <id> <title> [parentId]',
      }
    }
    const parentId = parts.length > 3 ? parts[parts.length - 1] : null
    const tasks = await loadTasks()
    if (addTask(tasks, parentId, id, taskTitle)) {
      await saveTasks(tasks)
      return { type: 'text', value: `✓ Task ${id} added: ${taskTitle}` }
    }
    return { type: 'text', value: `✗ Parent task ${parentId} not found` }
  }

  if (subcommand === 'done' || subcommand === 'complete') {
    const taskId = parts[1]
    if (!taskId) {
      return { type: 'text', value: 'Usage: /task done <id>' }
    }
    const tasks = await loadTasks()
    if (updateTaskStatus(tasks, taskId, 'completed')) {
      await saveTasks(tasks)
      return { type: 'text', value: `✓ Task ${taskId} marked complete` }
    }
    return { type: 'text', value: `✗ Task ${taskId} not found` }
  }

  if (subcommand === 'start' || subcommand === 'progress') {
    const taskId = parts[1]
    if (!taskId) {
      return { type: 'text', value: 'Usage: /task start <id>' }
    }
    const tasks = await loadTasks()
    if (updateTaskStatus(tasks, taskId, 'in_progress')) {
      await saveTasks(tasks)
      return { type: 'text', value: `✓ Task ${taskId} started` }
    }
    return { type: 'text', value: `✗ Task ${taskId} not found` }
  }

  return {
    type: 'text',
    value:
      'Usage:\n  /task — show tasks\n  /task add <id> <title> [parentId]\n  /task done <id>\n  /task start <id>',
  }
}

function serializeTaskTree(tasks: TaskNode[], depth = 0): string {
  const lines: string[] = []
  for (const task of tasks) {
    const indent = '  '.repeat(depth)
    const icon =
      task.status === 'completed'
        ? '✓'
        : task.status === 'in_progress'
          ? '⟳'
          : task.status === 'blocked'
            ? '✗'
            : '○'
    lines.push(`${indent}${icon} ${task.id}: ${task.title}`)
    if (task.children.length > 0) {
      lines.push(serializeTaskTree(task.children, depth + 1))
    }
  }
  return lines.join('\n')
}
