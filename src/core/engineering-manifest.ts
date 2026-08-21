import type { EngineeringOptions, EngineeringPreset } from '../types.js'
import type { EngineeringProfile } from './engineering-profile.js'
import { profileUsesVue } from './engineering-profile.js'

type PresetFlags = Omit<EngineeringOptions, 'preset'>

export const PRESET_DEFINITIONS: Record<Exclude<EngineeringPreset, 'custom'>, PresetFlags> = {
  minimal: {
    eslint: true,
    prettier: true,
    stylelint: false,
    markdownlint: false,
    spellcheck: false,
    vitest: false,
    commitlint: false,
    husky: false,
    lintStaged: false,
  },
  standard: {
    eslint: true,
    prettier: true,
    stylelint: true,
    markdownlint: true,
    spellcheck: false,
    vitest: true,
    commitlint: true,
    husky: true,
    lintStaged: true,
  },
  strict: {
    eslint: true,
    prettier: true,
    stylelint: true,
    markdownlint: true,
    spellcheck: true,
    vitest: true,
    commitlint: true,
    husky: true,
    lintStaged: true,
  },
}

export interface PackageManifestPatch {
  devDependencies: Record<string, string>
  scripts: Record<string, string>
  config?: Record<string, unknown>
}

const COMMITIZEN_CONFIG = {
  commitizen: {
    path: 'node_modules/cz-git',
  },
}

const ESLINT_REACT_DEPS: Record<string, string> = {
  eslint: '^9.21.0',
  '@eslint/js': '^9.21.0',
  'typescript-eslint': '^8.25.0',
  'eslint-plugin-react-hooks': '^5.2.0',
  'eslint-plugin-react-refresh': '^0.4.19',
  globals: '^16.0.0',
}

const ESLINT_VUE_DEPS: Record<string, string> = {
  eslint: '^9.21.0',
  '@eslint/js': '^9.21.0',
  'typescript-eslint': '^8.25.0',
  'eslint-plugin-vue': '^9.32.0',
  globals: '^16.0.0',
}

const PRETTIER_DEPS: Record<string, string> = {
  prettier: '^3.5.2',
}

const STYLELINT_REACT_DEPS: Record<string, string> = {
  stylelint: '^16.14.1',
  'stylelint-config-standard': '^37.0.0',
}

const STYLELINT_VUE_DEPS: Record<string, string> = {
  stylelint: '^16.14.1',
  'stylelint-config-standard': '^37.0.0',
  'stylelint-config-standard-vue': '^1.0.0',
  'postcss-html': '^1.7.0',
}

const MARKDOWNLINT_DEPS: Record<string, string> = {
  'markdownlint-cli': '^0.44.0',
}

const CSPELL_DEPS: Record<string, string> = {
  cspell: '^8.17.5',
}

const VITEST_REACT_DEPS: Record<string, string> = {
  vitest: '^3.0.8',
  '@vitejs/plugin-react': '^4.3.4',
  '@testing-library/react': '^16.2.0',
  '@testing-library/jest-dom': '^6.6.3',
  jsdom: '^26.0.0',
}

const VITEST_VUE_DEPS: Record<string, string> = {
  vitest: '^3.0.8',
  '@vue/test-utils': '^2.4.6',
  jsdom: '^26.0.0',
}

const COMMITLINT_DEPS: Record<string, string> = {
  '@commitlint/cli': '^19.8.0',
  '@commitlint/config-conventional': '^19.8.0',
  'cz-git': '^1.11.1',
}

const HUSKY_DEPS: Record<string, string> = {
  husky: '^9.1.7',
}

const LINT_STAGED_DEPS: Record<string, string> = {
  'lint-staged': '^15.4.3',
}

const ESLINT_REACT_NATIVE_DEPS: Record<string, string> = {
  eslint: '^9.21.0',
  '@eslint/js': '^9.21.0',
  'typescript-eslint': '^8.25.0',
  'eslint-plugin-react': '^7.37.4',
  'eslint-plugin-react-hooks': '^5.2.0',
  'eslint-plugin-react-native': '^5.0.0',
  globals: '^16.0.0',
}

function getEslintDeps(profile: EngineeringProfile): Record<string, string> {
  switch (profile) {
    case 'vue':
      return ESLINT_VUE_DEPS
    case 'taro-react':
      return ESLINT_REACT_DEPS
    case 'taro-vue':
      return ESLINT_VUE_DEPS
    case 'uni-app':
      return ESLINT_VUE_DEPS
    case 'react-native':
      return ESLINT_REACT_NATIVE_DEPS
    default:
      return ESLINT_REACT_DEPS
  }
}

