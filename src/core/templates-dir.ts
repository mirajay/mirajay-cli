import { existsSync } from 'node:fs'
import { join, dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function resolveDefaultTemplatesDir(): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    join(moduleDir, '../templates'),
    join(moduleDir, '../../templates'),
  ]

  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }

  throw new Error('Templates directory not found. Ensure templates/ exists in the package root.')
}

const DEFAULT_TEMPLATES_DIR = resolveDefaultTemplatesDir()

export function getTemplatesDir(customDir?: string): string {
  if (!customDir) return DEFAULT_TEMPLATES_DIR
  return isAbsolute(customDir) ? customDir : resolve(process.cwd(), customDir)
}
