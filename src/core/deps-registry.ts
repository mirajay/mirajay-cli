import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import semver from 'semver'
import { execa } from 'execa'
import { getTemplatesDir } from './templates-dir.js'

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist'])
const SKIP_KEYS = new Set([
  'version',
  'name',
  'private',
  'type',
  'main',
  'module',
  'license',
  'author',
  'description',
  'engines',
  'bin',
  'files',
  'keywords',
])

/** "pkg": "^1.2.3" | 'pkg': '^1.2.3' | pkg: '^1.2.3' */
const DEP_ENTRY_PATTERN =
  /(?:["']([@a-zA-Z0-9\-./]+)["']|([\w@/-]+))\s*:\s*["']([\^~]?)(\d+\.\d+\.\d+(?:-[\w.-]+)?)["']/g

export interface DepReference {
  file: string
  packageName: string
  fullRange: string
  prefix: '' | '^' | '~'
  version: string
}

export interface DepUpdatePlan {
  packageName: string
  fromRange: string
  toRange: string
  latestVersion: string
  files: string[]
}

export interface UpdateDepsResult {
  scannedFiles: number
  uniquePackages: number
  updates: DepUpdatePlan[]
  skippedPackages: string[]
  failedPackages: string[]
}

export type LatestVersionFetcher = (packageName: string) => Promise<string | null>

export function parseDepReferences(content: string, file: string): DepReference[] {
  const refs: DepReference[] = []
  DEP_ENTRY_PATTERN.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = DEP_ENTRY_PATTERN.exec(content)) !== null) {
    const packageName = match[1] || match[2]
    if (SKIP_KEYS.has(packageName)) continue

    const prefix = (match[3] || '') as DepReference['prefix']
    const version = match[4]
    if (!semver.valid(version)) continue

    refs.push({
      file,
      packageName,
      fullRange: `${prefix}${version}`,
      prefix,
      version,
    })
  }

  return refs
}

export function buildNextRange(prefix: DepReference['prefix'], latestVersion: string): string {
  if (!prefix) return latestVersion
  return `${prefix}${latestVersion}`
}

export function isOutdated(currentVersion: string, latestVersion: string): boolean {
  return semver.lt(currentVersion, latestVersion)
}

export function replaceDepRange(
  content: string,
  packageName: string,
  fromRange: string,
  toRange: string,
): string {
  if (fromRange === toRange) return content

  const escapedName = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedRange = fromRange.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const doubleQuoted = new RegExp(`("${escapedName}"\\s*:\\s*")${escapedRange}(")`, 'g')
  const singleQuotedKey = new RegExp(`('${escapedName}'\\s*:\\s*')${escapedRange}(')`, 'g')
  const bareKey = new RegExp(`(${escapedName}\\s*:\\s*["'])${escapedRange}(["'])`, 'g')

  return content
    .replace(doubleQuoted, `$1${toRange}$2`)
    .replace(singleQuotedKey, `$1${toRange}$2`)
    .replace(bareKey, `$1${toRange}$2`)
}

async function collectTargetFiles(scaffoldRoot: string, includeCli: boolean): Promise<string[]> {
  const templatesDir = join(scaffoldRoot, 'templates')
  const files: string[] = []

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.name === 'package.json' || entry.name === 'package.json.ejs') {
        files.push(fullPath)
      }
    }
  }

  await walk(templatesDir)
  files.push(join(scaffoldRoot, 'src/core/engineering-manifest.ts'))

  if (includeCli) {
    files.push(join(scaffoldRoot, 'package.json'))
  }

  return files
}

export async function collectAllDepReferences(
  scaffoldRoot: string,
  includeCli = false,
): Promise<DepReference[]> {
  const files = await collectTargetFiles(scaffoldRoot, includeCli)
  const refs: DepReference[] = []

  for (const file of files) {
    const content = await readFile(file, 'utf-8')
    refs.push(...parseDepReferences(content, file))
  }

  return refs
}

