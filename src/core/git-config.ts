import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import ejs from 'ejs'
import { getTemplatesDir } from './templates-dir.js'
import type { RenderContext } from './template.js'

export async function renderGitBaseFiles(options: {
  gitRootDir: string
  context: RenderContext
  templatesDir?: string
}): Promise<void> {
  const { gitRootDir, context, templatesDir } = options
  const gitBaseDir = join(getTemplatesDir(templatesDir), 'git-base')
  const templatePath = join(gitBaseDir, '.gitignore.ejs')
  const content = await readFile(templatePath, 'utf-8')
  const rendered = ejs.render(content, context, {
    async: false,
    escape: (value) => String(value),
  })

  const targetPath = join(gitRootDir, '.gitignore')
  await mkdir(dirname(targetPath), { recursive: true })
  await writeFile(targetPath, rendered, 'utf-8')
}
