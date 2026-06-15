import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { LocalCommandCall } from '../../types/command.js'
import { getAutoMemPath } from '../../memdir/paths.js'
import { getProjectsDir } from '../../utils/sessionStorage.js'
import { logForDebugging } from '../../utils/debug.js'

const MAX_TRANSCRIPT_SIZE = 200_000
const MAX_SESSIONS = 10
const MIN_REPEAT_COUNT = 2

const call: LocalCommandCall = async (args, context) => {
  try {
    const transcripts = await loadTranscripts()
    const workflows = detectRepeatedWorkflows(transcripts)

    if (workflows.length === 0) {
      return {
        type: 'text',
        value:
          '🔬 No repeated workflows detected yet. Keep working — patterns emerge over time.',
      }
    }

    const memoryDir = getAutoMemPath()
    let written = 0

    for (const wf of workflows) {
      const filename = `distill_${wf.name.replace(/\s+/g, '_')}.md`
      const content = `---
name: ${wf.name}
description: Repeated workflow detected (${wf.count} times): ${wf.description}
metadata:
  type: reference
---

# ${wf.name}

Detected ${wf.count} times across recent sessions.

## Steps
${wf.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`
      try {
        await writeFile(join(memoryDir, filename), content, 'utf-8')
        written++
      } catch (e) {
        logForDebugging(`distill: write failed: ${String(e)}`, {
          level: 'warn',
        })
      }
    }

    const summary = workflows
      .map(wf => `  • ${wf.name} (${wf.count}×): ${wf.description}`)
      .join('\n')

    return {
      type: 'text',
      value: `🔬 Distill complete!\n- Analyzed ${transcripts.length} sessions\n- Found ${workflows.length} repeated workflows\n- Saved ${written} distill notes\n\n${summary}`,
    }
  } catch (e) {
    return { type: 'text', value: `✗ Distill failed: ${String(e)}` }
  }
}

export { call }

type Workflow = {
  name: string
  description: string
  count: number
  steps: string[]
}

async function loadTranscripts(): Promise<string[]> {
  const projectsDir = getProjectsDir()
  const transcripts: string[] = []

  try {
    const projectDirs = await readdir(projectsDir).catch(() => [])
    for (const dir of projectDirs.slice(0, 3)) {
      try {
        const files = await readdir(join(projectsDir, dir))
        const jsonl = files
          .filter(f => f.endsWith('.jsonl'))
          .sort()
          .reverse()
          .slice(0, MAX_SESSIONS)
        for (const f of jsonl) {
          try {
            const c = await readFile(join(projectsDir, dir, f), 'utf-8')
            if (c.length <= MAX_TRANSCRIPT_SIZE) transcripts.push(c)
          } catch {
            /* skip */
          }
        }
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }

  return transcripts
}

function detectRepeatedWorkflows(transcripts: string[]): Workflow[] {
  const sequences: string[][] = []

  for (const transcript of transcripts) {
    const tools: string[] = []
    for (const line of transcript.split('\n')) {
      try {
        const entry = JSON.parse(line)
        if (entry.type === 'tool_use' && entry.name) tools.push(entry.name)
      } catch {
        /* skip */
      }
    }
    if (tools.length >= 2) sequences.push(tools)
  }

  const patternCounts = new Map<string, { count: number; tools: string[] }>()

  for (const seq of sequences) {
    const seen = new Set<string>()
    for (let len = 2; len <= Math.min(4, seq.length); len++) {
      for (let i = 0; i <= seq.length - len; i++) {
        const sub = seq.slice(i, i + len)
        const key = sub.join('→')
        if (seen.has(key)) continue
        seen.add(key)

        const existing = patternCounts.get(key)
        if (existing) existing.count++
        else patternCounts.set(key, { count: 1, tools: sub })
      }
    }
  }

  return Array.from(patternCounts.values())
    .filter(p => p.count >= MIN_REPEAT_COUNT)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(p => ({
      name: `workflow-${p.tools.join('-')}`,
      description: `${p.tools.join(' → ')}`,
      count: p.count,
      steps: p.tools.map(t => `Run ${t}`),
    }))
}