export async function defaultLatestVersionFetcher(
  packageName: string,
): Promise<string | null> {
  try {
    const { stdout } = await execa(
      'npm',
      ['view', packageName, 'version', '--registry=https://registry.npmjs.org'],
      { stdio: 'pipe', timeout: 30_000 },
    )
    const version = stdout.trim()
    return semver.valid(version) ? version : null
  } catch {
    return null
  }
}

export async function planDepUpdates(options: {
  scaffoldRoot: string
  includeCli?: boolean
  onlyPackages?: string[]
  fetchLatest?: LatestVersionFetcher
}): Promise<UpdateDepsResult> {
  const {
    scaffoldRoot,
    includeCli = false,
    onlyPackages,
    fetchLatest = defaultLatestVersionFetcher,
  } = options

  const refs = await collectAllDepReferences(scaffoldRoot, includeCli)
  const files = new Set(refs.map((ref) => ref.file))
  const grouped = new Map<string, DepReference[]>()

  for (const ref of refs) {
    if (onlyPackages && !onlyPackages.includes(ref.packageName)) continue
    const list = grouped.get(ref.packageName) ?? []
    list.push(ref)
    grouped.set(ref.packageName, list)
  }

  const updates: DepUpdatePlan[] = []
  const skippedPackages: string[] = []
  const failedPackages: string[] = []

  for (const [packageName, packageRefs] of grouped) {
    const latestVersion = await fetchLatest(packageName)
    if (!latestVersion) {
      failedPackages.push(packageName)
      continue
    }

    const rangeMap = new Map<string, Set<string>>()
    let needsUpdate = false

    for (const ref of packageRefs) {
      if (isOutdated(ref.version, latestVersion)) {
        needsUpdate = true
        const toRange = buildNextRange(ref.prefix, latestVersion)
        const key = `${ref.fullRange}->${toRange}`
        const fileSet = rangeMap.get(key) ?? new Set<string>()
        fileSet.add(ref.file)
        rangeMap.set(key, fileSet)
      }
    }

    if (!needsUpdate) {
      skippedPackages.push(packageName)
      continue
    }

    for (const [transition, fileSet] of rangeMap) {
      const [fromRange, toRange] = transition.split('->')
      updates.push({
        packageName,
        fromRange,
        toRange,
        latestVersion,
        files: [...fileSet],
      })
    }
  }

  return {
    scannedFiles: files.size,
    uniquePackages: grouped.size,
    updates,
    skippedPackages,
    failedPackages,
  }
}

export async function applyDepUpdates(options: {
  scaffoldRoot: string
  updates: DepUpdatePlan[]
}): Promise<number> {
  const { updates } = options
  const fileChanges = new Map<string, Array<{ packageName: string; from: string; to: string }>>()

  for (const update of updates) {
    for (const file of update.files) {
      const list = fileChanges.get(file) ?? []
      list.push({
        packageName: update.packageName,
        from: update.fromRange,
        to: update.toRange,
      })
      fileChanges.set(file, list)
    }
  }

  let changedFiles = 0

  for (const [file, changes] of fileChanges) {
    let content = await readFile(file, 'utf-8')
    const original = content

    for (const change of changes) {
      content = replaceDepRange(content, change.packageName, change.from, change.to)
    }

    if (content !== original) {
      await writeFile(file, content, 'utf-8')
      changedFiles += 1
    }
  }

  return changedFiles
}

export function resolveScaffoldRoot(cwd = process.cwd()): string {
  try {
    const templatesDir = getTemplatesDir()
    if (templatesDir.includes('/dist/') || templatesDir.endsWith('/dist/templates')) {
      return join(templatesDir, '../..')
    }
    return join(templatesDir, '..')
  } catch {
    return cwd
  }
}

export function formatRelativePath(scaffoldRoot: string, file: string): string {
  return relative(scaffoldRoot, file) || file
}

export function summarizeUpdates(updates: DepUpdatePlan[]): Map<string, DepUpdatePlan> {
  const summary = new Map<string, DepUpdatePlan>()
  for (const update of updates) {
    const existing = summary.get(update.packageName)
    if (!existing || semver.lt(existing.latestVersion, update.latestVersion)) {
      summary.set(update.packageName, update)
    }
  }
  return summary
}
