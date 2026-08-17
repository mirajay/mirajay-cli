import { defineCommand } from 'citty'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { banner, step, success, warn, info } from '../core/logger.js'
import { detectProjectType, runCommand } from '../core/utils.js'
import { hooks } from '../core/hooks.js'

interface LinterAvailability {
  eslint: boolean
  prettier: boolean
  stylelint: boolean
  markdownlint: boolean
  spellcheck: boolean
}

async function detectAvailableLinters(cwd: string): Promise<LinterAvailability> {
  const checks: Array<[keyof LinterAvailability, string[]]> = [
    ['eslint', ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.ts']],
    ['prettier', ['prettier.config.mjs', 'prettier.config.js', '.prettierrc', '.prettierrc.json']],
    ['stylelint', ['stylelint.config.mjs', 'stylelint.config.js', '.stylelintrc.json']],
    ['markdownlint', ['.markdownlint.json', '.markdownlintrc']],
    ['spellcheck', ['cspell.json']],
  ]

  const result: LinterAvailability = {
    eslint: false,
    prettier: false,
    stylelint: false,
    markdownlint: false,
    spellcheck: false,
  }

  for (const [key, files] of checks) {
    for (const file of files) {
      try {
        await access(join(cwd, file))
        result[key] = true
        break
      } catch {
        // try next file
      }
    }
  }

  return result
}

export default defineCommand({
  meta: {
    name: 'lint',
    description: '运行 ESLint + Prettier + Stylelint + markdownlint + cspell',
  },
  args: {
    fix: {
      type: 'boolean',
      description: '自动修复可修复的问题',
      alias: 'f',
      default: false,
    },
  },
  async run({ args }) {
    banner()
    await hooks.callHook('lint:before')

    const cwd = process.cwd()
    const projectType = await detectProjectType(cwd)
    const fixFlag = args.fix ? ['--fix'] : []

    step(`检测项目类型: ${projectType || 'unknown'}`)

    if (projectType === 'flutter') {
      step('运行 flutter analyze...')
      await runCommand('flutter', ['analyze'], cwd)
      await hooks.callHook('lint:after')
      success('Lint 检查完成')
      return
    }

    const available = await detectAvailableLinters(cwd)
    const hasAny =
      available.eslint ||
      available.prettier ||
      available.stylelint ||
      available.markdownlint ||
      available.spellcheck

    if (!hasAny) {
      warn('未检测到工程化配置文件，跳过 lint')
      info('请在 init 时选择 Standard 或 Strict 工程化预设')
      return
    }

    if (available.eslint) {
      step('运行 ESLint...')
      const eslintOk = await runCommand('npx', ['eslint', '.', ...fixFlag], cwd)
      if (!eslintOk) warn('ESLint 检查发现问题')
    } else {
      info('跳过 ESLint（未配置）')
    }

    if (available.prettier) {
      step('运行 Prettier 检查...')
      await runCommand(
        'npx',
        ['prettier', '--check', '.', ...(args.fix ? ['--write'] : [])],
        cwd,
      )
    } else {
      info('跳过 Prettier（未配置）')
    }

    if (available.stylelint) {
      step('运行 Stylelint...')
      await runCommand('npx', ['stylelint', '**/*.{css,scss,vue}', ...fixFlag], cwd)
    } else {
      info('跳过 Stylelint（未配置）')
    }

    if (available.markdownlint) {
      step('运行 markdownlint...')
      await runCommand('npx', ['markdownlint', '**/*.md', ...fixFlag], cwd)
    } else {
      info('跳过 markdownlint（未配置）')
    }

    if (available.spellcheck) {
      step('运行 cspell 拼写校验...')
      await runCommand('npx', ['cspell', '**/*.{ts,tsx,vue,md,json}'], cwd)
    } else {
      info('跳过 cspell（未配置）')
    }

    await hooks.callHook('lint:after')
    success('Lint 检查完成')
  },
})
