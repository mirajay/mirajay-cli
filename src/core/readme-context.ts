import type { EngineeringOptions, ProjectAnswers } from '../types.js'
import { getDevRunHint } from './dev-hints.js'
import { shouldUseMonorepoLayout } from './monorepo-layout.js'

export interface ReadmeCommandContext {
  packageManager: string
  installCommand: string
  devCommand: string
  buildCommand: string
  previewCommand: string
  lintCommand: string
  testCommand: string
  commitCommand: string
  devUrl: string
  previewUrl: string
  appRelativePath: string
  isMonorepo: boolean
  hasLint: boolean
  hasTest: boolean
  hasCommit: boolean
}

function pmRun(pm: string, script: string): string {
  switch (pm) {
    case 'yarn':
      return `yarn ${script}`
    case 'bun':
      return `bun run ${script}`
    case 'npm':
      return `npm run ${script}`
    default:
      return `pnpm ${script}`
  }
}

function pmInstall(pm: string): string {
  switch (pm) {
    case 'yarn':
      return 'yarn install'
    case 'bun':
      return 'bun install'
    case 'npm':
      return 'npm install'
    default:
      return 'pnpm install'
  }
}

export function buildReadmeCommandContext(options: {
  answers: ProjectAnswers
  engineering: EngineeringOptions
  templateName: string
}): ReadmeCommandContext {
  const { answers, engineering, templateName } = options
  const pm = answers.packageManager || 'pnpm'
  const hint = getDevRunHint(templateName)
  const isMonorepo = shouldUseMonorepoLayout(answers, templateName)

  return {
    packageManager: pm,
    installCommand: pmInstall(pm),
    devCommand: isMonorepo ? pmRun(pm, 'dev') : pmRun(pm, hint.script),
    buildCommand: pmRun(pm, 'build'),
    previewCommand: pmRun(pm, hint.previewScript || 'preview'),
    lintCommand: pmRun(pm, 'lint'),
    testCommand: pmRun(pm, 'test'),
    commitCommand: pmRun(pm, 'commit'),
    devUrl: hint.url || 'http://localhost:5173',
    previewUrl: hint.previewUrl || 'http://localhost:4173',
    appRelativePath: isMonorepo ? 'apps/web' : '.',
    isMonorepo,
    hasLint: Boolean(
      engineering.eslint || engineering.prettier || engineering.stylelint || engineering.markdownlint,
    ),
    hasTest: Boolean(engineering.vitest),
    hasCommit: Boolean(engineering.commitlint),
  }
}

export function buildReadmeCommandsSection(ctx: ReadmeCommandContext): string {
  const lines: string[] = ['## 快速开始', '', '### 安装依赖', '', '```bash', ctx.installCommand, '```', '']

  if (ctx.isMonorepo) {
    lines.push(
      '> Monorepo 项目：应用在 `apps/web`，共享代码在 `packages/shared`，根目录通过 Turborepo 统一调度。',
      '',
    )
  }

  lines.push(
    '### 开发（浏览器预览）',
    '',
    '```bash',
    ctx.devCommand,
    '```',
    '',
    `在浏览器打开 [${ctx.devUrl}](${ctx.devUrl})（需保持终端运行，关闭终端后页面无法访问）。`,
    '',
    '### 构建与预览',
    '',
    '```bash',
    ctx.buildCommand,
    ctx.previewCommand,
    '```',
    '',
    `构建完成后运行 \`${ctx.previewCommand}\` 可在 [${ctx.previewUrl}](${ctx.previewUrl}) 预览。`,
    '',
    '> `build` 只打包静态文件，不会启动页面；要在浏览器里看效果请用上面的 `dev` 命令。',
    '',
  )

  if (ctx.hasLint || ctx.hasTest || ctx.hasCommit) {
    lines.push('### 工程化命令', '', '```bash')
    if (ctx.hasLint) lines.push(ctx.lintCommand)
    if (ctx.hasTest) lines.push(ctx.testCommand)
    if (ctx.hasCommit) lines.push(ctx.commitCommand)
    lines.push('```')
  }

  return lines.join('\n')
}

export function buildReadmeStructureSection(
  projectName: string,
  ctx: ReadmeCommandContext,
  extraLines: string[] = [],
): string {
  if (!ctx.isMonorepo) {
    return [
      '## 目录结构',
      '',
      '```text',
      `${projectName}/`,
      '├── src/             # 源码',
      '├── index.html',
      '├── package.json',
      '└── vite.config.ts',
      '```',
      ...extraLines,
    ].join('\n')
  }

  return [
    '## 目录结构',
    '',
    '```text',
    `${projectName}/`,
    '├── apps/',
    '│   └── web/              # 主应用（Vite）',
    '├── packages/',
    '│   └── shared/           # 共享工具 / 类型 / 组件',
    '├── turbo.json            # Turborepo 任务编排',
    '├── pnpm-workspace.yaml   # pnpm 工作区',
    '└── package.json          # 根脚本（dev/build/lint/test）',
    '```',
    '',
    '在 `packages/shared` 中编写跨应用共享模块，在 `apps/web` 中引用：',
    '',
    '```ts',
    `import { formatDate } from '@${projectName}/shared'`,
    '```',
    ...extraLines,
  ].join('\n')
}
