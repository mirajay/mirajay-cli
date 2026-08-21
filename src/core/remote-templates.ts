import { createHash } from 'node:crypto'
import { homedir } from 'node:os'
import { join, resolve, isAbsolute } from 'node:path'
import { downloadTemplate } from 'giget'
import { step } from './logger.js'
import { getTemplatesDir } from './templates-dir.js'

const REMOTE_SOURCE_PATTERN =
  /^(gh:|gitlab:|bitbucket:|git:|https?:\/\/|file:\/\/)/

export function isRemoteTemplateSource(source: string): boolean {
  return REMOTE_SOURCE_PATTERN.test(source.trim())
}

export function validateRemoteTemplateSource(source: string): void {
  const trimmed = source.trim()
  if (!REMOTE_SOURCE_PATTERN.test(trimmed)) {
    throw new Error(
      `Invalid remote template source: ${source}. Use gh:, gitlab:, git:, or https://`,
    )
  }
  if (/[;&|`$]/.test(trimmed)) {
    throw new Error('Remote template source contains invalid characters')
  }
}

function getCacheDir(source: string, cacheRoot?: string): string {
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 16)
  return join(cacheRoot || join(homedir(), '.cache', 'mirajay-cli', 'templates'), hash)
}

export async function fetchRemoteTemplate(
  source: string,
  options?: { cacheDir?: string; force?: boolean },
): Promise<string> {
  validateRemoteTemplateSource(source)
  const dir = getCacheDir(source, options?.cacheDir)

  step(`下载远程模板: ${source}`)

  const result = await downloadTemplate(source.trim(), {
    dir,
    force: options?.force ?? false,
  })

  return result.dir
}

export async function resolveBusinessTemplatesRoot(options: {
  templatesDir?: string
  templateName: string
  templateSource?: string
  remoteTemplates?: Record<string, string>
  templateCacheDir?: string
}): Promise<string> {
  if (options.templateSource) {
    return fetchRemoteTemplate(options.templateSource, {
      cacheDir: options.templateCacheDir,
    })
  }

  const mapped = options.remoteTemplates?.[options.templateName]
  if (mapped) {
    return fetchRemoteTemplate(mapped, { cacheDir: options.templateCacheDir })
  }

  if (options.templatesDir) {
    return isAbsolute(options.templatesDir)
      ? options.templatesDir
      : resolve(process.cwd(), options.templatesDir)
  }

  return getTemplatesDir()
}

export async function resolveTemplateDirectory(options: {
  templatesDir?: string
  templateName: string
  templateSource?: string
  remoteTemplates?: Record<string, string>
  templateCacheDir?: string
}): Promise<{ baseDir: string; templateDir: string; localTemplatesDir: string }> {
  const localTemplatesDir = getTemplatesDir(options.templatesDir)
  const usesRemote = Boolean(
    options.templateSource || options.remoteTemplates?.[options.templateName],
  )

  const baseDir = await resolveBusinessTemplatesRoot(options)
  const templateDir = usesRemote ? baseDir : join(baseDir, options.templateName)

  return { baseDir, templateDir, localTemplatesDir }
}
