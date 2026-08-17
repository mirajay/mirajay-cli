import { defineCommand } from 'citty'
import { resolve, join, relative } from 'node:path'
import pc from 'picocolors'
import { banner, success, error, info, warn } from '../core/logger.js'
import { runInitPrompts } from '../core/prompts.js'
import { generateProject, resolveTemplateName, resolveAppTargetDir } from '../core/template.js'
import {
  installDependencies,
  initGitRepo,
  setupGitHooks,
  applyGitHooksForInitGit,
  checkDirectoryExists,
  formatProjectDir,
} from '../core/utils.js'
import {
  resolveFlutterSdk,
  installFlutterDependencies,
  type FlutterSdkInfo,
} from '../core/flutter-sdk.js'
import { hooks } from '../core/hooks.js'
import {
  ALLOWED_UI_LIBRARIES,
  ALLOWED_FRAMEWORKS,
  ALLOWED_CSS_FRAMEWORKS,
  ALLOWED_ENGINEERING_PRESETS,
} from '../types.js'
import { loadCliConfig } from '../core/config.js'
import {
  createEngineeringFromPreset,
  formatEngineeringSummary,
} from '../core/engineering.js'
import { installShadcnComponents } from '../core/shadcn.js'
import { validateRemoteTemplateSource } from '../core/remote-templates.js'
import { printNextSteps } from '../core/next-steps.js'
import { resolveUseTypeScript } from '../core/typescript-mode.js'

function printShadcnHints(
  answers: { uiLibrary?: string },
  packageManager: string | undefined,
) {
  if (answers.uiLibrary !== 'shadcn-ui') return

  console.log()
  info('shadcn/ui 提示:')
  const addCmd =
    packageManager === 'npm'
      ? 'npm run ui:add -- button'
      : `${packageManager || 'pnpm'} ui:add button`
  console.log(`  ${pc.cyan(addCmd)}  ${pc.dim('# 添加更多组件')}`)
  console.log(`  ${pc.dim('已自动尝试安装 input / label / separator')}`)
  console.log(`  ${pc.dim('文档: https://ui.shadcn.com/docs/components')}`)
}

export default defineCommand({
  meta: {
    name: 'init',
    description: '初始化新项目（支持桌面/移动/微前端）',
  },
  args: {
    name: {
      type: 'positional',
      description: '项目名称',
      required: false,
    },
    dir: {
      type: 'string',
      description: '目标目录',
      alias: 'd',
    },
    yes: {
      type: 'boolean',
      description: '跳过交互式问答（使用默认配置）',
      alias: 'y',
      default: false,
    },
    from: {
      type: 'string',
      description: '远程模板来源 (giget 格式，如 gh:org/repo/templates/desktop-react)',
      alias: 'f',
    },
  },
  async run({ args }) {
    banner()

    const cliConfig = await loadCliConfig()

    let projectName: string
    let answers

    if (args.yes) {
      projectName = (args.name as string) || 'my-app'
      answers = {
        projectType: 'desktop' as const,
        framework: 'vue' as const,
        uiLibrary: 'element-plus',
        cssFramework: 'tailwindcss' as const,
        engineering: createEngineeringFromPreset(
          cliConfig.defaultEngineeringPreset || 'standard',
        ),
        packageManager: cliConfig.defaultPackageManager || 'pnpm',
        initGit: true,
        useMonorepo: true,
        useTypeScript: true,
      }
    } else {
      const result = await runInitPrompts(args.name as string | undefined)
      projectName = result.projectName
      answers = result.answers
    }

    validateAnswers(answers)

    const targetDir = resolve(args.dir || join(process.cwd(), projectName))

    if (await checkDirectoryExists(targetDir)) {
      error(`目录 ${targetDir} 已存在，请选择其他名称或目录`)
      process.exit(1)
    }

    let flutterSdk: FlutterSdkInfo | null = null
    if (answers.mobilePlatform === 'flutter') {
      flutterSdk = await resolveFlutterSdk()
      if (!flutterSdk) {
        warn('未检测到 Flutter SDK，项目脚手架仍会生成')
        warn('安装 Flutter 后进入项目目录执行: flutter pub get && flutter run')
        warn('文档: https://flutter.dev/docs/get-started/install')
      }
    }

    await hooks.callHook('init:before', { projectName, targetDir, answers })
    await hooks.callHook('init:prompts', answers)

    const templateSource = args.from as string | undefined
    if (templateSource) {
      validateRemoteTemplateSource(templateSource)
    }

    const templateName = resolveTemplateName(answers)

    applyGitHooksForInitGit(answers)

    const engineering = await generateProject({
      templateName,
      targetDir,
      projectName,
      answers,
      templatesDir: cliConfig.templatesDir,
      templateSource,
      remoteTemplates: cliConfig.remoteTemplates,
      templateCacheDir: cliConfig.templateCacheDir,
    })

    if (answers.initGit) {
      await initGitRepo(targetDir)
    }

    if (answers.mobilePlatform === 'flutter') {
      if (flutterSdk) {
        await installFlutterDependencies(targetDir, flutterSdk)
      }
    } else {
      await installDependencies(targetDir, answers.packageManager)
    }

    if (engineering.husky) {
      await setupGitHooks(targetDir, answers.packageManager)
    }

    if (answers.uiLibrary === 'shadcn-ui') {
      const appDir = resolveAppTargetDir(targetDir, answers, templateName)
      await installShadcnComponents(appDir)
      if (engineering.prettier) {
        await formatProjectDir(appDir)
      }
    }

    await hooks.callHook('init:after', { projectName, targetDir, answers })

    console.log()
    success(`项目 ${pc.bold(projectName)} 创建成功！`)

    const enabled = formatEngineeringSummary(engineering)
    if (enabled.length > 0) {
      console.log()
      info(`已启用工程化: ${enabled.join(', ')}`)
    }

    console.log()
    info(`开发语言: ${resolveUseTypeScript(answers) ? 'TypeScript' : 'JavaScript'}`)

    console.log()
    printNextSteps({
      projectDir: relative(process.cwd(), targetDir) || projectName,
      packageManager: answers.packageManager,
      templateName,
      engineering,
    })
    printShadcnHints(answers, answers.packageManager)
    console.log()
  },
})

function validateAnswers(answers: {
  framework?: string
  uiLibrary?: string
  cssFramework?: string
  engineering?: { preset?: string }
}) {
  if (answers.framework && !ALLOWED_FRAMEWORKS.has(answers.framework)) {
    throw new Error(`Invalid framework: ${answers.framework}`)
  }
  if (answers.uiLibrary && !ALLOWED_UI_LIBRARIES.has(answers.uiLibrary)) {
    throw new Error(`Invalid UI library: ${answers.uiLibrary}`)
  }
  if (answers.cssFramework && !ALLOWED_CSS_FRAMEWORKS.has(answers.cssFramework)) {
    throw new Error(`Invalid CSS framework: ${answers.cssFramework}`)
  }
  if (
    answers.engineering?.preset &&
    !ALLOWED_ENGINEERING_PRESETS.has(
      answers.engineering.preset as 'minimal' | 'standard' | 'strict' | 'custom',
    )
  ) {
    throw new Error(`Invalid engineering preset: ${answers.engineering.preset}`)
  }
}
