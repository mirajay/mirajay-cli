import { describe, it, expect } from 'vitest'
import { mkdtemp, readFile, access, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateProject } from '../src/core/template.js'
import {
  createEngineeringFromPreset,
  resolveEngineeringOptions,
} from '../src/core/engineering.js'
import type { ProjectAnswers } from '../src/types.js'

describe('generateProject engineering', () => {
  it('generates desktop-react with standard engineering files', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-eng-react-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'desktop',
        framework: 'react',
        uiLibrary: 'antd',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('standard'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'desktop-react',
        targetDir,
        projectName: 'test-react',
        answers,
      })

      await access(join(targetDir, '.gitignore'))
      await access(join(targetDir, 'eslint.config.js'))
      await access(join(targetDir, 'prettier.config.mjs'))
      await access(join(targetDir, 'stylelint.config.mjs'))
      const stylelintConfig = await readFile(join(targetDir, 'stylelint.config.mjs'), 'utf-8')
      expect(stylelintConfig).toContain("'theme'")
      await access(join(targetDir, '.markdownlint.json'))
      await access(join(targetDir, 'vitest.config.ts'))
      await access(join(targetDir, 'src/__tests__/smoke.test.ts'))

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.scripts.lint).toBeDefined()
      expect(pkg.scripts.test).toBe('vitest run')
      expect(pkg.devDependencies.eslint).toBeDefined()
      expect(pkg.devDependencies.prettier).toBeDefined()
      expect(pkg.devDependencies.husky).toBeDefined()
      expect(pkg.devDependencies['@commitlint/cli']).toBeDefined()
      expect(pkg.scripts.prepare).toBe('husky')
      expect(pkg.scripts.commit).toBe('cz')
      expect(pkg.config?.commitizen?.path).toBe('node_modules/cz-git')
      expect(pkg.devDependencies.cspell).toBeUndefined()

      const commitlint = await readFile(join(targetDir, 'commitlint.config.cjs'), 'utf-8')
      expect(commitlint).toContain('type-enum')
      expect(commitlint).toContain('header-max-length')
      await access(join(targetDir, '.husky/pre-commit'))
      await access(join(targetDir, '.husky/commit-msg'))
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates desktop-vue with minimal engineering files', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-eng-vue-min-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'desktop',
        framework: 'vue',
        uiLibrary: 'element-plus',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'desktop-vue',
        targetDir,
        projectName: 'test-vue-min',
        answers,
      })

      await access(join(targetDir, 'eslint.config.js'))
      await access(join(targetDir, 'prettier.config.mjs'))

      await expect(access(join(targetDir, 'stylelint.config.mjs'))).rejects.toThrow()
      await expect(access(join(targetDir, 'cspell.json'))).rejects.toThrow()
      await expect(access(join(targetDir, 'vitest.config.ts'))).rejects.toThrow()

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.scripts.lint).toBeDefined()
      expect(pkg.scripts.test).toBeUndefined()
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates desktop-vue with strict engineering including cspell', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-eng-vue-strict-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'desktop',
        framework: 'vue',
        uiLibrary: 'element-plus',
        cssFramework: 'tailwindcss',
        engineering: createEngineeringFromPreset('strict'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'desktop-vue',
        targetDir,
        projectName: 'test-vue-strict',
        answers,
      })

      await access(join(targetDir, 'cspell.json'))
      const cspell = JSON.parse(await readFile(join(targetDir, 'cspell.json'), 'utf-8'))
      expect(cspell.words).toContain('mirajay')
      expect(cspell.words).toContain('mirajay-cli')
      expect(cspell.words).not.toContain('amfe')
      expect(cspell.words).not.toContain('pxtorem')
      expect(cspell.words).not.toContain('norem')
      expect(cspell.words).not.toContain('nutui')
      await access(join(targetDir, 'commitlint.config.cjs'))
      const eslint = await readFile(join(targetDir, 'eslint.config.js'), 'utf-8')
      expect(eslint).toContain("files: ['**/*.{cjs,mjs}']")
      expect(eslint).toContain('globals.node')
      await access(join(targetDir, 'lint-staged.config.mjs'))
      await access(join(targetDir, '.husky/pre-commit'))
      await access(join(targetDir, '.husky/commit-msg'))

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.devDependencies.cspell).toBeDefined()
      expect(pkg.devDependencies['postcss-html']).toBeDefined()
      expect(pkg.devDependencies['stylelint-config-standard-vue']).toBeDefined()
      expect(pkg.scripts['lint:spell']).toBeDefined()
      expect(pkg.scripts.commit).toBe('cz')
      expect(pkg.scripts.prepare).toBe('husky')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates mobile-h5-react with standard engineering', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-eng-h5-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'h5',
        framework: 'react',
        uiLibrary: 'antd-mobile',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('strict'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'mobile-h5-react',
        targetDir,
        projectName: 'test-h5',
        answers,
      })

      await access(join(targetDir, 'eslint.config.js'))
      await access(join(targetDir, 'cspell.json'))
      const cspell = JSON.parse(await readFile(join(targetDir, 'cspell.json'), 'utf-8'))
      expect(cspell.words).toContain('amfe')
      expect(cspell.words).toContain('pxtorem')
      expect(cspell.words).toContain('norem')
      expect(cspell.words).not.toContain('nutui')
      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.scripts.lint).toBeDefined()
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates mobile-taro with strict cspell words', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-eng-taro-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'taro',
        framework: 'react',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('strict'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'mobile-taro',
        targetDir,
        projectName: 'test-taro',
        answers,
      })

      const cspell = JSON.parse(await readFile(join(targetDir, 'cspell.json'), 'utf-8'))
      expect(cspell.words).toContain('tarojs')
      expect(cspell.words).toContain('weapp')
      expect(cspell.words).toContain('ifdef')
      expect(cspell.words).toContain('WEIXIN')
      expect(cspell.words).not.toContain('amfe')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates mobile-taro vue eslint config for babel.config.cjs', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-eng-taro-vue-eslint-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'taro',
        framework: 'vue',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('standard'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'mobile-taro',
        targetDir,
        projectName: 'test-taro-vue-eslint',
        answers,
      })

      const eslint = await readFile(join(targetDir, 'eslint.config.js'), 'utf-8')
      expect(eslint).toContain("files: ['babel.config.cjs']")
      expect(eslint).toContain("sourceType: 'commonjs'")

      const page = await readFile(join(targetDir, 'src/pages/index/index.vue'), 'utf-8')
      expect(page).toContain("import { useLoad } from '@tarojs/taro'")
      expect(page).not.toMatch(/import Taro, \{ useLoad \}/)
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates mobile-h5-vue with nutui and strict cspell words', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-eng-h5-nut-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'h5',
        framework: 'vue',
        uiLibrary: '@nutui/nutui',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('strict'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'mobile-h5-vue',
        targetDir,
        projectName: 'test-h5-nut',
        answers,
      })

      const cspell = JSON.parse(await readFile(join(targetDir, 'cspell.json'), 'utf-8'))
      expect(cspell.words).toContain('nutui')
      expect(cspell.words).toContain('amfe')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates micro-wujie with standard engineering', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-eng-micro-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'micro-frontend',
        microFrontendTool: 'wujie',
        framework: 'react',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('standard'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'micro-wujie-react',
        targetDir,
        projectName: 'test-wujie',
        answers,
      })

      await access(join(targetDir, 'eslint.config.js'))
      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.devDependencies.eslint).toBeDefined()
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates shadcn-ui desktop-react template files', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-shadcn-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'desktop',
        framework: 'react',
        uiLibrary: 'shadcn-ui',
        cssFramework: 'tailwindcss',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'desktop-react',
        targetDir,
        projectName: 'test-shadcn',
        answers,
      })

      await access(join(targetDir, 'components.json'))
      await access(join(targetDir, 'tsconfig.json'))
      await access(join(targetDir, 'src/lib/utils.ts'))
      await access(join(targetDir, 'src/components/ui/button.tsx'))
      const tailwindCss = await readFile(join(targetDir, 'src/styles/tailwind.css'), 'utf-8')
      expect(tailwindCss).toContain('@theme inline')
      expect(tailwindCss).toContain('--color-primary')

      const globalCss = await readFile(join(targetDir, 'src/styles/global.css'), 'utf-8')
      expect(globalCss).toContain('@layer base')
      expect(globalCss).toContain('@layer components')
      expect(globalCss.indexOf('@layer base')).toBeLessThan(globalCss.indexOf('margin: 0'))

      const prettierIgnore = await readFile(join(targetDir, '.prettierignore'), 'utf-8')
      expect(prettierIgnore).toContain('.turbo')

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.devDependencies['tw-animate-css']).toBeDefined()
      expect(pkg.scripts.lint?.startsWith('prettier --write .')).toBe(true)
      expect(pkg.dependencies['class-variance-authority']).toBeDefined()
      expect(pkg.dependencies.antd).toBeUndefined()
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })
})

describe('resolveEngineeringOptions', () => {
  it('expands standard preset', () => {
    const options = resolveEngineeringOptions({
      projectType: 'desktop',
      engineering: createEngineeringFromPreset('standard'),
    })
    expect(options.eslint).toBe(true)
    expect(options.spellcheck).toBe(false)
    expect(options.vitest).toBe(true)
  })

  it('expands standard preset with git hooks', () => {
    const options = resolveEngineeringOptions({
      engineering: createEngineeringFromPreset('standard'),
    })
    expect(options.commitlint).toBe(true)
    expect(options.husky).toBe(true)
    expect(options.lintStaged).toBe(true)
  })

  it('expands strict preset with spellcheck', () => {
    const options = resolveEngineeringOptions({
      projectType: 'desktop',
      engineering: createEngineeringFromPreset('strict'),
    })
    expect(options.spellcheck).toBe(true)
    expect(options.commitlint).toBe(true)
    expect(options.husky).toBe(true)
    expect(options.lintStaged).toBe(true)
  })

  it('maps deprecated needMarkdownlint', () => {
    const options = resolveEngineeringOptions({
      projectType: 'desktop',
      needMarkdownlint: false,
    })
    expect(options.markdownlint).toBe(false)
  })
})
