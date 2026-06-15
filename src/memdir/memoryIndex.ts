/**
 * SQLite FTS5 full-text search index for memory files.
 *
 * Replaces the Sonnet side-query approach with direct FTS5 search,
 * eliminating extra API calls and reducing latency.
 *
 * Uses bun:sqlite (Bun built-in, zero external dependencies).
 */

import { Database } from 'bun:sqlite'
import { readdir, stat } from 'fs/promises'
import { basename, join } from 'path'
import { parseFrontmatter } from '../utils/frontmatterParser.js'
import { readFileInRange } from '../utils/readFileInRange.js'
import { getClaudeConfigHomeDir } from '../utils/envUtils.js'
import { logForDebugging } from '../utils/debug.js'

const DB_FILENAME = 'memory-index.db'
const MAX_MEMORY_FILES = 200

export type SearchResult = {
  path: string
  score: number
  description: string | null
}

let _db: Database | null = null

function getDbPath(): string {
  return join(getClaudeConfigHomeDir(), DB_FILENAME)
}

function getDb(): Database {
  if (_db) return _db
  _db = new Database(getDbPath())
  _db.exec('PRAGMA journal_mode=WAL')
  _db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      path TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      description TEXT,
      type TEXT,
      mtime REAL NOT NULL
    )
  `)
  _db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
      content,
      description,
      content=memories,
      content_rowid=rowid,
      tokenize='unicode61'
    )
  `)
  // Triggers to keep FTS in sync with the content table
  _db.exec(`
    CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
      INSERT INTO memories_fts(rowid, content, description)
      VALUES (new.rowid, new.content, new.description);
    END
  `)
  _db.exec(`
    CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content, description)
      VALUES ('delete', old.rowid, old.content, old.description);
    END
  `)
  _db.exec(`
    CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content, description)
      VALUES ('delete', old.rowid, old.content, old.description);
      INSERT INTO memories_fts(rowid, content, description)
      VALUES (new.rowid, new.content, new.description);
    END
  `)
  return _db
}

/**
 * Read the full content of a memory file.
 */
async function readMemoryFile(
  filePath: string,
  signal: AbortSignal,
): Promise<{
  content: string
  description: string | null
  type: string | null
  mtime: number
} | null> {
  try {
    const stats = await stat(filePath)
    const { content } = await readFileInRange(
      filePath,
      0,
      undefined,
      undefined,
      signal,
    )
    const parsed = parseFrontmatter(content, filePath)
    return {
      content: parsed.content || content,
      description: parsed.frontmatter.description || null,
      type: parsed.frontmatter.type || null,
      mtime: stats.mtimeMs,
    }
  } catch {
    return null
  }
}

/**
 * Build the full FTS5 index from all memory files in the directory.
 * Called once on first session load. Subsequent calls use updateIndex().
 */
export async function buildIndex(
  memoryDir: string,
  signal: AbortSignal,
): Promise<number> {
  const db = getDb()

  try {
    const entries = await readdir(memoryDir, { recursive: true })
    const mdFiles = entries
      .filter(f => f.endsWith('.md') && basename(f) !== 'MEMORY.md')
      .slice(0, MAX_MEMORY_FILES)

    const existingPaths = new Set(
      db
        .query('SELECT path FROM memories')
        .all()
        .map((r: any) => r.path),
    )

    let indexed = 0
    const upsert = db.prepare(`
      INSERT INTO memories (path, content, description, type, mtime)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET
        content=excluded.content,
        description=excluded.description,
        type=excluded.type,
        mtime=excluded.mtime
    `)

    for (const relPath of mdFiles) {
      if (signal.aborted) break
      const filePath = join(memoryDir, relPath)
      const data = await readMemoryFile(filePath, signal)
      if (!data) continue

      upsert.run(
        filePath,
        data.content,
        data.description,
        data.type,
        data.mtime,
      )
      existingPaths.delete(filePath)
      indexed++
    }

    // Remove entries for files that no longer exist
    for (const stalePath of existingPaths) {
      db.run('DELETE FROM memories WHERE path = ?', [stalePath])
    }

    logForDebugging(`memoryIndex: built index with ${indexed} files`, {
      level: 'debug',
    })
    return indexed
  } catch (e) {
    logForDebugging(`memoryIndex: buildIndex failed: ${String(e)}`, {
      level: 'debug',
    })
    return 0
  }
}

/**
 * Incrementally update the index — only re-read files whose mtime changed.
 */
export async function updateIndex(
  memoryDir: string,
  signal: AbortSignal,
): Promise<number> {
  const db = getDb()

  try {
    const entries = await readdir(memoryDir, { recursive: true })
    const mdFiles = entries
      .filter(f => f.endsWith('.md') && basename(f) !== 'MEMORY.md')
      .slice(0, MAX_MEMORY_FILES)

    const stored = new Map(
      db
        .query('SELECT path, mtime FROM memories')
        .all()
        .map((r: any) => [r.path, r.mtime] as [string, number]),
    )

    let updated = 0
    const upsert = db.prepare(`
      INSERT INTO memories (path, content, description, type, mtime)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET
        content=excluded.content,
        description=excluded.description,
        type=excluded.type,
        mtime=excluded.mtime
    `)

    for (const relPath of mdFiles) {
      if (signal.aborted) break
      const filePath = join(memoryDir, relPath)
      const fileStat = await stat(filePath).catch(() => null)
      if (!fileStat) continue

      const storedMtime = stored.get(filePath)
      if (storedMtime && Math.abs(storedMtime - fileStat.mtimeMs) < 1) {
        stored.delete(filePath)
        continue // unchanged
      }

      const data = await readMemoryFile(filePath, signal)
      if (!data) continue

      upsert.run(
        filePath,
        data.content,
        data.description,
        data.type,
        data.mtime,
      )
      stored.delete(filePath)
      updated++
    }

    // Remove deleted files
    for (const stalePath of stored.keys()) {
      db.run('DELETE FROM memories WHERE path = ?', [stalePath])
    }

    if (updated > 0) {
      logForDebugging(`memoryIndex: updated ${updated} files`, {
        level: 'debug',
      })
    }
    return updated
  } catch (e) {
    logForDebugging(`memoryIndex: updateIndex failed: ${String(e)}`, {
      level: 'debug',
    })
    return 0
  }
}

/**
 * Search the FTS5 index for memories matching the query.
 * Returns up to `limit` results sorted by relevance.
 */
export function searchMemories(
  query: string,
  limit: number = 5,
): SearchResult[] {
  const db = getDb()

  try {
    const sanitized = query.replace(/['"]/g, ' ').replace(/\s+/g, ' ').trim()

    if (!sanitized) return []

    const results = db
      .query(`
        SELECT m.path, m.description,
               rank * -1 as score
        FROM memories_fts
        JOIN memories m ON m.rowid = memories_fts.rowid
        WHERE memories_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `)
      .all(sanitized, limit) as Array<{
      path: string
      description: string | null
      score: number
    }>

    return results.map(r => ({
      path: r.path,
      score: r.score,
      description: r.description,
    }))
  } catch (e) {
    logForDebugging(`memoryIndex: search failed: ${String(e)}`, {
      level: 'debug',
    })
    return []
  }
}

/**
 * Check if the database exists and has entries.
 */
export function hasIndex(): boolean {
  try {
    const db = getDb()
    const row = db.query('SELECT COUNT(*) as cnt FROM memories').get() as {
      cnt: number
    }
    return row.cnt > 0
  } catch {
    return false
  }
}

/**
 * Close the database connection (for cleanup).
 */
export function closeIndex(): void {
  if (_db) {
    _db.close()
    _db = null
  }
}
