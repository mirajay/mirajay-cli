import { execa } from 'execa'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateProject, resolveTemplateName, resolveAppTargetDir } from '../../src/core/template.js'
import { createEngineeringFromPreset } from '../../src/core/engineering.js'
import type { ProjectAnswers } from '../../src/types.js'

export interface ScaffoldScenario {
  id: string
  answers: ProjectAnswers
  skipInstall?: boolean
  skipDev?: boolean
  skipBuild?: boolean
  skipLint?: boolean
  skipTest?: boolean
}

export interface ScaffoldStepResult {
  step: 'generate' | 'install' | 'dev' | 'build' | 'lint' | 'test'
  ok: boolean
  output?: string
}

export interface ScaffoldRunResult {
  id: string
  templateName: string
  projectDir: string
  steps: ScaffoldStepResult[]
  passed: boolean
}

const BASE_ANSWERS: Partial<ProjectAnswers> = {
  cssFramework: 'none',
  engineering: createEngineeringFromPreset('standard'),
  packageManager: 'pnpm',
  initGit: false,
  useTypeScript: true,
}

export const SCAFFOLD_SCENARIOS: ScaffoldScenario[] = [
  {
    id: 'desktop-react',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'desktop',
      framework: 'react',
      uiLibrary: 'antd',
      useMonorepo: false,
    } as ProjectAnswers,
  },
  {
    id: 'desktop-vue',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'desktop',
      framework: 'vue',
      uiLibrary: 'element-plus',
      useMonorepo: false,
    } as ProjectAnswers,
  },
  {
    id: 'desktop-react-mono',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'desktop',
      framework: 'react',
      uiLibrary: 'antd',
      useMonorepo: true,
    } as ProjectAnswers,
  },
  {
    id: 'mobile-h5-react',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'mobile',
      mobilePlatform: 'h5',
      framework: 'react',
      uiLibrary: 'antd-mobile',
      useMonorepo: false,
    } as ProjectAnswers,
  },
  {
    id: 'mobile-h5-vue',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'mobile',
      mobilePlatform: 'h5',
      framework: 'vue',
      uiLibrary: 'vant',
      useMonorepo: false,
    } as ProjectAnswers,
  },
  {
    id: 'mobile-taro-react',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'mobile',
      mobilePlatform: 'taro',
      framework: 'react',
      useMonorepo: false,
    } as ProjectAnswers,
    skipDev: true,
    // Taro standalone build fails inside Vitest workers (Rollup early exit); mono scenario covers build.
    skipBuild: true,
  },
  {
    id: 'mobile-taro-vue',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'mobile',
      mobilePlatform: 'taro',
      framework: 'vue',
      useMonorepo: false,
    } as ProjectAnswers,
    skipDev: true,
    skipBuild: true,
  },
  {
    id: 'mobile-taro-react-mono',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'mobile',
      mobilePlatform: 'taro',
      framework: 'react',
      useMonorepo: true,
    } as ProjectAnswers,
    skipDev: true,
  },
  {
    id: 'mobile-uni-app',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'mobile',
      mobilePlatform: 'uni-app',
      framework: 'vue',
      uiLibrary: '@dcloudio/uni-ui',
      useMonorepo: false,
    } as ProjectAnswers,
  },
  {
    id: 'mobile-rn',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'mobile',
      mobilePlatform: 'react-native',
      framework: 'react',
      useMonorepo: false,
    } as ProjectAnswers,
    skipDev: true,
  },
  {
    id: 'mobile-flutter',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'mobile',
      mobilePlatform: 'flutter',
      useMonorepo: false,
    } as ProjectAnswers,
    skipInstall: true,
    skipDev: true,
    skipBuild: true,
    skipLint: true,
    skipTest: true,
  },
  {
    id: 'micro-wujie-react',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'micro-frontend',
      microFrontendTool: 'wujie',
      framework: 'react',
      cssFramework: 'none',
      useMonorepo: false,
    } as ProjectAnswers,
  },
  {
    id: 'micro-wujie-vue',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'micro-frontend',
      microFrontendTool: 'wujie',
      framework: 'vue',
      cssFramework: 'none',
      useMonorepo: false,
    } as ProjectAnswers,
  },
  {
    id: 'micro-micro-app-react',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'micro-frontend',
      microFrontendTool: 'micro-app',
      framework: 'react',
      cssFramework: 'none',
      useMonorepo: false,
    } as ProjectAnswers,
  },
  {
    id: 'micro-qiankun-react',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'micro-frontend',
      microFrontendTool: 'qiankun',
      framework: 'react',
      cssFramework: 'none',
      useMonorepo: false,
    } as ProjectAnswers,
  },
  {
    id: 'micro-qiankun-vue',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'micro-frontend',
      microFrontendTool: 'qiankun',
      framework: 'vue',
      cssFramework: 'none',
      useMonorepo: false,
    } as ProjectAnswers,
  },
  {
    id: 'micro-module-federation-react',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'micro-frontend',
      microFrontendTool: 'module-federation',
      framework: 'react',
      microFrontendStackMode: 'same',
      remoteFramework: 'react',
      cssFramework: 'none',
      useMonorepo: true,
    } as ProjectAnswers,
  },
  {
    id: 'micro-module-federation-vue',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'micro-frontend',
      microFrontendTool: 'module-federation',
      framework: 'vue',
      microFrontendStackMode: 'same',
      remoteFramework: 'vue',
      cssFramework: 'none',
      useMonorepo: true,
    } as ProjectAnswers,
  },
  {
    id: 'micro-module-federation-mixed-react-vue',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'micro-frontend',
      microFrontendTool: 'module-federation',
      framework: 'react',
      microFrontendStackMode: 'mixed',
      remoteFramework: 'vue',
      cssFramework: 'none',
      useMonorepo: true,
    } as ProjectAnswers,
  },
  {
    id: 'micro-module-federation-mixed-vue-react',
    answers: {
      ...BASE_ANSWERS,
      projectType: 'micro-frontend',
      microFrontendTool: 'module-federation',
      framework: 'vue',
      microFrontendStackMode: 'mixed',
      remoteFramework: 'react',
      cssFramework: 'none',
      useMonorepo: true,
    } as ProjectAnswers,
  },
]

