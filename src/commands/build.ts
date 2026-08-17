import { defineCommand } from 'citty'
import { banner, step, success } from '../core/logger.js'
import { detectProjectType, runCommand } from '../core/utils.js'
import { hooks } from '../core/hooks.js'

export default defineCommand({
  meta: {
    name: 'build',
    description: '构建项目（自动识别 Vite / Turborepo / Flutter）',
  },
  args: {
    mode: {
      type: 'string',
      description: '构建模式 (development | production)',
      default: 'production',
    },
  },
  async run({ args }) {
    banner()
    await hooks.callHook('build:before')

    const cwd = process.cwd()
    const projectType = await detectProjectType(cwd)

    step(`检测项目类型: ${projectType || 'unknown'}`)

    switch (projectType) {
      case 'flutter':
        await runCommand('flutter', ['build', 'web', '--release'], cwd)
        break
      case 'monorepo':
        await runCommand('npx', ['turbo', 'run', 'build'], cwd)
        break
      default:
        await runCommand('npx', ['vite', 'build', '--mode', args.mode!], cwd)
    }

    await hooks.callHook('build:after')
    success('构建完成')
  },
})
