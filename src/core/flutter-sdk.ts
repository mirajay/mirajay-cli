import { execa } from 'execa'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { step, success, warn } from './logger.js'

export interface FlutterSdkInfo {
  /** Executable: `flutter`, full path, or `fvm` */
  command: string
  /** Prefix args before subcommand, e.g. [`flutter`] for fvm */
  prefix: string[]
}

function flutterBinName(): string {
  return process.platform === 'win32' ? 'flutter.bat' : 'flutter'
}

function flutterBinPath(root: string): string {
  return join(root, 'bin', flutterBinName())
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function flutterVersionOk(command: string, prefix: string[]): Promise<boolean> {
  try {
    const { stdout } = await execa(command, [...prefix, '--version'], { stdio: 'pipe' })
    return stdout.includes('Flutter')
  } catch {
    return false
  }
}

function buildFlutterCandidates(): string[] {
  const bin = flutterBinName()
  const home = homedir()
  const candidates = [
    join(home, 'flutter', 'bin', bin),
    join(home, 'development', 'flutter', 'bin', bin),
    join(home, 'fvm', 'default', 'bin', bin),
    join(home, '.fvm', 'default', 'bin', bin),
    '/opt/homebrew/bin/flutter',
  ]

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA
    if (localAppData) {
      candidates.push(join(localAppData, 'flutter', 'bin', bin))
    }
    const userProfile = process.env.USERPROFILE
    if (userProfile) {
      candidates.push(join(userProfile, 'flutter', 'bin', bin))
    }
  }

  return candidates
}

export async function resolveFlutterSdk(): Promise<FlutterSdkInfo | null> {
  if (await flutterVersionOk('flutter', [])) {
    return { command: 'flutter', prefix: [] }
  }

  if (await flutterVersionOk('fvm', ['flutter'])) {
    return { command: 'fvm', prefix: ['flutter'] }
  }

  const flutterRoot = process.env.FLUTTER_ROOT
  if (flutterRoot) {
    const cmd = flutterBinPath(flutterRoot)
    if ((await fileExists(cmd)) && (await flutterVersionOk(cmd, []))) {
      return { command: cmd, prefix: [] }
    }
  }

  for (const cmd of buildFlutterCandidates()) {
    if ((await fileExists(cmd)) && (await flutterVersionOk(cmd, []))) {
      return { command: cmd, prefix: [] }
    }
  }

  return null
}

export async function checkFlutterSdk(): Promise<boolean> {
  return (await resolveFlutterSdk()) !== null
}

export async function installFlutterDependencies(
  targetDir: string,
  sdk: FlutterSdkInfo,
): Promise<void> {
  step('安装 Flutter 依赖 (flutter pub get)...')

  try {
    await execa(sdk.command, [...sdk.prefix, 'pub', 'get'], {
      cwd: targetDir,
      stdio: 'inherit',
    })
    success('Flutter 依赖安装完成')
  } catch {
    warn('flutter pub get 失败，请手动进入项目目录执行 flutter pub get')
  }
}

export async function runFlutterCommand(
  sdk: FlutterSdkInfo,
  args: string[],
  cwd: string,
): Promise<boolean> {
  try {
    await execa(sdk.command, [...sdk.prefix, ...args], { cwd, stdio: 'inherit' })
    return true
  } catch {
    return false
  }
}
