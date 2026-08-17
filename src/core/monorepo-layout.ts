import { mkdir, readdir, rename, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { ProjectAnswers } from '../types.js'
import type { RenderContext } from './template.js'
import { renderTemplateDir } from './monorepo-render.js'
import { step } from './logger.js'

export function shouldUseMonorepoLayout(
  answers: ProjectAnswers,
  templateName: string,
): boolean {
  return Boolean(answers.useMonorepo) && !templateName.startsWith('micro-')
}

export function resolveAppTargetDir(
  targetDir: string,
  answers: ProjectAnswers,
  templateName: string,
): string {
  if (shouldUseMonorepoLayout(answers, templateName)) {
    return join(targetDir, 'apps/web')
  }
  return targetDir
}

export async function finalizeMonorepoLayout(options: {
  rootDir: string
  localTemplatesDir: string
  context: RenderContext
  answers: ProjectAnswers
}): Promise<void> {
  const { rootDir, localTemplatesDir, context, answers } = options
  const monorepoDir = join(localTemplatesDir, 'monorepo-base')

  step('配置 Monorepo 根目录 (Turborepo + pnpm workspace)...')
  await renderTemplateDir(monorepoDir, rootDir, context, answers, {
    skipPaths: ['packages/shared'],
  })

  const sharedDir = join(monorepoDir, 'packages/shared')
  await renderTemplateDir(sharedDir, join(rootDir, 'packages/shared'), context, answers)

  await mkdir(join(rootDir, 'apps'), { recursive: true })
  await mkdir(join(rootDir, 'packages'), { recursive: true })
}

/** 若旧版生成把应用放在根目录，迁移到 apps/web */
export async function migrateLegacyMonorepoRootApp(rootDir: string): Promise<void> {
  const appDir = join(rootDir, 'apps/web')
  try {
    await stat(appDir)
    return
  } catch {
    // apps/web 不存在，无需迁移
  }

  try {
    await stat(join(rootDir, 'vite.config.ts'))
  } catch {
    return
  }

  await mkdir(appDir, { recursive: true })
  const entries = await readdir(rootDir, { withFileTypes: true })
  const keepAtRoot = new Set([
    'apps',
    'packages',
    'node_modules',
    '.git',
    'turbo.json',
    'pnpm-workspace.yaml',
    'pnpm-lock.yaml',
    'package.json',
    'README.md',
    '.github',
    '.husky',
    '.gitignore',
  ])

  for (const entry of entries) {
    if (keepAtRoot.has(entry.name)) continue
    await rename(join(rootDir, entry.name), join(appDir, entry.name))
  }
}
