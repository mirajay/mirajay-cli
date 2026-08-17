import pc from 'picocolors'
import type { ProjectAnswers } from '../types.js'
import { getPackageManagerCommand } from './utils.js'
import { info, warn } from './logger.js'
import { getDevRunHint, usesViteAutoOpen } from './dev-hints.js'

export function printNextSteps(options: {
  projectDir: string
  packageManager: ProjectAnswers['packageManager']
  templateName: string
  engineering: {
    vitest?: boolean
    eslint?: boolean
    prettier?: boolean
    stylelint?: boolean
    commitlint?: boolean
  }
}): void {
  const { projectDir, packageManager, templateName, engineering } = options
  const hint = getDevRunHint(templateName)
  const isFlutter = templateName === 'mobile-flutter'

  if (isFlutter) {
    console.log()
    info('下一步:')
    console.log(`  ${pc.cyan('cd')} ${projectDir}`)
    console.log(`  ${pc.cyan('flutter pub get')}  ${pc.dim('# 拉取 Dart 依赖（若创建时未执行）')}`)
    console.log(`  ${pc.cyan('flutter run')}  ${pc.dim(`# ${hint.note}`)}`)
    console.log()
    info('说明:')
    console.log(
      `  ${pc.dim('•')} ${pc.dim('Flutter 项目使用 flutter / dart 命令，不依赖 pnpm dev')}`,
    )
    console.log(
      `  ${pc.dim('•')} ${pc.dim('静态检查:')} ${pc.cyan('flutter analyze')}  ${pc.dim('测试:')} ${pc.cyan('flutter test')}`,
    )
    return
  }

  console.log()
  info('下一步（在浏览器中预览）:')
  console.log(`  ${pc.cyan('cd')} ${projectDir}`)

  {
    const devCmd = getPackageManagerCommand(packageManager, hint.script)
    console.log(`  ${pc.cyan(devCmd)}  ${pc.dim(`# ${hint.note || '启动开发服务器'}`)}`)
    if (hint.url) {
      console.log(
        `  ${pc.dim('→ 终端出现')} ${pc.bold('Local:')} ${pc.bold(pc.underline(hint.url))} ${pc.dim('后再在浏览器打开')}`,
      )
      if (usesViteAutoOpen(templateName)) {
        console.log(`  ${pc.dim('  （Vite 会自动尝试打开浏览器）')}`)
      }
    }
  }

  console.log()
  warn('重要: pnpm dev 必须保持终端窗口运行，关闭终端后浏览器将无法访问')
  console.log()
  info('说明:')
  console.log(
    `  ${pc.dim('•')} ${pc.dim('build / lint / test 不会启动网页；只有 dev 会启动本地服务器')}`,
  )
  if (hint.previewScript) {
    const previewCmd = getPackageManagerCommand(packageManager, hint.previewScript)
    const urlSuffix = hint.previewUrl ? ` → ${hint.previewUrl}` : ''
    console.log(
      `  ${pc.dim('•')} ${pc.dim('若已执行 build，用 preview 预览打包结果:')} ${pc.cyan(previewCmd)}${pc.dim(urlSuffix)}`,
    )
  }

  if (
    engineering.vitest ||
    engineering.eslint ||
    engineering.prettier ||
    engineering.stylelint ||
    engineering.commitlint
  ) {
    console.log()
    info('可选命令:')
    if (engineering.vitest) {
      console.log(`  ${pc.cyan(getPackageManagerCommand(packageManager, 'test'))}`)
    }
    if (engineering.eslint || engineering.prettier || engineering.stylelint) {
      console.log(`  ${pc.cyan(getPackageManagerCommand(packageManager, 'lint'))}`)
    }
    if (engineering.commitlint) {
      console.log(`  ${pc.cyan(getPackageManagerCommand(packageManager, 'commit'))}`)
    }
  }
}
