import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PackageManifestPatch } from './engineering-manifest.js'

interface PackageJson {
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
  [key: string]: unknown
}

export async function mergePackageManifest(
  targetDir: string,
  patch: PackageManifestPatch,
): Promise<void> {
  const pkgPath = join(targetDir, 'package.json')
  const raw = await readFile(pkgPath, 'utf-8')
  const pkg = JSON.parse(raw) as PackageJson

  pkg.devDependencies = {
    ...pkg.devDependencies,
    ...patch.devDependencies,
  }

  pkg.scripts = {
    ...pkg.scripts,
    ...patch.scripts,
  }

  if (patch.config) {
    pkg.config = {
      ...(typeof pkg.config === 'object' && pkg.config !== null ? pkg.config : {}),
      ...patch.config,
    }
  }

  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')
}
