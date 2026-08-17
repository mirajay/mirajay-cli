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
})
