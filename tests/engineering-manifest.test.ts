import { describe, it, expect } from 'vitest'
import { getEngineeringManifest } from '../src/core/engineering-manifest.js'
import { createEngineeringFromPreset } from '../src/core/engineering.js'

describe('getEngineeringManifest lint script', () => {
  it('runs prettier --write before other lint steps', () => {
    const manifest = getEngineeringManifest({
      profile: 'react',
      engineering: createEngineeringFromPreset('standard'),
    })

    expect(manifest.scripts.lint).toMatch(/^prettier --write \./)
    expect(manifest.scripts.lint).not.toContain('prettier --check')
    expect(manifest.scripts.lint).toContain('eslint .')
    expect(manifest.scripts.lint).toContain('stylelint')
  })

  it('keeps format:check as a separate script', () => {
    const manifest = getEngineeringManifest({
      profile: 'vue',
      engineering: createEngineeringFromPreset('minimal'),
    })

    expect(manifest.scripts.format).toBe('prettier --write .')
    expect(manifest.scripts['format:check']).toBe('prettier --check .')
  })

  it('splits shared and app scopes for monorepo placement', () => {
    const engineering = createEngineeringFromPreset('standard')
    const shared = getEngineeringManifest({
      profile: 'react',
      engineering,
      scope: 'shared',
    })
    const app = getEngineeringManifest({
      profile: 'react',
      engineering,
      includeGitHooks: false,
      scope: 'app',
    })
    const hooks = getEngineeringManifest({
      profile: 'react',
      engineering,
      includeGitHooks: true,
      scope: 'hooks',
    })

    expect(shared.devDependencies.prettier).toBeDefined()
    expect(shared.devDependencies.eslint).toBeUndefined()
    expect(shared.scripts.lint).toBeUndefined()
    expect(shared.scripts.format).toBe('prettier --write .')

    expect(app.devDependencies.eslint).toBeDefined()
    expect(app.devDependencies.prettier).toBeUndefined()
    expect(app.scripts.lint).toContain('eslint .')
    expect(app.scripts.lint).not.toContain('prettier')

    expect(hooks.devDependencies.husky).toBeDefined()
    expect(hooks.devDependencies.eslint).toBeUndefined()
    expect(hooks.scripts.prepare).toBe('husky')
    expect(hooks.scripts.lint).toBeUndefined()
  })
})
