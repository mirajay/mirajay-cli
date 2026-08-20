import { readdir, readFile, stat, writeFile, mkdir, cp } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
import ejs from 'ejs'
import { error, step, success, warn } from './logger.js'
import type { EngineeringOptions, ProjectAnswers } from '../types.js'
import { hooks } from './hooks.js'
import { hasAnyEngineering, resolveEngineeringOptions, supportsJsEngineering } from './engineering.js'
import { getEngineeringManifest } from './engineering-manifest.js'
import { mergePackageManifest } from './merge-package.js'
import {
  isWorkspaceEngineeringMonorepo,
  matchesEngineeringFileScope,
  mergeEngineeringToWorkspacePackages,
  resolveEngineeringAppDir,
  resolveEngineeringAppRelativePath,
  type EngineeringFileScope,
} from './monorepo-engineering.js'
import {
  resolveEngineeringProfile,
  profileUsesReact,
  profileUsesVue,
  type EngineeringProfile,
} from './engineering-profile.js'
import { resolveTemplateDirectory } from './remote-templates.js'
import { getTemplatesDir } from './templates-dir.js'
import {
  applyJavaScriptExtension,
  isTypeScriptConfigPath,
  resolveUseTypeScript,
} from './typescript-mode.js'
import { renderGitBaseFiles } from './git-config.js'
import { renderGitHooksFiles } from './git-hooks.js'
import {
  finalizeMonorepoLayout,
  resolveAppTargetDir,
  shouldUseMonorepoLayout,
} from './monorepo-layout.js'
import {
  buildReadmeCommandContext,
  buildReadmeCommandsSection,
  buildReadmeStructureSection,
} from './readme-context.js'

const EJS_EXTENSIONS = ['.ejs', '.ejs.t']
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist'])

const ENGINEERING_OUTPUT_MAP: Record<string, string> = {
  'eslint.react.config.js.ejs': 'eslint.config.js',
  'eslint.vue.config.js.ejs': 'eslint.config.js',
  'stylelint.react.config.mjs.ejs': 'stylelint.config.mjs',
  'stylelint.vue.config.mjs.ejs': 'stylelint.config.mjs',
  'vitest.config.react.ts.ejs': 'vitest.config.ts',
  'vitest.config.vue.ts.ejs': 'vitest.config.ts',
  'src/__tests__/setup.react.ts.ejs': 'src/__tests__/setup.ts',
  'src/__tests__/setup.vue.ts.ejs': 'src/__tests__/setup.ts',
  'src/__tests__/smoke.test.react.ts.ejs': 'src/__tests__/smoke.test.ts',
  'src/__tests__/smoke.test.vue.ts.ejs': 'src/__tests__/smoke.test.ts',
  'git-hooks/commitlint.config.cjs.ejs': 'commitlint.config.cjs',
  'git-hooks/lint-staged.config.mjs.ejs': 'lint-staged.config.mjs',
  'git-hooks/husky/pre-commit.ejs': '.husky/pre-commit',
  'git-hooks/husky/commit-msg.ejs': '.husky/commit-msg',
  'src/app.react.ts.ejs': 'src/app.ts',
  'src/app.vue.entry.ts.ejs': 'src/app.ts',
  'eslint.taro.react.config.js.ejs': 'eslint.config.js',
  'eslint.taro.vue.config.js.ejs': 'eslint.config.js',
  'eslint.uni-app.config.js.ejs': 'eslint.config.js',
  'eslint.react-native.config.js.ejs': 'eslint.config.js',
}

export { resolveAppTargetDir, shouldUseMonorepoLayout } from './monorepo-layout.js'
export { getTemplatesDir } from './templates-dir.js'

function resolveUiLibrary(answers: ProjectAnswers): string | undefined {
  if (answers.uiLibrary) return answers.uiLibrary
  if (
    answers.projectType === 'mobile' &&
    answers.mobilePlatform === 'h5' &&
    answers.framework === 'vue'
  ) {
    return 'vant'
  }
  if (answers.mobilePlatform === 'uni-app') {
    return '@dcloudio/uni-ui'
  }
  return answers.uiLibrary
}

