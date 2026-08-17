import type { EngineeringOptions, EngineeringPreset, ProjectAnswers } from '../types.js'
import { PRESET_DEFINITIONS } from './engineering-manifest.js'

export const DEFAULT_ENGINEERING_STANDARD: EngineeringOptions = {
  preset: 'standard',
  ...PRESET_DEFINITIONS.standard,
}

export function resolveEngineeringOptions(answers: ProjectAnswers): EngineeringOptions {
  if (answers.engineering) {
    const { preset } = answers.engineering
    if (preset !== 'custom') {
      return { preset, ...PRESET_DEFINITIONS[preset] }
    }
    return answers.engineering
  }

  if (answers.needMarkdownlint !== undefined) {
    return {
      preset: 'custom',
      eslint: true,
      prettier: true,
      stylelint: false,
      markdownlint: answers.needMarkdownlint,
      spellcheck: false,
      vitest: true,
      commitlint: false,
      husky: false,
      lintStaged: false,
    }
  }

  return { ...DEFAULT_ENGINEERING_STANDARD }
}

export function hasAnyEngineering(options: EngineeringOptions): boolean {
  return (
    options.eslint ||
    options.prettier ||
    options.stylelint ||
    options.markdownlint ||
    options.spellcheck ||
    options.vitest ||
    options.commitlint ||
    options.husky ||
    options.lintStaged
  )
}

export function formatEngineeringSummary(options: EngineeringOptions): string[] {
  const items: string[] = []
  if (options.eslint) items.push('ESLint')
  if (options.prettier) items.push('Prettier')
  if (options.stylelint) items.push('Stylelint')
  if (options.markdownlint) items.push('markdownlint')
  if (options.spellcheck) items.push('cspell')
  if (options.vitest) items.push('Vitest')
  if (options.commitlint) items.push('commitlint')
  if (options.husky && options.lintStaged) items.push('husky + lint-staged')
  else if (options.husky) items.push('husky')
  return items
}

export function defaultStylelintForAnswers(answers: ProjectAnswers): boolean {
  if (answers.framework === 'vue') return true
  return answers.cssFramework === 'tailwindcss' || answers.cssFramework === 'unocss'
}

export function supportsJsEngineering(answers: ProjectAnswers): boolean {
  if (answers.mobilePlatform === 'flutter') return false
  return answers.framework === 'react' || answers.framework === 'vue'
}

export function createEngineeringFromPreset(
  preset: EngineeringPreset,
  custom?: Partial<Omit<EngineeringOptions, 'preset'>>,
): EngineeringOptions {
  if (preset === 'custom') {
    return {
      preset: 'custom',
      eslint: custom?.eslint ?? false,
      prettier: custom?.prettier ?? false,
      stylelint: custom?.stylelint ?? false,
      markdownlint: custom?.markdownlint ?? false,
      spellcheck: custom?.spellcheck ?? false,
      vitest: custom?.vitest ?? false,
      commitlint: custom?.commitlint ?? false,
      husky: custom?.husky ?? false,
      lintStaged: custom?.lintStaged ?? false,
    }
  }
  return { preset, ...PRESET_DEFINITIONS[preset] }
}
