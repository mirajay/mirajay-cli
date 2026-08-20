import { describe, it, expect } from 'vitest'
import {
  isAppEngineeringFile,
  isSharedEngineeringFile,
  isWorkspaceEngineeringMonorepo,
  matchesEngineeringFileScope,
  resolveEngineeringAppRelativePath,
  shouldInjectWorkspaceEngineering,
} from '../src/core/monorepo-engineering.js'
import type { ProjectAnswers } from '../src/types.js'

describe('shouldInjectWorkspaceEngineering', () => {
  it('injects into apps/* only', () => {
    expect(shouldInjectWorkspaceEngineering('/proj/apps/web')).toBe(true)
    expect(shouldInjectWorkspaceEngineering('/proj/apps/host')).toBe(true)
    expect(shouldInjectWorkspaceEngineering('\\proj\\apps\\web')).toBe(true)
  })

  it('skips packages/* library workspaces', () => {
    expect(shouldInjectWorkspaceEngineering('/proj/packages/shared')).toBe(false)
    expect(shouldInjectWorkspaceEngineering('/proj/packages/remote-app')).toBe(false)
  })
})

describe('workspace engineering placement', () => {
  const desktopMono = {
    useMonorepo: true,
  } as ProjectAnswers

  it('treats desktop monorepo and MF templates as workspace engineering', () => {
    expect(isWorkspaceEngineeringMonorepo(desktopMono, 'desktop-react')).toBe(true)
    expect(
      isWorkspaceEngineeringMonorepo(
        { useMonorepo: true } as ProjectAnswers,
        'micro-module-federation-react',
      ),
    ).toBe(true)
    expect(isWorkspaceEngineeringMonorepo({ useMonorepo: false } as ProjectAnswers, 'desktop-react')).toBe(
      false,
    )
  })

  it('resolves primary app path per template family', () => {
    expect(resolveEngineeringAppRelativePath(desktopMono, 'desktop-vue')).toBe('apps/web')
    expect(
      resolveEngineeringAppRelativePath(
        { useMonorepo: true } as ProjectAnswers,
        'micro-module-federation-vue',
      ),
    ).toBe('apps/host')
    expect(
      resolveEngineeringAppRelativePath({ useMonorepo: false } as ProjectAnswers, 'desktop-react'),
    ).toBe('.')
  })

  it('classifies shared vs app engineering files', () => {
    expect(isSharedEngineeringFile('prettier.config.mjs')).toBe(true)
    expect(isSharedEngineeringFile('.editorconfig')).toBe(true)
    expect(isSharedEngineeringFile('cspell.json.ejs')).toBe(true)
    expect(isAppEngineeringFile('eslint.react.config.js.ejs')).toBe(true)
    expect(isAppEngineeringFile('vitest.config.vue.ts.ejs')).toBe(true)
    expect(isSharedEngineeringFile('eslint.react.config.js.ejs')).toBe(false)
    expect(matchesEngineeringFileScope('prettier.config.mjs', 'shared')).toBe(true)
    expect(matchesEngineeringFileScope('eslint.react.config.js.ejs', 'shared')).toBe(false)
    expect(matchesEngineeringFileScope('eslint.react.config.js.ejs', 'app')).toBe(true)
  })
})
