import type { ProjectAnswers } from '../types.js'

/** 是否展示 TypeScript 选项（Taro / uni-app / RN / Flutter 固定使用 TS 或原生语言） */
export function supportsTypeScriptChoice(answers: ProjectAnswers): boolean {
  if (answers.mobilePlatform === 'flutter') return false
  if (answers.mobilePlatform === 'taro') return false
  if (answers.mobilePlatform === 'uni-app') return false
  if (answers.mobilePlatform === 'react-native') return false
  return true
}

export function resolveUseTypeScript(answers: ProjectAnswers): boolean {
  if (!supportsTypeScriptChoice(answers)) return true
  return answers.useTypeScript !== false
}

/** 生成时将 .ts / .tsx 输出路径映射为 .js / .jsx */
export function applyJavaScriptExtension(path: string, useTypeScript: boolean): string {
  if (useTypeScript) return path
  if (path.endsWith('.tsx')) return `${path.slice(0, -4)}.jsx`
  if (path.endsWith('.ts')) return `${path.slice(0, -3)}.js`
  return path
}

export function isTypeScriptConfigPath(relativePath: string): boolean {
  const base = relativePath.split('/').pop() ?? relativePath
  if (base === 'tsconfig.json' || base === 'tsconfig.json.ejs') return true
  if (base.startsWith('tsconfig.') && base.endsWith('.json')) return true
  if (base.startsWith('tsconfig.') && base.endsWith('.json.ejs')) return true
  if (base.endsWith('env.d.ts') || base.endsWith('vite-env.d.ts')) return true
  return false
}
