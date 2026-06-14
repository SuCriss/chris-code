import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { LocalCommandCall } from '../../types/command.js'
import { getAutoMemPath } from '../../memdir/paths.js'
import { scanMemoryFiles } from '../../memdir/memoryScan.js'
import { saveCheckpoint } from '../../memdir/checkpoint.js'
import { getProjectsDir } from '../../utils/sessionStorage.js'
import { logForDebugging } from '../../utils/debug.js'

const MAX_TRANSCRIPT_SIZE = 200_000
const MAX_SESSIONS_TO_SCAN = 5

export default async function dreamCommand(
  call: LocalCommandCall,
): Promise<void> {
  const { setMessages } = call
  const memoryDir = getAutoMemPath()

  setMessages?.([
    {
      type: 'text' as const,
      text: '💭 Dreaming... scanning recent sessions...',
    },
  ])

  try {
    const transcripts = await scanRecentTranscripts()
    const existingMemories = await scanMemoryFiles(
      memoryDir,
      new AbortController().signal,
    )
    const existingDescs = new Set(
      existingMemories.map(m => m.description?.toLowerCase()).filter(Boolean),
    )

    const insights = extractInsights(transcripts)

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
      } catch (e) {
        logForDebugging(`dream: failed to write ${filename}: ${String(e)}`, {
          level: 'warn',
        })
      }
    }

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

    setMessages?.([
      {
        type: 'text' as const,
        text: `💭 Dream complete!\n- Scanned ${transcripts.length} recent sessions\n- Extracted ${written} new memories\n- Existing memories: ${existingMemories.length}`,
      },
    ])
  } catch (e) {
    setMessages?.([
      { type: 'text' as const, text: `✗ Dream failed: ${String(e)}` },
    ])
  }
}

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
