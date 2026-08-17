import { defineCommand } from 'citty'
import { banner, step, info, warn } from '../core/logger.js'

export default defineCommand({
  meta: {
    name: 'deploy',
    description: 'CI/CD 部署集成',
  },
  args: {
    env: {
      type: 'string',
      description: '部署环境 (staging | production)',
      default: 'staging',
    },
  },
  async run({ args }) {
    banner()
    step(`部署到 ${args.env} 环境...`)
    warn('deploy 命令需要在项目中配置 CI/CD 流水线')
    info('模板已内置 .github/workflows/ 示例，请根据实际需求修改')
    info('支持 GitHub Actions / GitLab CI')
  },
})
