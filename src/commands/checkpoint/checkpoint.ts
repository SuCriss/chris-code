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

export default async function checkpointCommand(
  call: LocalCommandCall,
): Promise<void> {
  const { args, setMessages } = call
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

  setMessages?.([
    {
      type: 'text' as const,
      text: `✓ Checkpoint saved: "${title}"\nLocation: ${getAutoMemPath()}checkpoint.md`,
    },
  ])
}

export async function taskCommand(call: LocalCommandCall): Promise<void> {
  const { args, setMessages } = call

  if (!args?.trim()) {
    const tasks = await loadTasks()
    if (tasks.length === 0) {
      setMessages?.([
        {
          type: 'text' as const,
          text: 'No tasks tracked. Use: /task add <id> <title>',
        },
      ])
      return
    }
    const lines = serializeTaskTree(tasks)
    setMessages?.([{ type: 'text' as const, text: lines }])
    return
  }

  const parts = args.trim().split(/\s+/)
  const subcommand = parts[0]

  if (subcommand === 'add') {
    const id = parts[1]
    const taskTitle = parts.slice(2).join(' ')
    if (!id || !taskTitle) {
      setMessages?.([
        {
          type: 'text' as const,
          text: 'Usage: /task add <id> <title> [parentId]',
        },
      ])
      return
    }
    const parentId = parts.length > 3 ? parts[parts.length - 1] : null
    const tasks = await loadTasks()
    if (addTask(tasks, parentId, id, taskTitle)) {
      await saveTasks(tasks)
      setMessages?.([
        { type: 'text' as const, text: `✓ Task ${id} added: ${taskTitle}` },
      ])
    } else {
      setMessages?.([
        { type: 'text' as const, text: `✗ Parent task ${parentId} not found` },
      ])
    }
    return
  }

  if (subcommand === 'done' || subcommand === 'complete') {
    const taskId = parts[1]
    if (!taskId) {
      setMessages?.([{ type: 'text' as const, text: 'Usage: /task done <id>' }])
      return
    }
    const tasks = await loadTasks()
    if (updateTaskStatus(tasks, taskId, 'completed')) {
      await saveTasks(tasks)
      setMessages?.([
        { type: 'text' as const, text: `✓ Task ${taskId} marked complete` },
      ])
    } else {
      setMessages?.([
        { type: 'text' as const, text: `✗ Task ${taskId} not found` },
      ])
    }
    return
  }

  if (subcommand === 'start' || subcommand === 'progress') {
    const taskId = parts[1]
    if (!taskId) {
      setMessages?.([
        { type: 'text' as const, text: 'Usage: /task start <id>' },
      ])
      return
    }
    const tasks = await loadTasks()
    if (updateTaskStatus(tasks, taskId, 'in_progress')) {
      await saveTasks(tasks)
      setMessages?.([
        { type: 'text' as const, text: `✓ Task ${taskId} started` },
      ])
    } else {
      setMessages?.([
        { type: 'text' as const, text: `✗ Task ${taskId} not found` },
      ])
    }
    return
  }

  setMessages?.([
    {
      type: 'text' as const,
      text: 'Usage:\n  /task — show tasks\n  /task add <id> <title> [parentId]\n  /task done <id>\n  /task start <id>',
    },
  ])
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
