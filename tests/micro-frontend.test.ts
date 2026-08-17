import { describe, it, expect } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateProject } from '../src/core/template.js'
import { createEngineeringFromPreset } from '../src/core/engineering.js'
import type { ProjectAnswers } from '../src/types.js'

describe('micro-frontend templates by framework', () => {
  it('generates qiankun vue without react dependencies', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-micro-qiankun-vue-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'micro-frontend',
        microFrontendTool: 'qiankun',
        framework: 'vue',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'micro-qiankun-vue',
        targetDir,
        projectName: 'qiankun-vue-app',
        answers,
      })

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.dependencies.vue).toBeDefined()
      expect(pkg.dependencies.qiankun).toBeDefined()
      expect(pkg.dependencies.react).toBeUndefined()
      expect(pkg.dependencies['react-dom']).toBeUndefined()

      const main = await readFile(join(targetDir, 'src/main.ts'), 'utf-8')
      expect(main).toContain("from 'vue'")
      expect(main).toContain('sub-app-vue')
      expect(main).not.toContain('sub-app-react')
      expect(main).not.toContain('react-dom')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates qiankun react with react dependencies', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-micro-qiankun-react-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'micro-frontend',
        microFrontendTool: 'qiankun',
        framework: 'react',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'micro-qiankun-react',
        targetDir,
        projectName: 'qiankun-react-app',
        answers,
      })

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.dependencies.react).toBeDefined()
      expect(pkg.dependencies.vue).toBeUndefined()

      const main = await readFile(join(targetDir, 'src/main.tsx'), 'utf-8')
      expect(main).toContain('sub-app-react')
      expect(main).not.toContain('sub-app-vue')
      expect(main).not.toContain("from 'vue'")
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates wujie react without vue dependencies or vue sub-app id', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-micro-wujie-react-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'micro-frontend',
        microFrontendTool: 'wujie',
        framework: 'react',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'micro-wujie-react',
        targetDir,
        projectName: 'wujie-react-app',
        answers,
      })

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.dependencies['wujie-react']).toBeDefined()
      expect(pkg.dependencies.vue).toBeUndefined()

      const main = await readFile(join(targetDir, 'src/main.tsx'), 'utf-8')
      expect(main).toContain('sub-app-react')
      expect(main).not.toContain('vue-sub-app')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates wujie vue with wujie-vue3', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-micro-wujie-vue-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'micro-frontend',
        microFrontendTool: 'wujie',
        framework: 'vue',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('minimal'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: false,
      }

      await generateProject({
        templateName: 'micro-wujie-vue',
        targetDir,
        projectName: 'wujie-vue-app',
        answers,
      })

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.dependencies['wujie-vue3']).toBeDefined()
      expect(pkg.dependencies['wujie-react']).toBeUndefined()
      expect(pkg.dependencies.react).toBeUndefined()

      const main = await readFile(join(targetDir, 'src/main.ts'), 'utf-8')
      expect(main).toContain('sub-app-vue')
      expect(main).not.toContain('react-sub-app')
      expect(main).not.toContain("from 'react'")
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates module federation vue monorepo with vue host', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-micro-mf-vue-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'micro-frontend',
        microFrontendTool: 'module-federation',
        framework: 'vue',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('standard'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: true,
      }

      await generateProject({
        templateName: 'micro-module-federation-vue',
        targetDir,
        projectName: 'mf-vue-app',
        answers,
      })

      const hostPkg = JSON.parse(
        await readFile(join(targetDir, 'apps/host/package.json'), 'utf-8'),
      )
      expect(hostPkg.dependencies.vue).toBeDefined()
      expect(hostPkg.dependencies.react).toBeUndefined()

      const remotePkg = JSON.parse(
        await readFile(join(targetDir, 'packages/remote-app/package.json'), 'utf-8'),
      )
      expect(remotePkg.dependencies.vue).toBeDefined()
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates module federation mixed react host with vue remote', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-micro-mf-mixed-rv-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'micro-frontend',
        microFrontendTool: 'module-federation',
        framework: 'react',
        microFrontendStackMode: 'mixed',
        remoteFramework: 'vue',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('standard'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: true,
      }

      await generateProject({
        templateName: 'micro-module-federation-mixed-react-vue',
        targetDir,
        projectName: 'mf-mixed-rv',
        answers,
      })

      const hostPkg = JSON.parse(
        await readFile(join(targetDir, 'apps/host/package.json'), 'utf-8'),
      )
      expect(hostPkg.dependencies.react).toBeDefined()
      expect(hostPkg.dependencies.vue).toBeDefined()

      const remotePkg = JSON.parse(
        await readFile(join(targetDir, 'packages/remote-app/package.json'), 'utf-8'),
      )
      expect(remotePkg.dependencies.vue).toBeDefined()
      expect(remotePkg.dependencies.react).toBeUndefined()

      const bridge = await readFile(
        join(targetDir, 'apps/host/src/RemoteVueHeader.tsx'),
        'utf-8',
      )
      expect(bridge).toContain('createApp')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates module federation mixed vue host with react remote', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-micro-mf-mixed-vr-'))

    try {
      const answers: ProjectAnswers = {
        projectType: 'micro-frontend',
        microFrontendTool: 'module-federation',
        framework: 'vue',
        microFrontendStackMode: 'mixed',
        remoteFramework: 'react',
        cssFramework: 'none',
        engineering: createEngineeringFromPreset('standard'),
        packageManager: 'pnpm',
        initGit: false,
        useMonorepo: true,
      }

      await generateProject({
        templateName: 'micro-module-federation-mixed-vue-react',
        targetDir,
        projectName: 'mf-mixed-vr',
        answers,
      })

      const hostPkg = JSON.parse(
        await readFile(join(targetDir, 'apps/host/package.json'), 'utf-8'),
      )
      expect(hostPkg.dependencies.vue).toBeDefined()
      expect(hostPkg.dependencies.react).toBeDefined()

      const remotePkg = JSON.parse(
        await readFile(join(targetDir, 'packages/remote-app/package.json'), 'utf-8'),
      )
      expect(remotePkg.dependencies.react).toBeDefined()
      expect(remotePkg.dependencies.vue).toBeUndefined()

      await readFile(join(targetDir, 'apps/host/src/RemoteReactHeader.vue'), 'utf-8')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })
})
