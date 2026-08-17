import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const execaMock = vi.fn()

vi.mock('execa', () => ({
  execa: (...args: unknown[]) => execaMock(...args),
}))

vi.mock('node:fs/promises', () => ({
  access: vi.fn().mockRejectedValue(new Error('ENOENT')),
}))

describe('resolveFlutterSdk', () => {
  beforeEach(() => {
    execaMock.mockReset()
    delete process.env.FLUTTER_ROOT
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('detects flutter in PATH', async () => {
    execaMock.mockImplementation((cmd: string, args: string[]) => {
      if (cmd === 'flutter' && args[0] === '--version') {
        return Promise.resolve({ stdout: 'Flutter 3.32.0 • channel stable' })
      }
      return Promise.reject(new Error('not found'))
    })

    const { resolveFlutterSdk } = await import('../src/core/flutter-sdk.js')
    const sdk = await resolveFlutterSdk()

    expect(sdk).toEqual({ command: 'flutter', prefix: [] })
  })

  it('detects fvm flutter when flutter is not in PATH', async () => {
    execaMock.mockImplementation((cmd: string, args: string[]) => {
      if (cmd === 'flutter') return Promise.reject(new Error('not found'))
      if (cmd === 'fvm' && args[0] === 'flutter' && args[1] === '--version') {
        return Promise.resolve({ stdout: 'Flutter 3.32.0 • channel stable' })
      }
      return Promise.reject(new Error('not found'))
    })

    const { resolveFlutterSdk } = await import('../src/core/flutter-sdk.js')
    const sdk = await resolveFlutterSdk()

    expect(sdk).toEqual({ command: 'fvm', prefix: ['flutter'] })
  })

  it('returns null when no SDK is found', async () => {
    execaMock.mockRejectedValue(new Error('not found'))

    const { resolveFlutterSdk } = await import('../src/core/flutter-sdk.js')
    const sdk = await resolveFlutterSdk()

    expect(sdk).toBeNull()
  })
})
