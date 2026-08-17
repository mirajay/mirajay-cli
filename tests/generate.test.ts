import { describe, it, expect } from 'vitest'
import { mkdtemp, readFile, access, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateProject } from '../src/core/template.js'
import { createEngineeringFromPreset } from '../src/core/engineering.js'
import type { ProjectAnswers } from '../src/types.js'

describe('generateProject', () => {
  it('generates desktop-vue project files', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-test-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'desktop',
        framework: 'vue',
        uiLibrary: 'element-plus',
        cssFramework: 'tailwindcss',
        engineering: createEngineeringFromPreset('standard'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'desktop-vue',
        targetDir,
        projectName: 'test-app',
        answers,
      })

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.name).toBe('test-app')
      expect(pkg.scripts.build).toContain('&&')
      expect(pkg.scripts.build).not.toContain('&amp;')
      expect(pkg.dependencies['element-plus']).toBeDefined()
      expect(pkg.dependencies.vue).toBeDefined()
      expect(pkg.scripts.lint).toBeDefined()

      const readme = await readFile(join(targetDir, 'README.md'), 'utf-8')
      expect(readme).toContain('## 快速开始')
      expect(readme).toContain('pnpm install')
      expect(readme).toContain('pnpm dev')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('merges monorepo config when useMonorepo is true', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-mono-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'desktop',
        framework: 'vue',
        uiLibrary: 'element-plus',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: true,
      }

      await generateProject({
        templateName: 'desktop-vue',
        targetDir,
        projectName: 'mono-app',
        answers,
      })

      const turbo = await readFile(join(targetDir, 'turbo.json'), 'utf-8')
      expect(turbo).toContain('tasks')

      const appPkg = JSON.parse(
        await readFile(join(targetDir, 'apps/web/package.json'), 'utf-8'),
      )
      expect(appPkg.name).toBe('web')
      expect(appPkg.dependencies['@mono-app/shared']).toBe('workspace:*')

      const sharedPkg = JSON.parse(
        await readFile(join(targetDir, 'packages/shared/package.json'), 'utf-8'),
      )
      expect(sharedPkg.name).toBe('@mono-app/shared')
      expect(sharedPkg.scripts?.lint).toBeUndefined()
      expect(sharedPkg.devDependencies?.eslint).toBeUndefined()

      const readme = await readFile(join(targetDir, 'apps/web/README.md'), 'utf-8')
      expect(readme).toContain('## 快速开始')
      expect(readme).toContain('pnpm dev')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates mobile-h5-vue monorepo with tsconfig and turbo scripts in apps/web', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-mono-mobile-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'h5',
        framework: 'vue',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: true,
      }

      await generateProject({
        templateName: 'mobile-h5-vue',
        targetDir,
        projectName: 'mono-mobile',
        answers,
      })

      await access(join(targetDir, 'apps/web/tsconfig.json'))
      await access(join(targetDir, 'turbo.json'))

      const appPkg = JSON.parse(
        await readFile(join(targetDir, 'apps/web/package.json'), 'utf-8'),
      )
      expect(appPkg.name).toBe('web')
      expect(appPkg.scripts.dev).toBe('vite')
      expect(appPkg.scripts.build).toContain('vue-tsc')
      expect(appPkg.dependencies['@mono-mobile/shared']).toBe('workspace:*')

      const tsconfig = JSON.parse(
        await readFile(join(targetDir, 'apps/web/tsconfig.json'), 'utf-8'),
      )
      expect(tsconfig.compilerOptions.target).toBe('ESNext')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates mobile-taro monorepo with dev/build aliases for turbo', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-mono-taro-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'taro',
        framework: 'react',
        engineering: createEngineeringFromPreset('standard'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: true,
      }

      await generateProject({
        templateName: 'mobile-taro',
        targetDir,
        projectName: 'mono-taro',
        answers,
      })

      await access(join(targetDir, '.gitignore'))
      const gitignore = await readFile(join(targetDir, '.gitignore'), 'utf-8')
      expect(gitignore).toContain('.temp/')
      expect(gitignore).toContain('node_modules/')

      await access(join(targetDir, '.husky/pre-commit'))
      await access(join(targetDir, 'commitlint.config.cjs'))
      const rootPkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(rootPkg.scripts.prepare).toBe('husky')
      expect(rootPkg.devDependencies.husky).toBeDefined()

      const appPkg = JSON.parse(
        await readFile(join(targetDir, 'apps/web/package.json'), 'utf-8'),
      )
      expect(appPkg.name).toBe('web')
      expect(appPkg.scripts.dev).toBe('npm run dev:h5')
      expect(appPkg.scripts.build).toBe('taro build --type h5')
      expect(appPkg.dependencies['@mono-taro/shared']).toBe('workspace:*')
      expect(appPkg.scripts.prepare).toBeUndefined()
      expect(appPkg.devDependencies?.husky).toBeUndefined()

      await access(join(targetDir, 'apps/web/tsconfig.json'))
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })
})
