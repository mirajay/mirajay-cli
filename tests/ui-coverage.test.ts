import { describe, it, expect } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateProject } from '../src/core/template.js'
import { createEngineeringFromPreset } from '../src/core/engineering.js'
import type { ProjectAnswers } from '../src/types.js'

describe('UI template coverage', () => {
  it('generates primevue desktop-vue with themes dependency and App template', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-primevue-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'desktop',
        framework: 'vue',
        uiLibrary: 'primevue',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'desktop-vue',
        targetDir,
        projectName: 'prime-app',
        answers,
      })

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.dependencies['@primevue/themes']).toBeDefined()
      expect(pkg.dependencies.primevue).toBeDefined()

      const app = await readFile(join(targetDir, 'src/App.vue'), 'utf-8')
      expect(app).toContain("from 'primevue/card'")
      expect(app).toContain('<Card')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates vuetify desktop-vue with v-card in App template', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-vuetify-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'desktop',
        framework: 'vue',
        uiLibrary: 'vuetify',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'desktop-vue',
        targetDir,
        projectName: 'vuetify-app',
        answers,
      })

      const app = await readFile(join(targetDir, 'src/App.vue'), 'utf-8')
      expect(app).toContain('<v-card')
      expect(app).toContain('<v-btn')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates mobile-h5 templates with postcss-pxtorem in vite config', async () => {
    const vueVantDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-h5-vue-vant-'))
    const vueNutDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-h5-vue-nut-'))
    const reactDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-h5-react-'))

    try {
      const baseAnswers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'h5',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'mobile-h5-vue',
        targetDir: vueVantDir,
        projectName: 'h5-vue-vant',
        answers: { ...baseAnswers, framework: 'vue', uiLibrary: 'vant' },
      })

      await generateProject({
        templateName: 'mobile-h5-vue',
        targetDir: vueNutDir,
        projectName: 'h5-vue-nut',
        answers: { ...baseAnswers, framework: 'vue', uiLibrary: '@nutui/nutui' },
      })

      await generateProject({
        templateName: 'mobile-h5-react',
        targetDir: reactDir,
        projectName: 'h5-react',
        answers: { ...baseAnswers, framework: 'react', uiLibrary: 'antd-mobile' },
      })

      const vantPkg = JSON.parse(await readFile(join(vueVantDir, 'package.json'), 'utf-8'))
      expect(vantPkg.dependencies.vant).toBeDefined()
      expect(vantPkg.dependencies['@nutui/nutui']).toBeUndefined()
      const vantApp = await readFile(join(vueVantDir, 'src/App.vue'), 'utf-8')
      expect(vantApp).toContain('<van-nav-bar')
      const vantMain = await readFile(join(vueVantDir, 'src/main.ts'), 'utf-8')
      expect(vantMain).toContain("'vant")

      const nutPkg = JSON.parse(await readFile(join(vueNutDir, 'package.json'), 'utf-8'))
      expect(nutPkg.dependencies['@nutui/nutui']).toBeDefined()
      expect(nutPkg.dependencies.vant).toBeUndefined()
      const nutApp = await readFile(join(vueNutDir, 'src/App.vue'), 'utf-8')
      expect(nutApp).toContain('<nut-navbar')
      expect(nutApp).not.toContain('<van-')
      const nutMain = await readFile(join(vueNutDir, 'src/main.ts'), 'utf-8')
      expect(nutMain).toContain('@nutui/nutui')

      const vueVite = await readFile(join(vueVantDir, 'vite.config.ts'), 'utf-8')
      expect(vueVite).toContain('postcss-pxtorem')
      expect(vueVite).toContain('rootValue: 37.5')

      const vueRouter = await readFile(join(vueVantDir, 'src/router/index.ts'), 'utf-8')
      expect(vueRouter).toContain("import('../App.vue')")
      expect(vueRouter).not.toContain("import('./App.vue')")

      expect(vantApp).toMatch(/padding: 16px;\n}\n\n\.action/)

      const reactVite = await readFile(join(reactDir, 'vite.config.ts'), 'utf-8')
      expect(reactVite).toContain('postcss-pxtorem')
      expect(reactVite).toContain('rootValue: 37.5')
    } finally {
      await rm(vueVantDir, { recursive: true, force: true })
      await rm(vueNutDir, { recursive: true, force: true })
      await rm(reactDir, { recursive: true, force: true })
    }
  })

  it('generates mobile-taro vue with NutUI dependency and demo page', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-taro-nut-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'mobile',
        mobilePlatform: 'taro',
        framework: 'vue',
        uiLibrary: '@nutui/nutui',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'mobile-taro',
        targetDir,
        projectName: 'taro-nut',
        answers,
      })

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.dependencies['@nutui/nutui-taro']).toBeDefined()
      expect(pkg.devDependencies['@tarojs/plugin-html']).toBeDefined()

      const appEntry = await readFile(join(targetDir, 'src/app.ts'), 'utf-8')
      expect(appEntry).toContain('@nutui/nutui-taro')

      const page = await readFile(join(targetDir, 'src/pages/index/index.vue'), 'utf-8')
      expect(page).toContain('<nut-cell')
      expect(page).toContain('<nut-button')

      const config = await readFile(join(targetDir, 'config/index.ts'), 'utf-8')
      expect(config).toContain('@tarojs/plugin-html')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })
})
