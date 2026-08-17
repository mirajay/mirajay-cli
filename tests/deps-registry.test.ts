import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  applyDepUpdates,
  buildNextRange,
  isOutdated,
  parseDepReferences,
  planDepUpdates,
  replaceDepRange,
} from '../src/core/deps-registry.js'

describe('deps-registry', () => {
  it('parses semver dependencies from json and ts manifest', () => {
    const json = `
      "dependencies": {
        "react": "^19.0.0",
        "vue": "~3.5.13"
      }
    `
    const ts = `const deps = { eslint: '^9.21.0', prettier: '^3.5.2' }`

    expect(parseDepReferences(json, 'pkg.json')).toEqual([
      expect.objectContaining({ packageName: 'react', fullRange: '^19.0.0', version: '19.0.0' }),
      expect.objectContaining({ packageName: 'vue', fullRange: '~3.5.13', version: '3.5.13' }),
    ])
    expect(parseDepReferences(ts, 'manifest.ts')).toEqual([
      expect.objectContaining({ packageName: 'eslint', fullRange: '^9.21.0' }),
      expect.objectContaining({ packageName: 'prettier', fullRange: '^3.5.2' }),
    ])
  })

  it('preserves version prefix when building next range', () => {
    expect(buildNextRange('^', '19.2.0')).toBe('^19.2.0')
    expect(buildNextRange('~', '5.8.0')).toBe('~5.8.0')
    expect(buildNextRange('', '2.0.0')).toBe('2.0.0')
  })

  it('replaces package ranges in file content', () => {
    const source = `"react": "^19.0.0",\n'eslint': '^9.21.0'`
    const updated = replaceDepRange(source, 'react', '^19.0.0', '^19.2.0')
    expect(updated).toContain('"react": "^19.2.0"')
    expect(updated).toContain("'eslint': '^9.21.0'")
  })

  it('detects outdated versions', () => {
    expect(isOutdated('19.0.0', '19.2.0')).toBe(true)
    expect(isOutdated('19.2.0', '19.2.0')).toBe(false)
  })

  it('plans and applies updates with mocked registry', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mirajay-deps-'))
    const templatesDir = join(root, 'templates', 'desktop-react')

    try {
      await mkdir(templatesDir, { recursive: true })
      await mkdir(join(root, 'src/core'), { recursive: true })

      await writeFile(
        join(templatesDir, 'package.json.ejs'),
        `{
  "dependencies": {
    "react": "^19.0.0"
  },
  "devDependencies": {
    "vite": "^6.2.0"
  }
}`,
        'utf-8',
      )

      await writeFile(
        join(root, 'src/core/engineering-manifest.ts'),
        `const deps = { eslint: '^9.21.0' }`,
        'utf-8',
      )

      const fetchLatest = async (name: string) => {
        if (name === 'react') return '19.2.0'
        if (name === 'vite') return '6.4.3'
        if (name === 'eslint') return '9.30.0'
        return null
      }

      const plan = await planDepUpdates({
        scaffoldRoot: root,
        fetchLatest,
      })

      expect(plan.updates.length).toBeGreaterThan(0)
      expect(plan.updates.some((item) => item.packageName === 'react')).toBe(true)

      await applyDepUpdates({ scaffoldRoot: root, updates: plan.updates })

      const pkg = await readFile(join(templatesDir, 'package.json.ejs'), 'utf-8')
      expect(pkg).toContain('"react": "^19.2.0"')
      expect(pkg).toContain('"vite": "^6.4.3"')

      const manifest = await readFile(join(root, 'src/core/engineering-manifest.ts'), 'utf-8')
      expect(manifest).toContain("eslint: '^9.30.0'")
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
