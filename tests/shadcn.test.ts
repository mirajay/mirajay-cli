import { describe, it, expect } from 'vitest'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ensureShadcnTsconfig } from '../src/core/shadcn-tsconfig.js'

describe('ensureShadcnTsconfig', () => {
  it('creates tsconfig when missing', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-shadcn-tsconfig-'))

    try {
      await ensureShadcnTsconfig(targetDir)

      const tsconfig = JSON.parse(await readFile(join(targetDir, 'tsconfig.json'), 'utf-8'))
      expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['src/*'])
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })

  it('does not overwrite existing tsconfig', async () => {
    const targetDir = await mkdtemp(join(tmpdir(), 'mirajay-cli-shadcn-tsconfig-keep-'))

    try {
      const existing = { compilerOptions: { baseUrl: '.', paths: { '@/*': ['lib/*'] } } }
      await writeFile(join(targetDir, 'tsconfig.json'), JSON.stringify(existing))

      await ensureShadcnTsconfig(targetDir)

      const tsconfig = JSON.parse(await readFile(join(targetDir, 'tsconfig.json'), 'utf-8'))
      expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['lib/*'])
    } finally {
      await rm(targetDir, { recursive: true, force: true })
    }
  })
})
