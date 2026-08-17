import { step } from './logger.js'
import type { EngineeringOptions, ProjectAnswers } from '../types.js'
import { getEngineeringManifest } from './engineering-manifest.js'
import { mergePackageManifest } from './merge-package.js'
import { resolveEngineeringProfile } from './engineering-profile.js'
import { findWorkspacePackageDirs, isMonorepoRoot } from './workspace.js'
import { resolveUseTypeScript } from './typescript-mode.js'

/** 仅向 apps/* 注入 lint 依赖与脚本；packages/shared 等共享包不单独跑 lint */
export function shouldInjectWorkspaceEngineering(pkgDir: string): boolean {
  const normalized = pkgDir.replace(/\\/g, '/')
  return normalized.includes('/apps/')
}

export async function mergeEngineeringToWorkspacePackages(options: {
  rootDir: string
  answers: ProjectAnswers
  engineering: EngineeringOptions
}): Promise<void> {
  const { rootDir, answers, engineering } = options

  if (!(await isMonorepoRoot(rootDir))) return

  const packageDirs = await findWorkspacePackageDirs(rootDir)
  const appDirs = packageDirs.filter(shouldInjectWorkspaceEngineering)
  if (appDirs.length === 0) return

  const profile = resolveEngineeringProfile(answers)
  if (!profile) return

  const manifest = getEngineeringManifest({
    profile,
    engineering,
    useTypeScript: resolveUseTypeScript(answers),
    includeGitHooks: false,
  })

  step(`向 ${appDirs.length} 个应用子包注入工程化 scripts 与依赖...`)

  for (const pkgDir of appDirs) {
    await mergePackageManifest(pkgDir, manifest)
  }
}