export function resolveMicroFrontendTemplateName(
  tool: NonNullable<ProjectAnswers['microFrontendTool']>,
  answers: Pick<
    ProjectAnswers,
    'framework' | 'microFrontendStackMode' | 'remoteFramework'
  > = {},
): string {
  const framework = answers.framework ?? 'react'

  if (tool === 'module-federation') {
    if (answers.microFrontendStackMode === 'mixed') {
      const remote = answers.remoteFramework ?? (framework === 'react' ? 'vue' : 'react')
      if (framework === 'react' && remote === 'vue') {
        return 'micro-module-federation-mixed-react-vue'
      }
      if (framework === 'vue' && remote === 'react') {
        return 'micro-module-federation-mixed-vue-react'
      }
    }
    const stack = framework === 'vue' ? 'vue' : 'react'
    return `micro-module-federation-${stack}`
  }

  const stack = framework === 'vue' ? 'vue' : 'react'
  switch (tool) {
    case 'wujie':
      return `micro-wujie-${stack}`
    case 'micro-app':
      return `micro-micro-app-${stack}`
    case 'qiankun':
      return `micro-qiankun-${stack}`
    default:
      return `micro-module-federation-${stack}`
  }
}

export function resolveTemplateName(answers: ProjectAnswers): string {
  const { projectType, framework, mobilePlatform, microFrontendTool } = answers

  if (projectType === 'desktop') {
    return framework === 'vue' ? 'desktop-vue' : 'desktop-react'
  }

  if (projectType === 'mobile') {
    switch (mobilePlatform) {
      case 'h5':
        return framework === 'vue' ? 'mobile-h5-vue' : 'mobile-h5-react'
      case 'taro':
        return 'mobile-taro'
      case 'uni-app':
        return 'mobile-uni-app'
      case 'react-native':
        return 'mobile-rn'
      case 'flutter':
        return 'mobile-flutter'
      default:
        return framework === 'vue' ? 'mobile-h5-vue' : 'mobile-h5-react'
    }
  }

  if (projectType === 'micro-frontend' && microFrontendTool) {
    return resolveMicroFrontendTemplateName(microFrontendTool, answers)
  }

  return 'desktop-vue'
}

function shouldRenderFile(filename: string): boolean {
  return EJS_EXTENSIONS.some((ext) => filename.endsWith(ext))
}

function getOutputFilename(filename: string, answers: ProjectAnswers): string {
  let output: string
  if (ENGINEERING_OUTPUT_MAP[filename]) {
    output = ENGINEERING_OUTPUT_MAP[filename]
  } else {
    output = filename
    for (const ext of EJS_EXTENSIONS) {
      if (filename.endsWith(ext)) {
        output = filename.slice(0, -ext.length)
        break
      }
    }
  }

  return applyJavaScriptExtension(output, resolveUseTypeScript(answers))
}

function shouldSkipFile(relativePath: string, answers: ProjectAnswers): boolean {
  const filters = getFileFilters(answers)
  for (const filter of filters) {
    if (filter.match(relativePath)) {
      return filter.skip
    }
  }
  return false
}

function matchesEslintProfile(relativePath: string, profile: EngineeringProfile): boolean {
  switch (profile) {
    case 'react':
      return relativePath.includes('eslint.react.config')
    case 'vue':
      return relativePath.includes('eslint.vue.config')
    case 'taro-react':
      return relativePath.includes('eslint.taro.react.config')
    case 'taro-vue':
      return relativePath.includes('eslint.taro.vue.config')
    case 'uni-app':
      return relativePath.includes('eslint.uni-app.config')
    case 'react-native':
      return relativePath.includes('eslint.react-native.config')
  }
}

