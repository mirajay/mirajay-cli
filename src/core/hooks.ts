import { createHooks } from 'hookable'
import type { ProjectAnswers } from '../types.js'

export interface CliHooks {
  'init:before': (ctx: InitContext) => void | Promise<void>
  'init:after': (ctx: InitContext) => void | Promise<void>
  'init:prompts': (answers: Partial<ProjectAnswers>) => void | Promise<void>
  'template:before': (ctx: TemplateContext) => void | Promise<void>
  'template:after': (ctx: TemplateContext) => void | Promise<void>
  'lint:before': () => void | Promise<void>
  'lint:after': () => void | Promise<void>
  'build:before': () => void | Promise<void>
  'build:after': () => void | Promise<void>
}

export interface InitContext {
  projectName: string
  targetDir: string
  answers: ProjectAnswers
}

export interface TemplateContext {
  templateName: string
  targetDir: string
  answers: ProjectAnswers
}

export const hooks = createHooks<CliHooks>()

export function registerPlugin(plugin: {
  name: string
  setup?: (hooks: typeof hooks) => void | Promise<void>
}) {
  return plugin
}
