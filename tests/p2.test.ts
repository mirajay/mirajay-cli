import { describe, it, expect } from 'vitest'
import { mkdtemp, readFile, access, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateProject } from '../src/core/template.js'
import { createEngineeringFromPreset } from '../src/core/engineering.js'
import type { ProjectAnswers } from '../src/types.js'

describe('P2 template coverage', () => {
  it('generates runnable taro react skeleton', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-p2-taro-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'taro',
        framework: 'react',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'mobile-taro',
        targetDir,
        projectName: 'taro-app',
        answers,
      })

      await access(join(targetDir, 'config/index.ts'))
      await access(join(targetDir, 'src/app.ts'))
      await access(join(targetDir, 'src/pages/index/index.tsx'))
      await access(join(targetDir, 'project.config.json'))
      await access(join(targetDir, 'src/index.html'))
      await access(join(targetDir, 'babel.config.cjs'))
      await access(join(targetDir, 'types/global.d.ts'))
      await access(join(targetDir, '.gitignore'))

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.dependencies['@tarojs/plugin-platform-h5']).toBe('4.2.1')
      expect(pkg.dependencies['@tarojs/plugin-platform-alipay']).toBe('4.2.1')
      expect(pkg.dependencies['@tarojs/plugin-platform-tt']).toBe('4.2.1')
      expect(pkg.scripts['dev:alipay']).toBeDefined()
      expect(pkg.scripts['dev:tt']).toBeDefined()

      const indexHtml = await readFile(join(targetDir, 'src/index.html'), 'utf-8')
      expect(indexHtml).toContain('htmlWebpackPlugin.options.script')
      expect(indexHtml).toContain('<div id="app"></div>')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates runnable taro vue skeleton with vue-jsx plugin', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-p2-taro-vue-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'taro',
        framework: 'vue',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'mobile-taro',
        targetDir,
        projectName: 'taro-vue-app',
        answers,
      })

      await access(join(targetDir, 'src/app.ts'))
      await access(join(targetDir, 'src/pages/index/index.vue'))

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.dependencies['@tarojs/plugin-framework-vue3']).toBe('4.2.1')
      expect(pkg.devDependencies['@vitejs/plugin-vue']).toBeDefined()
      expect(pkg.devDependencies['@vitejs/plugin-vue-jsx']).toBe('^3.1.0')
      expect(pkg.devDependencies['@vitejs/plugin-react']).toBeUndefined()
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates runnable uni-app skeleton', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-p2-uni-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'uni-app',
        framework: 'vue',
        uiLibrary: '@dcloudio/uni-ui',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'mobile-uni-app',
        targetDir,
        projectName: 'uni-app',
        answers,
      })

      await access(join(targetDir, 'src/pages/index/index.vue'))
      await access(join(targetDir, 'src/pages.json'))
      await access(join(targetDir, 'src/manifest.json'))
      await access(join(targetDir, 'vite.config.ts'))

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.dependencies['@dcloudio/uni-ui']).toBeDefined()
      expect(pkg.dependencies.vant).toBeUndefined()
      expect(pkg.dependencies['@dcloudio/uni-mp-alipay']).toBeDefined()
      expect(pkg.dependencies['@dcloudio/uni-mp-toutiao']).toBeDefined()
      expect(pkg.scripts['dev:mp-alipay']).toBeDefined()
      expect(pkg.scripts['dev:mp-toutiao']).toBeDefined()

      const pages = JSON.parse(await readFile(join(targetDir, 'src/pages.json'), 'utf-8'))
      expect(pages.easycom.custom['^uni-(.*)']).toContain('@dcloudio/uni-ui')

      const page = await readFile(join(targetDir, 'src/pages/index/index.vue'), 'utf-8')
      expect(page).toContain('<uni-card')
      expect(page).toContain('<uni-list-item')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates expo-router react native skeleton', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-p2-rn-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'react-native',
        framework: 'react',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'mobile-rn',
        targetDir,
        projectName: 'rn-app',
        answers,
      })

      await access(join(targetDir, 'app/index.tsx'))
      await access(join(targetDir, 'app/_layout.tsx'))
      await access(join(targetDir, 'app.json'))

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.main).toBe('expo-router/entry')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('injects engineering into micro-frontend workspace packages', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-p2-micro-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'micro-frontend',
        microFrontendTool: 'module-federation',
        framework: 'react',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('standard'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'micro-module-federation-react',
        targetDir,
        projectName: 'mf-app',
        answers,
      })

      const hostPkg = JSON.parse(
        await readFile(join(targetDir, 'apps/host/package.json'), 'utf-8'),
      )
      const remotePkg = JSON.parse(
        await readFile(join(targetDir, 'packages/remote-app/package.json'), 'utf-8'),
      )

      expect(hostPkg.scripts.lint).toBeDefined()
      expect(hostPkg.devDependencies.eslint).toBeDefined()
      expect(remotePkg.scripts?.lint).toBeUndefined()
      expect(remotePkg.devDependencies?.eslint).toBeUndefined()
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates shadcn card and ui:add script', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-p2-shadcn-'))

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
        projectName: 'shadcn-app',
        answers,
      })

      await access(join(targetDir, 'src/components/ui/card.tsx'))
      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.scripts['ui:add']).toContain('shadcn')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })
})