function shouldSkipEngineeringFile(
  relativePath: string,
  answers: ProjectAnswers,
  engineering: EngineeringOptions,
): boolean {
  const profile = resolveEngineeringProfile(answers)

  if (relativePath.includes('eslint.') && engineering.eslint) {
    if (!profile || !matchesEslintProfile(relativePath, profile)) return true
  } else if (relativePath.includes('eslint.') && !engineering.eslint) {
    return true
  }

  if (relativePath.includes('vitest.config.') || relativePath.includes('setup.') || relativePath.includes('smoke.test.')) {
    if (!engineering.vitest) return true
    if (!profile) return true
    const wantReact = profileUsesReact(profile)
    const wantVue = profileUsesVue(profile)
    if (relativePath.includes('.react.') && !wantReact) return true
    if (relativePath.includes('.vue.') && !wantVue) return true
  }

  if (relativePath.includes('stylelint.')) {
    if (!engineering.stylelint) return true
    if (!profile) return true
    if (profileUsesVue(profile) && !relativePath.includes('stylelint.vue')) return true
    if (!profileUsesVue(profile) && !relativePath.includes('stylelint.react')) return true
  }

  if (
    (relativePath.includes('prettier.config') || relativePath.includes('.prettierignore')) &&
    !engineering.prettier
  ) {
    return true
  }
  if (relativePath.includes('.markdownlint') && !engineering.markdownlint) {
    return true
  }
  if (relativePath.includes('cspell.json') && !engineering.spellcheck) {
    return true
  }
  if (relativePath.includes('git-hooks/')) {
    return true
  }
  if (relativePath.includes('git-hooks/commitlint') && !engineering.commitlint) {
    return true
  }
  if (relativePath.includes('lint-staged.config') && !engineering.lintStaged) {
    return true
  }
  if (relativePath.includes('husky/pre-commit') && (!engineering.husky || !engineering.lintStaged)) {
    return true
  }
  if (relativePath.includes('husky/commit-msg') && (!engineering.husky || !engineering.commitlint)) {
    return true
  }

  return false
}

interface FileFilter {
  match: (path: string) => boolean
  skip: boolean
}

