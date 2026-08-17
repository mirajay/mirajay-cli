import { execa } from 'execa'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { step, success, warn, error } from './logger.js'
import type { ProjectAnswers } from '../types.js'

export async function installDependencies(
  targetDir: string,
  packageManager: ProjectAnswers['packageManager'] = 'pnpm',
): Promise<void> {
  step(`安装依赖 (${packageManager})...`)

  const installCmd = packageManager === 'yarn' ? 'install' : 'install'
  const args = packageManager === 'npm' ? ['install'] : [installCmd]

  try {
    await execa(packageManager!, args, {
      cwd: targetDir,
      stdio: 'inherit',
    })
    success('依赖安装完成')
  } catch {
    warn('依赖安装失败，请手动进入项目目录执行安装命令')
  }
}

export async function setupGitHooks(
  gitRootDir: string,
  packageManager: ProjectAnswers['packageManager'] = 'pnpm',
): Promise<void> {
  try {
    const runner = packageManager === 'npm' ? 'npx' : packageManager!
    const args =
      packageManager === 'npm' ? ['husky'] : ['exec', 'husky']
    await execa(runner, args, { cwd: gitRootDir, stdio: 'pipe' })
  } catch {
    warn('husky 初始化失败，请在项目根目录手动执行 pnpm prepare')
  }
}

export function applyGitHooksForInitGit(answers: ProjectAnswers): void {
  if (!answers.initGit || !answers.engineering) return

  if (answers.engineering.preset === 'minimal') {
    answers.engineering = {
      ...answers.engineering,
      commitlint: true,
      husky: true,
      lintStaged: true,
    }
  }
}

export async function initGitRepo(targetDir: string): Promise<void> {
  step('初始化 Git 仓库...')

  try {
    await execa('git', ['init'], { cwd: targetDir, stdio: 'pipe' })

    // 确保首次提交不会因缺少 user.name / user.email 失败
    await execa('git', ['config', 'user.name', 'mirajay-cli'], {
      cwd: targetDir,
      stdio: 'pipe',
    })
    await execa('git', ['config', 'user.email', 'mirajay-cli@local'], {
      cwd: targetDir,
      stdio: 'pipe',
    })

    await execa('git', ['add', '.'], { cwd: targetDir, stdio: 'pipe' })
    await execa(
      'git',
      ['commit', '-m', 'chore: initial commit from mirajay-cli'],
      { cwd: targetDir, stdio: 'pipe' },
    )
    success('Git 仓库初始化完成')
  } catch {
    warn('Git 初始化失败，请手动执行 git init 并提交')
  }
}

export async function checkDirectoryExists(dir: string): Promise<boolean> {
  try {
    await access(dir)
    return true
  } catch {
    return false
  }
}

/** 对项目目录运行 Prettier 格式化（需已安装 prettier） */
export async function formatProjectDir(targetDir: string): Promise<void> {
  step('格式化项目代码 (Prettier)...')
  try {
    await execa('npx', ['prettier', '--write', '.'], {
      cwd: targetDir,
      stdio: 'inherit',
    })
    success('代码格式化完成')
  } catch {
    warn('Prettier 格式化失败，可稍后手动运行 pnpm format')
  }
}

export function getPackageManagerCommand(
  pm: ProjectAnswers['packageManager'],
  script: string,
): string {
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

export async function detectProjectType(cwd: string): Promise<string | null> {
  const checks = [
    { file: 'pubspec.yaml', type: 'flutter' },
    { file: 'turbo.json', type: 'monorepo' },
    { file: 'vite.config.ts', type: 'vite' },
    { file: 'vite.config.js', type: 'vite' },
  ]

  for (const check of checks) {
    try {
      await access(join(cwd, check.file))
      return check.type
    } catch {
      // continue
    }
  }

  return null
}

export async function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<boolean> {
  try {
    await execa(command, args, { cwd, stdio: 'inherit' })
    return true
  } catch {
    error(`命令执行失败: ${command} ${args.join(' ')}`)
    return false
  }
}