function getStylelintDeps(profile: EngineeringProfile): Record<string, string> {
  if (profileUsesVue(profile)) {
    return STYLELINT_VUE_DEPS
  }
  return STYLELINT_REACT_DEPS
}

function getVitestDeps(profile: EngineeringProfile): Record<string, string> {
  if (profileUsesVue(profile)) {
    return VITEST_VUE_DEPS
  }
  return VITEST_REACT_DEPS
}

function getStylelintGlob(profile: EngineeringProfile): string {
  if (profileUsesVue(profile)) {
    return '**/*.{css,scss,vue}'
  }
  return '**/*.{css,scss}'
}

export type EngineeringManifestScope = 'all' | 'shared' | 'app' | 'hooks'

export function getEngineeringManifest(options: {
  profile: EngineeringProfile
  engineering: EngineeringOptions
  useTypeScript?: boolean
  includeGitHooks?: boolean
  /** all=扁平全量；shared=根共享工具；app=子包框架工具；hooks=仅 Git hooks */
  scope?: EngineeringManifestScope
}): PackageManifestPatch {
  const {
    profile,
    engineering,
    useTypeScript = true,
    includeGitHooks = true,
    scope = 'all',
  } = options
  const wantShared = scope === 'all' || scope === 'shared'
  const wantApp = scope === 'all' || scope === 'app'
  const wantHooks = scope === 'hooks' || (scope === 'all' && includeGitHooks)
  /** Monorepo 根保留 turbo lint，shared 只挂 format / lint:md 等，不写组合 lint */
  const omitCombinedLint = scope === 'shared' || scope === 'hooks'

  const devDependencies: Record<string, string> = {}
  const scripts: Record<string, string> = {}
  const lintParts: string[] = []

  if (wantApp && engineering.eslint) {
    const eslintDeps = { ...getEslintDeps(profile) }
    if (!useTypeScript) {
      delete eslintDeps['typescript-eslint']
    }
    Object.assign(devDependencies, eslintDeps)
    scripts['lint:eslint'] = 'eslint .'
    lintParts.push('eslint .')
  }

  if (wantShared && engineering.prettier) {
    Object.assign(devDependencies, PRETTIER_DEPS)
    scripts['format'] = 'prettier --write .'
    scripts['format:check'] = 'prettier --check .'
    if (!omitCombinedLint) {
      lintParts.unshift('prettier --write .')
    }
  }

  if (wantApp && engineering.stylelint) {
    Object.assign(devDependencies, getStylelintDeps(profile))
    const stylelintGlob = getStylelintGlob(profile)
    scripts['lint:style'] = `stylelint "${stylelintGlob}" --allow-empty-input`
    lintParts.push(`stylelint "${stylelintGlob}" --allow-empty-input`)
  }

  if (wantShared && engineering.markdownlint) {
    Object.assign(devDependencies, MARKDOWNLINT_DEPS)
    scripts['lint:md'] = 'markdownlint "**/*.md"'
    if (!omitCombinedLint) {
      lintParts.push('markdownlint "**/*.md"')
    }
  }

  if (wantShared && engineering.spellcheck) {
    Object.assign(devDependencies, CSPELL_DEPS)
    const spellGlob = useTypeScript
      ? 'cspell "**/*.{ts,tsx,vue,md,json}"'
      : 'cspell "**/*.{js,jsx,vue,md,json}"'
    scripts['lint:spell'] = spellGlob
    if (!omitCombinedLint) {
      lintParts.push(spellGlob)
    }
  }

  if (wantApp && engineering.vitest) {
    Object.assign(devDependencies, getVitestDeps(profile))
    scripts.test = 'vitest run'
    scripts['test:watch'] = 'vitest'
  }

  if (wantHooks && engineering.commitlint) {
    Object.assign(devDependencies, COMMITLINT_DEPS)
    scripts.commit = 'cz'
  }

  if (wantHooks && engineering.husky) {
    Object.assign(devDependencies, HUSKY_DEPS)
    scripts.prepare = 'husky'
  }

  if (wantHooks && engineering.lintStaged) {
    Object.assign(devDependencies, LINT_STAGED_DEPS)
  }

  if (!omitCombinedLint && lintParts.length > 0) {
    scripts.lint = lintParts.join(' && ')
  }

  const patch: PackageManifestPatch = { devDependencies, scripts }

  if (wantHooks && engineering.commitlint) {
    patch.config = COMMITIZEN_CONFIG
  }

  return patch
}
