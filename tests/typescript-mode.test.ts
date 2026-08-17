import { describe, expect, it } from 'vitest'
import { access } from 'node:fs/promises'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  applyJavaScriptExtension,
  isTypeScriptConfigPath,
  resolveUseTypeScript,
  supportsTypeScriptChoice,
} from '../src/core/typescript-mode.js'
import { generateProject } from '../src/core/template.js'
import { createEngineeringFromPreset } from '../src/core/engineering.js'
import type { ProjectAnswers } from '../src/types.js'

describe('typescript-mode', () => {
  it('allows choice for desktop but not taro', () => {
    expect(
      supportsTypeScriptChoice({ projectType: 'desktop', framework: 'react' }),
    ).toBe(true)
    expect(
      supportsTypeScriptChoice({
        projectType: 'mobile',
        mobilePlatform: 'taro',
        framework: 'react',
      }),
    ).toBe(false)
  })

  it('remaps ts extensions for javascript projects', () => {
    expect(applyJavaScriptExtension('src/main.tsx', false)).toBe('src/main.jsx')
    expect(applyJavaScriptExtension('src/main.ts', false)).toBe('src/main.js')
    expect(applyJavaScriptExtension('src/main.tsx', true)).toBe('src/main.tsx')
  })

  it('detects tsconfig paths', () => {
    expect(isTypeScriptConfigPath('tsconfig.json')).toBe(true)
    expect(isTypeScriptConfigPath('tsconfig.json.ejs')).toBe(true)
    expect(isTypeScriptConfigPath('tsconfig.app.json')).toBe(true)
    expect(isTypeScriptConfigPath('src/vite-env.d.ts')).toBe(true)
    expect(isTypeScriptConfigPath('vite.config.ts')).toBe(false)
  })

  it('defaults to typescript when unset', () => {
    expect(resolveUseTypeScript({ projectType: 'desktop', framework: 'vue' })).toBe(true)
    expect(
      resolveUseTypeScript({
        projectType: 'desktop',
        framework: 'vue',
        useTypeScript: false,
      }),
    ).toBe(false)
  })
})

describe('generateProject javascript mode', () => {
  it('generates desktop-react without typescript artifacts', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-js-react-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'desktop',
        framework: 'react',
        uiLibrary: 'antd',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
        useTypeScript: false,
      }

      await generateProject({
        templateName: 'desktop-react',
        targetDir,
        projectName: 'js-app',
        answers,
      })

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.devDependencies.typescript).toBeUndefined()
      expect(pkg.scripts.build).toBe('vite build')

      await expect(access(join(targetDir, 'tsconfig.json'))).rejects.toThrow()
      await expect(readFile(join(targetDir, 'src/main.jsx'), 'utf-8')).resolves.toContain('createRoot')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('keeps tsconfig.json for shadcn-ui in javascript mode', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-js-shadcn-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'desktop',
        framework: 'react',
        uiLibrary: 'shadcn-ui',
        cssFramework: 'tailwindcss',
        engineering: createEngineeringFromPreset('standard'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: true,
        useTypeScript: false,
      }

      await generateProject({
        templateName: 'desktop-react',
        targetDir,
        projectName: 'js-shadcn',
        answers,
      })

      const appDir = join(targetDir, 'apps/web')
      const tsconfig = JSON.parse(await readFile(join(appDir, 'tsconfig.json'), 'utf-8'))
      expect(tsconfig.compilerOptions.allowJs).toBe(true)
      expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['src/*'])

      const components = JSON.parse(await readFile(join(appDir, 'components.json'), 'utf-8'))
      expect(components.tsx).toBe(false)

      const pkg = JSON.parse(await readFile(join(appDir, 'package.json'), 'utf-8'))
      expect(pkg.devDependencies.typescript).toBeDefined()
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })
})
