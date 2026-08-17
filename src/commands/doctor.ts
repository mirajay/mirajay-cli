import { defineCommand } from 'citty'
import { execa } from 'execa'
import pc from 'picocolors'
import { banner, step, success, warn, error, info } from '../core/logger.js'
import { resolveFlutterSdk } from '../core/flutter-sdk.js'
import semver from 'semver'

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
}

export default defineCommand({
  meta: {
    name: 'doctor',
    description: '环境诊断 - 检查 Node.js、包管理器、Flutter 等',
  },
  async run() {
    banner()
    step('开始环境诊断...')
    console.log()

    const results: CheckResult[] = []

    results.push(await checkNode())
    results.push(await checkPackageManager('pnpm'))
    results.push(await checkPackageManager('yarn'))
    results.push(await checkGit())
    results.push(await checkFlutter())

    for (const result of results) {
      const icon =
        result.status === 'pass'
          ? pc.green('✔')
          : result.status === 'warn'
            ? pc.yellow('⚠')
            : pc.red('✖')

      console.log(`  ${icon} ${result.name}: ${result.message}`)
      if (result.fix) {
        console.log(`    ${pc.dim(result.fix)}`)
      }
    }

    console.log()
    const failed = results.filter((r) => r.status === 'fail')
    const warned = results.filter((r) => r.status === 'warn')

    if (failed.length === 0 && warned.length === 0) {
      success('所有检查通过，环境就绪！')
    } else if (failed.length === 0) {
      info(`${warned.length} 项警告，环境基本可用`)
    } else {
      error(`${failed.length} 项检查未通过，请修复后重试`)
      process.exit(1)
    }
  },
})

async function checkNode(): Promise<CheckResult> {
  const version = process.version.slice(1)
  const minVersion = '24.18.0'

  if (semver.gte(version, minVersion)) {
    return { name: 'Node.js', status: 'pass', message: `v${version}` }
  }
  return {
    name: 'Node.js',
    status: 'fail',
    message: `v${version} (需要 >= ${minVersion})`,
    fix: '请升级 Node.js: https://nodejs.org/',
  }
}

async function checkPackageManager(name: string): Promise<CheckResult> {
  try {
    const { stdout } = await execa(name, ['--version'], { stdio: 'pipe' })
    return { name, status: 'pass', message: `v${stdout.trim()}` }
  } catch {
    return {
      name,
      status: 'warn',
      message: '未安装',
      fix: `npm install -g ${name}`,
    }
  }
}

async function checkGit(): Promise<CheckResult> {
  try {
    const { stdout } = await execa('git', ['--version'], { stdio: 'pipe' })
    return { name: 'Git', status: 'pass', message: stdout.trim() }
  } catch {
    return {
      name: 'Git',
      status: 'warn',
      message: '未安装',
      fix: '请安装 Git: https://git-scm.com/',
    }
  }
}

async function checkFlutter(): Promise<CheckResult> {
  const sdk = await resolveFlutterSdk()
  if (!sdk) {
    return {
      name: 'Flutter SDK',
      status: 'warn',
      message: '未安装（创建 Flutter 项目后需手动 flutter pub get / flutter run）',
      fix: 'https://flutter.dev/docs/get-started/install',
    }
  }

  try {
    const { stdout } = await execa(sdk.command, [...sdk.prefix, '--version'], {
      stdio: 'pipe',
    })
    const versionLine = stdout.split('\n')[0]
    const via =
      sdk.command === 'flutter'
        ? ''
        : sdk.command === 'fvm'
          ? ' (via fvm)'
          : ` (${sdk.command})`
    return {
      name: 'Flutter SDK',
      status: 'pass',
      message: `${versionLine || '已安装'}${via}`,
    }
  } catch {
    return {
      name: 'Flutter SDK',
      status: 'pass',
      message: '已安装',
    }
  }
}
