import { readdir, readFile, writeFile, mkdir, cp } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
import ejs from 'ejs'
import type { ProjectAnswers } from '../types.js'
import type { RenderContext } from './template.js'

const EJS_EXTENSIONS = ['.ejs', '.ejs.t']
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist'])

function shouldRenderFile(filename: string): boolean {
  return EJS_EXTENSIONS.some((ext) => filename.endsWith(ext))
}

function getOutputFilename(filename: string): string {
  for (const ext of EJS_EXTENSIONS) {
    if (filename.endsWith(ext)) {
      return filename.slice(0, -ext.length)
    }
  }
  return filename
}

async function collectFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, baseDir)))
    } else {
      files.push(relative(baseDir, fullPath))
    }
  }

  return files
}

async function renderFile(
  sourcePath: string,
  targetPath: string,
  context: RenderContext,
): Promise<void> {
  const content = await readFile(sourcePath, 'utf-8')
  const rendered = ejs.render(content, context, {
    async: false,
    escape: (value) => String(value),
  })
  await mkdir(dirname(targetPath), { recursive: true })
  await writeFile(targetPath, rendered, 'utf-8')
}

export async function renderTemplateDir(
  templateDir: string,
  targetDir: string,
  context: RenderContext,
  _answers: ProjectAnswers,
  options?: { skipPaths?: string[] },
): Promise<void> {
  const skipPaths = options?.skipPaths ?? []
  const files = await collectFiles(templateDir)

  for (const file of files) {
    if (skipPaths.some((segment) => file.startsWith(segment))) continue

    const sourcePath = join(templateDir, file)
    const outputName = getOutputFilename(file)
    const targetPath = join(targetDir, outputName)

    if (shouldRenderFile(file)) {
      await renderFile(sourcePath, targetPath, context)
    } else {
      await mkdir(dirname(targetPath), { recursive: true })
      await cp(sourcePath, targetPath)
    }
  }
}
