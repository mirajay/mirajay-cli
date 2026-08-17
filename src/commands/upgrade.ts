import { defineCommand } from 'citty'
import { execa } from 'execa'
import { banner, step, success, info } from '../core/logger.js'

export default defineCommand({
  meta: {
    name: 'upgrade',
    description: '升级脚手架到最新版本',
  },
  async run() {
    banner()
    step('检查 mirajay-cli 最新版本...')

    try {
      const { stdout } = await execa('npm', ['view', 'mirajay-cli', 'version'], {
        stdio: 'pipe',
      })
      const latest = stdout.trim()
      info(`最新版本: ${latest}`)
      info('运行以下命令升级:')
      info('  pnpm add -g mirajay-cli@latest')
      info('  npm install -g mirajay-cli@latest')
      success('版本检查完成')
    } catch {
      info('mirajay-cli 尚未发布到 npm，请通过 git pull 获取最新代码')
    }
  },
})
