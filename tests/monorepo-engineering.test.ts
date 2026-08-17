import { describe, it, expect } from 'vitest'
import { shouldInjectWorkspaceEngineering } from '../src/core/monorepo-engineering.js'

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
