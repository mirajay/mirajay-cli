import { join } from 'node:path'
import { step } from './logger.js'
import type { EngineeringOptions, ProjectAnswers } from '../types.js'
import { getEngineeringManifest } from './engineering-manifest.js'
import { mergePackageManifest } from './merge-package.js'
import { resolveEngineeringProfile } from './engineering-profile.js'
import { findWorkspacePackageDirs, isMonorepoRoot } from './workspace.js'
import { resolveUseTypeScript } from './typescript-mode.js'
import { shouldUseMonorepoLayout } from './monorepo-layout.js'

export type EngineeringFileScope = 'shared' | 'app' | 'all'

/** 桌面/移动 Monorepo 布局，或 Module Federation 自带 workspace */
export function isWorkspaceEngineeringMonorepo(
  answers: ProjectAnswers,
  templateName: string,
): boolean {
  return (
    shouldUseMonorepoLayout(answers, templateName) ||
    templateName.startsWith('micro-module-federation')
  )
}

/** 主应用相对路径：desktop monorepo → apps/web；MF → apps/host；扁平 → . */
export function resolveEngineeringAppRelativePath(
  answers: ProjectAnswers,
  templateName: string,
): string {
  if (shouldUseMonorepoLayout(answers, templateName)) return 'apps/web'
  if (templateName.startsWith('micro-module-federation')) return 'apps/host'
  return '.'
}

export function resolveEngineeringAppDir(
  rootDir: string,
  answers: ProjectAnswers,
  templateName: string,
): string {
  const relative = resolveEngineeringAppRelativePath(answers, templateName)
  return relative === '.' ? rootDir : join(rootDir, relative)
}

/** 全仓共享：Prettier / EditorConfig / markdownlint / cspell */
export function isSharedEngineeringFile(relativePath: string): boolean {
  const p = relativePath.replace(/\\/g, '/')
  return (
    p.includes('prettier.config') ||
    p.includes('.prettierignore') ||
    p.includes('.editorconfig') ||
    p.includes('.markdownlint') ||
    p.includes('cspell.json')
  )
}

/** 应用级：ESLint / Stylelint / Vitest（随框架 profile） */
export function isAppEngineeringFile(relativePath: string): boolean {
  const p = relativePath.replace(/\\/g, '/')
  return (
    p.includes('eslint.') ||
    p.includes('stylelint.') ||
    p.includes('vitest.config.') ||
    p.includes('setup.') ||
    p.includes('smoke.test.')
  )
}

export function matchesEngineeringFileScope(
  relativePath: string,
  scope: EngineeringFileScope,
): boolean {
  if (scope === 'all') return true
  if (scope === 'shared') return isSharedEngineeringFile(relativePath)
  return isAppEngineeringFile(relativePath)
}

/** 仅向 apps/* 注入 lint 依赖与脚本；packages/* 共享包不单独跑 lint */
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
    scope: 'app',
  })

  step(`向 ${appDirs.length} 个应用子包注入工程化 scripts 与依赖...`)

  for (const pkgDir of appDirs) {
    await mergePackageManifest(pkgDir, manifest)
  }
}
