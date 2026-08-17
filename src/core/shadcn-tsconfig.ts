import { access, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { warn } from './logger.js'

const SHADCN_TSCONFIG = {
  compilerOptions: {
    target: 'ESNext',
    module: 'ESNext',
    moduleResolution: 'bundler',
    jsx: 'react-jsx',
    strict: true,
    baseUrl: '.',
    paths: {
      '@/*': ['src/*'],
    },
    allowJs: true,
    noEmit: true,
    skipLibCheck: true,
  },
  include: ['src'],
}

/** shadcn CLI 依赖 tsconfig paths 解析 @/* 别名 */
export async function ensureShadcnTsconfig(targetDir: string): Promise<void> {
  const tsconfigPath = join(targetDir, 'tsconfig.json')
  try {
    await access(tsconfigPath)
    return
  } catch {
    await writeFile(tsconfigPath, `${JSON.stringify(SHADCN_TSCONFIG, null, 2)}\n`)
    warn('已自动生成 tsconfig.json（shadcn/ui 需要 @/* 路径别名）')
  }
}
