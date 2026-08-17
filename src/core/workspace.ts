import { access, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function findWorkspacePackageDirs(rootDir: string): Promise<string[]> {
  const dirs: string[] = []

  for (const folder of ['apps', 'packages']) {
    const base = join(rootDir, folder)
    try {
      const entries = await readdir(base, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const pkgDir = join(base, entry.name)
        try {
          await access(join(pkgDir, 'package.json'))
          dirs.push(pkgDir)
        } catch {
          // skip
        }
      }
    } catch {
      // folder not present
    }
  }

  return dirs
}

export async function isMonorepoRoot(rootDir: string): Promise<boolean> {
  for (const file of ['pnpm-workspace.yaml', 'turbo.json']) {
    try {
      await access(join(rootDir, file))
      return true
    } catch {
      // continue
    }
  }
  return false
}

export async function readWorkspacePatterns(rootDir: string): Promise<string[]> {
  try {
    const content = await readFile(join(rootDir, 'pnpm-workspace.yaml'), 'utf-8')
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => line.slice(2).replace(/['"]/g, ''))
  } catch {
    return []
  }
}
