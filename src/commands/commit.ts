import { defineCommand } from 'citty'
import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { banner, step, info, warn } from '../core/logger.js'
import { runCommand } from '../core/utils.js'

async function hasCommitTool(cwd: string): Promise<'cz' | 'commitlint' | null> {
  try {
    const pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf-8'))
    if (pkg.scripts?.commit) return 'cz'
  } catch {
    // ignore
  }

  for (const file of ['commitlint.config.cjs', 'commitlint.config.js', '.commitlintrc.json']) {
    try {
      await access(join(cwd, file))
      return 'commitlint'
    } catch {
      // continue
    }
  }

  return null
}

export default defineCommand({
  meta: {
    name: 'commit',
    description: '规范化 Git 提交 (cz-git + commitlint)',
  },
  async run() {
    banner()
    const cwd = process.cwd()
    const tool = await hasCommitTool(cwd)

    if (!tool) {
      warn('当前项目未启用 commitlint / cz-git')
      info('请在 init 时选择 Strict 预设，或在自定义模式中启用 commitlint')
      return
    }

    step('启动交互式提交...')
    info('使用 Conventional Commits 规范')

    if (tool === 'cz') {
      await runCommand('npx', ['cz'], cwd)
    } else {
      warn('检测到 commitlint 但未配置 cz-git，请使用 git commit 并遵循 Conventional Commits')
    }
  },
})
