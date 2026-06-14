/**
 * Security vulnerability scanner.
 * Scans source code for common security issues.
 */

import { readdir, readFile, stat } from 'fs/promises'
import { join, relative, extname } from 'path'
import { getProjectRoot } from '../../bootstrap/state.js'

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type Finding = {
  file: string
  line: number
  severity: Severity
  rule: string
  message: string
  snippet: string
}

type Rule = {
  id: string
  pattern: RegExp
  severity: Severity
  message: string
  fileFilter?: RegExp
}

const RULES: Rule[] = [
  // Hardcoded secrets
  {
    id: 'SECRET-KEY',
    pattern:
      /(?:api[_-]?key|secret|password|token|auth)\s*[:=]\s*['"][A-Za-z0-9_-]{16,}['"]/gi,
    severity: 'critical',
    message: 'Possible hardcoded secret or API key',
  },
  {
    id: 'PRIVATE-KEY',
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
    severity: 'critical',
    message: 'Private key found in source code',
  },
  {
    id: 'AWS-KEY',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
    message: 'AWS access key detected',
  },

  // Injection
  {
    id: 'SQL-INJECT',
    pattern: /(?:query|execute|raw)\s*\(\s*`[^`]*\$\{/g,
    severity: 'high',
    message: 'Possible SQL injection via template literal',
    fileFilter: /\.(ts|js)$/,
  },
  {
    id: 'EVAL',
    pattern: /\beval\s*\(/g,
    severity: 'high',
    message: 'eval() usage — potential code injection',
  },
  {
    id: 'EXEC-SYNC',
    pattern: /execSync\s*\(/g,
    severity: 'medium',
    message: 'execSync usage — consider input validation',
  },
  {
    id: 'CHILD-EXEC',
    pattern: /exec\s*\(\s*`/g,
    severity: 'high',
    message: 'Shell command with template literal — injection risk',
  },

  // XSS
  {
    id: 'INNER-HTML',
    pattern: /\.innerHTML\s*=/g,
    severity: 'high',
    message: 'Direct innerHTML assignment — XSS risk',
    fileFilter: /\.(ts|tsx|js|jsx)$/,
  },
  {
    id: 'DANGEROUSLY-SET',
    pattern: /dangerouslySetInnerHTML/g,
    severity: 'medium',
    message: 'dangerouslySetInnerHTML usage — ensure sanitization',
  },

  // Crypto
  {
    id: 'WEAK-CRYPTO',
    pattern: /\b(?:md5|sha1)\b/gi,
    severity: 'medium',
    message: 'Weak cryptographic algorithm',
    fileFilter: /\.(ts|js)$/,
  },
  {
    id: 'MATH-RANDOM',
    pattern: /Math\.random\(\)/g,
    severity: 'low',
    message: 'Math.random() is not cryptographically secure',
  },

  // Path traversal
  {
    id: 'PATH-TRAVERSAL',
    pattern: /(?:readFile|writeFile|createReadStream)\s*\([^)]*\.\.\//g,
    severity: 'high',
    message: 'Possible path traversal vulnerability',
  },

  // Unsafe deserialization
  {
    id: 'JSON-PARSE-UNTRUSTED',
    pattern: /JSON\.parse\s*\(\s*(?:req\.|params\.|query\.|body\.)/g,
    severity: 'medium',
    message: 'JSON.parse on untrusted input without validation',
  },

  // Debug/dev in production
  {
    id: 'CONSOLE-LOG',
    pattern: /console\.(log|debug|info)\s*\(/g,
    severity: 'info',
    message: 'Console output — remove for production',
    fileFilter: /\.(ts|js)$/,
  },
  {
    id: 'TODO-FIXME',
    pattern: /(?:TODO|FIXME|HACK|XXX)\b/g,
    severity: 'info',
    message: 'Unresolved TODO/FIXME comment',
  },
]

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '__pycache__',
])
const SCAN_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.rb',
  '.go',
  '.rs',
  '.java',
  '.php',
  '.env',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
])
const MAX_FILE_SIZE = 500_000 // 500KB
const MAX_FILES = 500

async function walkDir(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue
    if (files.length >= MAX_FILES) break
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkDir(fullPath, files)
    } else {
      const ext = extname(entry.name)
      if (
        SCAN_EXTENSIONS.has(ext) ||
        entry.name === 'Dockerfile' ||
        entry.name === '.env'
      ) {
        const s = await stat(fullPath).catch(() => null)
        if (s && s.size <= MAX_FILE_SIZE) files.push(fullPath)
      }
    }
  }
  return files
}

export async function scanDirectory(dir?: string): Promise<Finding[]> {
  const root = dir || getProjectRoot()
  const files = await walkDir(root)
  const findings: Finding[] = []

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8').catch(() => null)
    if (!content) continue

    const relPath = relative(root, filePath)
    const lines = content.split('\n')

    for (const rule of RULES) {
      if (rule.fileFilter && !rule.fileFilter.test(filePath)) continue

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // Reset regex lastIndex for global patterns
        rule.pattern.lastIndex = 0
        const match = rule.pattern.exec(line)
        if (match) {
          findings.push({
            file: relPath,
            line: i + 1,
            severity: rule.severity,
            rule: rule.id,
            message: rule.message,
            snippet: line.trim().slice(0, 120),
          })
        }
      }
    }
  }

  return findings.sort((a, b) => {
    const order: Record<Severity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    }
    return order[a.severity] - order[b.severity]
  })
}

export function formatFindings(findings: Finding[]): string {
  if (findings.length === 0) return '✅ No security issues found!'

  const counts: Record<string, number> = {}
  for (const f of findings) {
    counts[f.severity] = (counts[f.severity] || 0) + 1
  }

  const icons: Record<Severity, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
    info: '⚪',
  }

  const lines: string[] = [
    '# Security Audit Report',
    '',
    `Found **${findings.length}** issues:`,
    '',
    ...Object.entries(counts).map(
      ([sev, cnt]) => `- ${icons[sev as Severity]} ${sev}: ${cnt}`,
    ),
    '',
    '## Findings',
    '',
  ]

  for (const f of findings) {
    lines.push(`### ${icons[f.severity]} [${f.rule}] ${f.message}`)
    lines.push(`- **File:** \`${f.file}:${f.line}\``)
    lines.push(`- **Code:** \`${f.snippet}\``)
    lines.push('')
  }

  return lines.join('\n')
}
