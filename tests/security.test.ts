import { describe, it, expect } from 'vitest'
import {
  ALLOWED_UI_LIBRARIES,
  ALLOWED_FRAMEWORKS,
  ALLOWED_CSS_FRAMEWORKS,
  ALLOWED_MICRO_TOOLS,
} from '../src/types.js'

describe('security whitelist', () => {
  it('contains expected frameworks', () => {
    expect(ALLOWED_FRAMEWORKS.has('react')).toBe(true)
    expect(ALLOWED_FRAMEWORKS.has('vue')).toBe(true)
    expect(ALLOWED_FRAMEWORKS.has('angular')).toBe(false)
  })

  it('contains expected UI libraries', () => {
    expect(ALLOWED_UI_LIBRARIES.has('element-plus')).toBe(true)
    expect(ALLOWED_UI_LIBRARIES.has('antd')).toBe(true)
    expect(ALLOWED_UI_LIBRARIES.has('malicious-lib')).toBe(false)
  })

  it('contains expected CSS frameworks', () => {
    expect(ALLOWED_CSS_FRAMEWORKS.has('tailwindcss')).toBe(true)
    expect(ALLOWED_CSS_FRAMEWORKS.has('unocss')).toBe(true)
    expect(ALLOWED_CSS_FRAMEWORKS.has('none')).toBe(true)
  })

  it('contains expected micro frontend tools', () => {
    expect(ALLOWED_MICRO_TOOLS.has('module-federation')).toBe(true)
    expect(ALLOWED_MICRO_TOOLS.has('wujie')).toBe(true)
    expect(ALLOWED_MICRO_TOOLS.has('unknown')).toBe(false)
  })
})

describe('engineering preset whitelist', () => {
  it('contains expected presets', async () => {
    const { ALLOWED_ENGINEERING_PRESETS } = await import('../src/types.js')
    expect(ALLOWED_ENGINEERING_PRESETS.has('standard')).toBe(true)
    expect(ALLOWED_ENGINEERING_PRESETS.has('strict')).toBe(true)
    expect(ALLOWED_ENGINEERING_PRESETS.has('invalid')).toBe(false)
  })
})
