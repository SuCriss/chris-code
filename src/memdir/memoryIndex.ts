/**
 * SQLite FTS5 full-text search index for memory files.
 *
 * Replaces the Sonnet side-query approach with direct FTS5 search,
 * eliminating extra API calls and reducing latency.
 *
 * Supports both Bun (bun:sqlite) and Node.js (better-sqlite3).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DatabaseClass: any = null

async function getDatabaseClass(): Promise<any> {
  if (DatabaseClass) return DatabaseClass

  if (typeof Bun !== 'undefined') {
    // Bun runtime
    const bunSqlite = await import('bun:sqlite')
    DatabaseClass = bunSqlite.Database
  } else {
    // Node.js runtime
    try {
      const betterSqlite3 = await import('better-sqlite3' as string)
      DatabaseClass = betterSqlite3.default
    } catch {
      throw new Error(
        'Node.js requires better-sqlite3. Install it with: npm install better-sqlite3',
      )
    }
  }
  return DatabaseClass
}
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any | null = null

function getDbPath(): string {
  return join(getClaudeConfigHomeDir(), DB_FILENAME)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getDb(): Promise<any> {
  if (_db) return _db
  const DbClass = await getDatabaseClass()
  _db = new DbClass(getDbPath())
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
  const db = await getDb()

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
  const db = await getDb()

  try {
    const entries = await readdir(memoryDir, { recursive: true })
    const mdFiles = entries
      .filter(f => f.endsWith('.md') && basename(f) !== 'MEMORY.md')
      .slice(0, MAX_MEMORY_FILES)

    const stored = new Map<string, number>(
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
export async function searchMemories(
  query: string,
  limit: number = 5,
): Promise<SearchResult[]> {
  const db = await getDb()

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
export async function hasIndex(): Promise<boolean> {
  try {
    const db = await getDb()
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
