import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { LocalCommandCall } from '../../types/command.js'
import { getAutoMemPath } from '../../memdir/paths.js'
import { scanMemoryFiles } from '../../memdir/memoryScan.js'
import { saveCheckpoint } from '../../memdir/checkpoint.js'
import { getProjectsDir } from '../../utils/sessionStorage.js'
import { logForDebugging } from '../../utils/debug.js'
import {
  ProgressTracker,
  formatProgress,
} from '../../services/progress/ProgressTracker.js'

const MAX_TRANSCRIPT_SIZE = 200_000
const MAX_SESSIONS_TO_SCAN = 5

const call: LocalCommandCall = async (args, context) => {
  const memoryDir = getAutoMemPath()

  // 创建进度跟踪器
  const progress = new ProgressTracker()
  progress.addStep('scan-transcripts', '扫描会话记录')
  progress.addStep('load-memories', '加载现有记忆')
  progress.addStep('extract-insights', '提取洞察')
  progress.addStep('write-memories', '写入新记忆')
  progress.addStep('checkpoint', '保存检查点')

  try {
    // 扫描转录记录
    progress.startStep('scan-transcripts', '正在扫描最近的会话记录...')
    const transcripts = await scanRecentTranscripts()
    progress.completeStep(
      'scan-transcripts',
      `找到 ${transcripts.length} 个会话记录`,
    )

    // 加载现有记忆
    progress.startStep('load-memories', '正在加载现有记忆...')
    const existingMemories = await scanMemoryFiles(
      memoryDir,
      new AbortController().signal,
    )
    const existingDescs = new Set(
      existingMemories.map(m => m.description?.toLowerCase()).filter(Boolean),
    )
    progress.completeStep(
      'load-memories',
      `已加载 ${existingMemories.length} 条现有记忆`,
    )

    // 提取洞察
    progress.startStep('extract-insights', '正在从会话中提取洞察...')
    const insights = extractInsights(transcripts)
    progress.completeStep(
      'extract-insights',
      `提取了 ${insights.length} 个洞察`,
    )

    progress.completeStep(
      'extract-insights',
      `提取了 ${insights.length} 个洞察`,
    )

    // 写入新记忆
    progress.startStep('write-memories', '正在写入新记忆...')
    let written = 0
    for (const insight of insights) {
      if (existingDescs.has(insight.description.toLowerCase())) continue

      const filename = `dream_${Date.now()}_${written}.md`
      const content = `---
name: ${insight.title}
description: ${insight.description}
metadata:
  type: ${insight.type}
---

${insight.content}
`
      try {
        await writeFile(join(memoryDir, filename), content, 'utf-8')
        written++
        progress.updateStep(
          'write-memories',
          Math.round(((written + 1) / insights.length) * 100),
          `已写入 ${written} 条新记忆`,
        )
      } catch (e) {
        logForDebugging(`dream: failed to write ${filename}: ${String(e)}`, {
          level: 'warn',
        })
      }
    }
    progress.completeStep('write-memories', `写入了 ${written} 条新记忆`)

    // 保存检查点
    progress.startStep('checkpoint', '正在保存检查点...')
    const now = new Date().toISOString()
    await saveCheckpoint({
      title: `Dream consolidation - ${now}`,
      currentState: `Scanned ${transcripts.length} sessions, extracted ${written} new memories`,
      keyFiles: [],
      recentErrors: '',
      nextSteps: 'Continue working',
      taskSummary: '',
      timestamp: now,
    })
    progress.completeStep('checkpoint', '检查点已保存')

    const progressSummary = formatProgress(progress)

    return {
      type: 'text',
      value: `${progressSummary}\n\n💭 Dream complete!\n- Scanned ${transcripts.length} recent sessions\n- Extracted ${written} new memories\n- Existing memories: ${existingMemories.length}`,
    }
  } catch (e) {
    return { type: 'text', value: `✗ Dream failed: ${String(e)}` }
  }
}

export { call }

type Insight = {
  title: string
  description: string
  type: 'user' | 'feedback' | 'project' | 'reference'
  content: string
}

async function scanRecentTranscripts(): Promise<string[]> {
  const projectsDir = getProjectsDir()
  const transcripts: string[] = []

  try {
    const projectDirs = await readdir(projectsDir).catch(() => [])
    for (const projectDir of projectDirs.slice(0, 3)) {
      const projectPath = join(projectsDir, projectDir)
      try {
        const files = await readdir(projectPath)
        const jsonlFiles = files
          .filter(f => f.endsWith('.jsonl'))
          .sort()
          .reverse()
          .slice(0, MAX_SESSIONS_TO_SCAN)

        for (const file of jsonlFiles) {
          try {
            const content = await readFile(join(projectPath, file), 'utf-8')
            if (content.length <= MAX_TRANSCRIPT_SIZE) transcripts.push(content)
          } catch {
            /* skip */
          }
        }
      } catch {
        /* skip */
      }
    }
  } catch {
    /* projects dir may not exist */
  }

  return transcripts
}

function extractInsights(transcripts: string[]): Insight[] {
  const insights: Insight[] = []

  for (const transcript of transcripts) {
    const lines = transcript.split('\n').filter(l => l.trim())
    const messages: { role: string; content: string }[] = []

    for (const line of lines) {
      try {
        const entry = JSON.parse(line)
        if (entry.role && entry.content) {
          messages.push({
            role: entry.role,
            content:
              typeof entry.content === 'string'
                ? entry.content
                : JSON.stringify(entry.content),
          })
        }
      } catch {
        /* skip */
      }
    }

    for (const msg of messages) {
      if (msg.role !== 'user') continue
      const text = msg.content.toLowerCase()

      if (
        text.includes('不要') ||
        text.includes('别') ||
        text.includes("don't")
      ) {
        insights.push({
          title: `User preference: ${msg.content.slice(0, 50)}`,
          description: 'User expressed a negative preference',
          type: 'feedback',
          content: msg.content,
        })
      }

      if (
        text.includes('不对') ||
        text.includes('错了') ||
        text.includes('wrong')
      ) {
        insights.push({
          title: `User correction: ${msg.content.slice(0, 50)}`,
          description: 'User corrected an approach',
          type: 'feedback',
          content: msg.content,
        })
      }

      if (
        text.includes('项目') ||
        text.includes('架构') ||
        text.includes('architecture')
      ) {
        insights.push({
          title: `Project context: ${msg.content.slice(0, 50)}`,
          description: 'User described project architecture',
          type: 'project',
          content: msg.content,
        })
      }
    }
  }

  const seen = new Set<string>()
  return insights
    .filter(i => {
      const key = i.description.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 10)
}
