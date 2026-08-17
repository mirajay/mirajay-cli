import { describe, expect, it } from 'vitest'
import { getDevRunHint } from '../src/core/dev-hints.js'

describe('getDevRunHint', () => {
  it('returns dev + localhost for desktop vite templates', () => {
    const hint = getDevRunHint('desktop-react')
    expect(hint.script).toBe('dev')
    expect(hint.url).toBe('http://localhost:5173')
    expect(hint.previewScript).toBe('preview')
  })

  it('returns dev:h5 for taro', () => {
    const hint = getDevRunHint('mobile-taro')
    expect(hint.script).toBe('dev:h5')
    expect(hint.url).toBe('http://localhost:10086')
  })

  it('returns web for react-native expo', () => {
    const hint = getDevRunHint('mobile-rn')
    expect(hint.script).toBe('web')
  })
})