function getFileFilters(answers: ProjectAnswers): FileFilter[] {
  const filters: FileFilter[] = []

  if (answers.cssFramework !== 'tailwindcss') {
    filters.push({
      match: (p) => p.includes('tailwind') || p.includes('postcss.config'),
      skip: true,
    })
  }

  if (answers.cssFramework !== 'unocss') {
    filters.push({
      match: (p) => p.includes('uno.config'),
      skip: true,
    })
  }

  if (answers.uiLibrary !== 'shadcn-ui') {
    filters.push({
      match: (p) =>
        p.includes('components/ui/') ||
        p.includes('lib/utils.ts') ||
        p.includes('lib/utils.js') ||
        p.includes('components.json'),
      skip: true,
    })
  }

  if (!resolveUseTypeScript(answers) && answers.uiLibrary !== 'shadcn-ui') {
    filters.push({
      match: (p) => isTypeScriptConfigPath(p),
      skip: true,
    })
  }

  if (answers.mobilePlatform === 'flutter') {
    filters.push({
      match: (p) => p.endsWith('.tsx') || p.endsWith('.vue') || p.includes('vite.config'),
      skip: true,
    })
  }

  if (answers.mobilePlatform === 'taro') {
    if (answers.framework !== 'react') {
      filters.push({
        match: (p) =>
          p.includes('app.react.ts') ||
          p.includes('pages/index/index.tsx'),
        skip: true,
      })
    }
    if (answers.framework !== 'vue') {
      filters.push({
        match: (p) =>
          p.includes('app.vue.entry.ts') ||
          p.includes('app.vue.ejs') ||
          p.includes('pages/index/index.vue'),
        skip: true,
      })
    }
  }

  return filters
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

export interface RenderContext extends ProjectAnswers {
  projectName: string
  year: number
  engineering: EngineeringOptions
  useTypeScript: boolean
  readmeCommandsSection: string
  readmeStructureSection: string
  sharedPackageName: string
  /** Monorepo 主应用相对路径（apps/web | apps/host | .），供 lint-staged 等引用 */
  engineeringAppPath: string
}

async function renderFile(
  sourcePath: string,
  targetPath: string,
  context: RenderContext,
): Promise<void> {
  const content = await readFile(sourcePath, 'utf-8')
  // 模板输出为 JSON/JS 等文本，禁用 HTML 转义（避免 && 变成 &amp;&amp;）
  const rendered = ejs.render(content, context, {
    async: false,
    escape: (value) => String(value),
  })
  await mkdir(dirname(targetPath), { recursive: true })
  await writeFile(targetPath, rendered, 'utf-8')
}

async function copyFile(sourcePath: string, targetPath: string): Promise<void> {
  await mkdir(dirname(targetPath), { recursive: true })
  await cp(sourcePath, targetPath)
}

async function renderTemplateDir(
  templateDir: string,
  targetDir: string,
  context: RenderContext,
  answers: ProjectAnswers,
  options?: {
    engineeringMode?: boolean
    engineering?: EngineeringOptions
    fileScope?: EngineeringFileScope
  },
): Promise<void> {
  const files = await collectFiles(templateDir)
  const engineering = options?.engineering
  const fileScope = options?.fileScope ?? 'all'

  for (const file of files) {
    if (shouldSkipFile(file, answers)) continue
    if (
      options?.engineeringMode &&
      engineering &&
      shouldSkipEngineeringFile(file, answers, engineering)
    ) {
      continue
    }
    if (options?.engineeringMode && !matchesEngineeringFileScope(file, fileScope)) {
      continue
    }

    const sourcePath = join(templateDir, file)
    const outputName = getOutputFilename(file, answers)
    const targetPath = join(targetDir, outputName)

    if (shouldRenderFile(file)) {
      await renderFile(sourcePath, targetPath, context)
    } else {
      await copyFile(sourcePath, targetPath)
    }
  }
}

function supportsEngineeringBase(answers: ProjectAnswers): boolean {
  return supportsJsEngineering(answers)
}

export async function generateProject(options: {
  templateName: string
  targetDir: string
  projectName: string
  answers: ProjectAnswers
  templatesDir?: string
  templateSource?: string
  remoteTemplates?: Record<string, string>
  templateCacheDir?: string
}): Promise<EngineeringOptions> {
  const {
    templateName,
    targetDir,
    projectName,
    answers,
    templatesDir,
    templateSource,
    remoteTemplates,
    templateCacheDir,
  } = options

  const { templateDir, localTemplatesDir } = await resolveTemplateDirectory({
    templatesDir,
    templateName,
    templateSource,
    remoteTemplates,
    templateCacheDir,
  })
  const engineering = resolveEngineeringOptions(answers)
  const profile = resolveEngineeringProfile(answers)

  try {
    await stat(templateDir)
  } catch {
    error(`模板 "${templateName}" 不存在`)
    throw new Error(`Template not found: ${templateName}`)
  }

  await hooks.callHook('template:before', {
    templateName,
    targetDir,
    answers,
  })

  step(`使用模板: ${templateName}`)

  const readmeCtx = buildReadmeCommandContext({
    answers,
    engineering,
    templateName,
  })

  const context: RenderContext = {
    ...answers,
    uiLibrary: resolveUiLibrary(answers),
    useTypeScript: resolveUseTypeScript(answers),
    engineering,
    projectName,
    year: new Date().getFullYear(),
    readmeCommandsSection: buildReadmeCommandsSection(readmeCtx),
    readmeStructureSection: buildReadmeStructureSection(projectName, readmeCtx),
    sharedPackageName: `@${projectName}/shared`,
    engineeringAppPath: resolveEngineeringAppRelativePath(answers, templateName),
    ...(answers.mobilePlatform === 'flutter'
      ? {
          flutterStateManagement: answers.flutterStateManagement ?? 'Provider',
          flutterMaterial3: answers.flutterMaterial3 ?? true,
          flutterInternationalization: answers.flutterInternationalization ?? false,
          flutterTargetPlatforms: answers.flutterTargetPlatforms ?? ['iOS', 'Android'],
        }
      : {}),
  }

  const appTargetDir = resolveAppTargetDir(targetDir, answers, templateName)

  await renderTemplateDir(templateDir, appTargetDir, context, answers)

  if (shouldUseMonorepoLayout(answers, templateName)) {
    await finalizeMonorepoLayout({
      rootDir: targetDir,
      localTemplatesDir,
      context,
      answers,
    })
  }

  if (hasAnyEngineering(engineering) && supportsEngineeringBase(answers) && profile) {
    const engineeringDir = join(localTemplatesDir, 'engineering-base')
    try {
      await stat(engineeringDir)
      const isWorkspaceMonorepo = isWorkspaceEngineeringMonorepo(answers, templateName)
      const engineeringAppDir = resolveEngineeringAppDir(targetDir, answers, templateName)
      const useTs = resolveUseTypeScript(answers)

      step('合并工程化配置 (ESLint / Prettier / Stylelint / ...)...')

      if (isWorkspaceMonorepo) {
        // 根：共享规范；主应用：框架相关配置（desktop→apps/web，MF→apps/host）
        await renderTemplateDir(engineeringDir, targetDir, context, answers, {
          engineeringMode: true,
          engineering,
          fileScope: 'shared',
        })
        await renderTemplateDir(engineeringDir, engineeringAppDir, context, answers, {
          engineeringMode: true,
          engineering,
          fileScope: 'app',
        })

        await mergePackageManifest(
          targetDir,
          getEngineeringManifest({
            profile,
            engineering,
            useTypeScript: useTs,
            includeGitHooks: false,
            scope: 'shared',
          }),
        )

        await mergeEngineeringToWorkspacePackages({
          rootDir: targetDir,
          answers,
          engineering,
        })

        if (engineering.husky || engineering.commitlint || engineering.lintStaged) {
          step('配置 Git 提交规范 (commitlint + husky + lint-staged)...')
          await renderGitHooksFiles({
            gitRootDir: targetDir,
            context,
            engineering,
            templatesDir,
          })
          await mergePackageManifest(
            targetDir,
            getEngineeringManifest({
              profile,
              engineering,
              useTypeScript: useTs,
              includeGitHooks: true,
              scope: 'hooks',
            }),
          )
        }
      } else {
        await renderTemplateDir(engineeringDir, appTargetDir, context, answers, {
          engineeringMode: true,
          engineering,
          fileScope: 'all',
        })

        await mergePackageManifest(
          appTargetDir,
          getEngineeringManifest({
            profile,
            engineering,
            useTypeScript: useTs,
            includeGitHooks: true,
            scope: 'all',
          }),
        )

        await mergeEngineeringToWorkspacePackages({
          rootDir: targetDir,
          answers,
          engineering,
        })

        await renderGitHooksFiles({
          gitRootDir: appTargetDir,
          context,
          engineering,
          templatesDir,
        })
      }
    } catch (err) {
      warn(`engineering-base 合并失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  await hooks.callHook('template:after', {
    templateName,
    targetDir,
    answers,
  })

  step('生成 Git 配置文件 (.gitignore)...')
  await renderGitBaseFiles({
    gitRootDir: targetDir,
    context,
    templatesDir,
  })

  success(`项目文件已生成到 ${appTargetDir}`)
  return engineering
}

export async function listTemplates(templatesDir?: string): Promise<string[]> {
  const dir = getTemplatesDir(templatesDir)
  const entries = await readdir(dir, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}