function getWorkDir(scenario: ScaffoldScenario, rootDir: string, templateName: string): string {
  const answers = scenario.answers
  return resolveAppTargetDir(rootDir, answers, templateName)
}

async function runStep(
  step: ScaffoldStepResult['step'],
  fn: () => Promise<void>,
): Promise<ScaffoldStepResult> {
  try {
    await fn()
    return { step, ok: true }
  } catch (error) {
    const output =
      error instanceof Error
        ? error.message +
          ('stderr' in error && typeof error.stderr === 'string' ? `\n${error.stderr}` : '') +
          ('stdout' in error && typeof error.stdout === 'string' ? `\n${error.stdout}` : '')
        : String(error)
    return { step, ok: false, output: output.slice(-4000) }
  }
}

async function runShellCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}
async function removeDir(dir: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
      return
    } catch {
      if (attempt === 2) throw new Error(`Failed to remove ${dir}`)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
}

export async function runScaffoldScenario(
  scenario: ScaffoldScenario,
  options?: { keepDir?: boolean },
): Promise<ScaffoldRunResult> {
  const rootDir = await mkdtemp(join(tmpdir(), `mirajay-matrix-${scenario.id}-`))
  const templateName = resolveTemplateName(scenario.answers)
  const workDir = getWorkDir(scenario, rootDir, templateName)
  const steps: ScaffoldStepResult[] = []

  try {
  steps.push(
    await runStep('generate', async () => {
      await generateProject({
        templateName,
        targetDir: rootDir,
        projectName: scenario.id,
        answers: scenario.answers,
      })
    }),
  )

  if (!steps[0]?.ok) {
    return { id: scenario.id, templateName, projectDir: workDir, steps, passed: false }
  }

  const execOpts = { cwd: workDir, stdio: 'pipe' as const, reject: true }

  if (!scenario.skipInstall) {
    steps.push(
      await runStep('install', async () => {
        await execa('pnpm', ['install'], { ...execOpts, cwd: rootDir })
      }),
    )
    if (!steps.at(-1)?.ok) {
      return { id: scenario.id, templateName, projectDir: workDir, steps, passed: false }
    }
  }

  if (!scenario.skipDev) {
    steps.push(
      await runStep('dev', async () => {
        const child = execa('pnpm', ['run', 'dev'], {
          cwd: rootDir,
          stdio: 'pipe',
          reject: false,
        })
        let output = ''
        child.stdout?.on('data', (chunk: Buffer) => {
          output += chunk.toString()
        })
        child.stderr?.on('data', (chunk: Buffer) => {
          output += chunk.toString()
        })
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            child.kill('SIGTERM')
            if (/Local:|ready in|built in|watching for file changes/i.test(output)) {
              resolve()
            } else {
              reject(new Error(`dev timeout without ready signal\n${output.slice(-2000)}`))
            }
          }, 45000)
          child.on('exit', (code) => {
            clearTimeout(timer)
            if (code === 0 || /Local:|ready in|built in|watching for file changes/i.test(output)) {
              resolve()
            } else {
              reject(new Error(`dev exited ${code}\n${output.slice(-2000)}`))
            }
          })
        })
      }),
    )
  }

  if (!scenario.skipBuild) {
    steps.push(
      await runStep('build', async () => {
        await runShellCommand('pnpm', ['run', 'build'], rootDir)
      }),
    )
  }

  if (!scenario.skipLint) {
    steps.push(
      await runStep('lint', async () => {
        await runShellCommand('pnpm', ['run', 'lint'], rootDir)
      }),
    )
  }

  if (!scenario.skipTest) {
    steps.push(
      await runStep('test', async () => {
        await runShellCommand('pnpm', ['run', 'test'], rootDir)
      }),
    )
  }

  const passed = steps.every((step) => step.ok)
  return { id: scenario.id, templateName, projectDir: workDir, steps, passed }
  } finally {
    if (!options?.keepDir) {
      await removeDir(rootDir).catch(() => {})
    }
  }
}

export function formatScaffoldFailures(results: ScaffoldRunResult[]): string {
  return results
    .filter((result) => !result.passed)
    .map((result) => {
      const failed = result.steps.filter((step) => !step.ok)
      return [
        `## ${result.id} (${result.templateName})`,
        ...failed.map((step) => `- ${step.step}: ${step.output?.slice(-800) ?? 'failed'}`),
      ].join('\n')
    })
    .join('\n\n')
}
