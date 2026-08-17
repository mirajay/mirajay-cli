import { defineCommand, runMain } from 'citty'
import { banner } from './core/logger.js'
import init from './commands/init.js'
import lint from './commands/lint.js'
import build from './commands/build.js'
import doctor from './commands/doctor.js'
import test from './commands/test.js'
import commit from './commands/commit.js'
import deploy from './commands/deploy.js'
import upgrade from './commands/upgrade.js'
import updateDeps from './commands/update-deps.js'

const main = defineCommand({
  meta: {
    name: 'mirajay-cli',
    version: '1.0.0',
    description: '企业级前端脚手架 - 覆盖桌面 Web、移动端与微前端全场景',
  },
  subCommands: {
    init,
    create: init,
    lint,
    build,
    doctor,
    test,
    commit,
    deploy,
    upgrade,
    'update-deps': updateDeps,
  },
  run() {
    banner()
    console.log('使用 mirajay-cli --help 查看可用命令')
  },
})

runMain(main)

export { main }
