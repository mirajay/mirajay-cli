import { readFile, writeFile, mkdir, cp } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import ejs from 'ejs'
import { getTemplatesDir } from './templates-dir.js'
import type { EngineeringOptions } from '../types.js'
import type { RenderContext } from './template.js'

const GIT_HOOKS_FILES: Record<string, string> = {
  'git-hooks/commitlint.config.cjs.ejs': 'commitlint.config.cjs',
  'git-hooks/lint-staged.config.mjs.ejs': 'lint-staged.config.mjs',
  'git-hooks/husky/pre-commit.ejs': '.husky/pre-commit',
  'git-hooks/husky/commit-msg.ejs': '.husky/commit-msg',
}

export function shouldRenderGitHooks(engineering: EngineeringOptions): boolean {
  return Boolean(engineering.husky || engineering.commitlint || engineering.lintStaged)
}

export async function renderGitHooksFiles(options: {
  gitRootDir: string
  context: RenderContext
  engineering: EngineeringOptions
  templatesDir?: string
}): Promise<void> {
  const { gitRootDir, context, engineering, templatesDir } = options
  if (!shouldRenderGitHooks(engineering)) return

  const engineeringDir = join(getTemplatesDir(templatesDir), 'engineering-base')

  for (const [sourceRel, targetRel] of Object.entries(GIT_HOOKS_FILES)) {
    if (targetRel.includes('husky/pre-commit') && (!engineering.husky || !engineering.lintStaged)) {
      continue
    }
    if (targetRel.includes('husky/commit-msg') && (!engineering.husky || !engineering.commitlint)) {
      continue
    }
    if (targetRel.includes('lint-staged') && !engineering.lintStaged) {
      continue
    }
    if (targetRel.includes('commitlint.config') && !engineering.commitlint) {
      continue
    }

    const sourcePath = join(engineeringDir, sourceRel)
    const targetPath = join(gitRootDir, targetRel)

    if (sourceRel.endsWith('.ejs')) {
      const content = await readFile(sourcePath, 'utf-8')
      const rendered = ejs.render(content, context, {
        async: false,
        escape: (value) => String(value),
      })
      await mkdir(dirname(targetPath), { recursive: true })
      await writeFile(targetPath, rendered, 'utf-8')
    } else {
      await mkdir(dirname(targetPath), { recursive: true })
      await cp(sourcePath, targetPath)
    }
  }
}
