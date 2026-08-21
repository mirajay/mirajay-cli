import { defineCommand } from 'citty'
import { banner, step } from '../core/logger.js'
import { runCommand } from '../core/utils.js'

export default defineCommand({
  meta: {
    name: 'test',
    description: '运行项目测试 (vitest)',
  },
  args: {
    watch: {
      type: 'boolean',
      description: '监听模式',
      alias: 'w',
      default: false,
    },
    coverage: {
      type: 'boolean',
      description: '生成覆盖率报告',
      alias: 'c',
      default: false,
    },
  },
  async run({ args }) {
    banner()
    step('运行测试...')

    const testArgs = ['vitest']
    if (!args.watch) testArgs.push('run')
    if (args.coverage) testArgs.push('--coverage')

    await runCommand('npx', testArgs, process.cwd())
  },
})
