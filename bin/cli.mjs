#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '../dist/index.js')

try {
  await import(distPath)
} catch (error) {
  console.error('Failed to load CLI. Did you run `pnpm build`?')
  console.error(error)
  process.exit(1)
}
