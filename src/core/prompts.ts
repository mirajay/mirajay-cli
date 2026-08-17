import { select, confirm, input, checkbox } from '@inquirer/prompts'
import type { EngineeringPreset, ProjectAnswers } from '../types.js'
import { warn, info } from './logger.js'
import {
  createEngineeringFromPreset,
  defaultStylelintForAnswers,
  supportsJsEngineering,
} from './engineering.js'
import { supportsTypeScriptChoice } from './typescript-mode.js'

export async function runInitPrompts(
  projectName?: string,
): Promise<{ projectName: string; answers: ProjectAnswers }> {
  const name =
    projectName ||
    (await input({
      message: '项目名称',
      default: 'my-app',
      validate: (value) => {
        if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(value)) {
          return '项目名称只能包含字母、数字、连字符和下划线，且以字母开头'
        }
        return true
      },
    }))

  const projectType = await select<ProjectAnswers['projectType']>({
    message: '选择项目类型',
    choices: [
      { name: '桌面 Web 应用', value: 'desktop' },
      { name: '移动端应用', value: 'mobile' },
      { name: '微前端架构', value: 'micro-frontend' },
    ],
  })

  const answers: ProjectAnswers = { projectType }

  if (projectType === 'mobile') {
    answers.mobilePlatform = await select({
      message: '选择移动端平台',
      choices: [
        { name: 'H5 移动 Web', value: 'h5' },
        { name: '跨端框架（Taro）', value: 'taro' },
        { name: '跨端框架（uni-app）', value: 'uni-app' },
        { name: 'React Native', value: 'react-native' },
        { name: 'Flutter（原生跨端）', value: 'flutter' },
      ],
    })
  }

  if (projectType === 'micro-frontend') {
    answers.microFrontendTool = await select({
      message: '选择微前端方案',
      choices: [
        {
          name: 'Module Federation（推荐，构建时共享）',
          value: 'module-federation',
        },
        { name: '无界 wujie（多技术栈快速集成）', value: 'wujie' },
        { name: 'micro-app（低侵入嵌入）', value: 'micro-app' },
        {
          name: 'qiankun（遗留方案，仅用于存量维护）',
          value: 'qiankun',
        },
      ],
    })

    if (answers.microFrontendTool === 'qiankun') {
      warn('qiankun 为遗留方案，新项目建议使用 Module Federation 或 wujie')
    }

    if (answers.microFrontendTool === 'module-federation') {
      answers.microFrontendStackMode = await select({
        message: '选择 Module Federation 架构模式',
        choices: [
          {
            name: '同栈（推荐）- 主应用与子应用使用相同框架',
            value: 'same',
          },
          {
            name: '混合栈演示 - 主应用与子应用使用不同框架',
            value: 'mixed',
          },
        ],
      })

      if (answers.microFrontendStackMode === 'mixed') {
        info('混合栈用于演示跨技术栈集成；生产新项目建议优先同栈 Module Federation')
      }

      answers.framework = await select({
        message:
          answers.microFrontendStackMode === 'mixed'
            ? '选择主应用框架'
            : '选择主应用与子应用框架',
        choices: [
          { name: 'React', value: 'react' },
          { name: 'Vue', value: 'vue' },
        ],
      })

      if (answers.microFrontendStackMode === 'mixed') {
        answers.remoteFramework = answers.framework === 'react' ? 'vue' : 'react'
        info(
          `远程子应用将使用 ${answers.remoteFramework === 'react' ? 'React' : 'Vue'}（与主应用 ${answers.framework === 'react' ? 'React' : 'Vue'} 不同）`,
        )
      } else {
        answers.remoteFramework = answers.framework
      }
    } else {
      answers.framework = await select({
        message: '选择主应用框架',
        choices: [
          { name: 'React', value: 'react' },
          { name: 'Vue', value: 'vue' },
        ],
      })
    }
  } else if (answers.mobilePlatform === 'uni-app') {
    answers.framework = 'vue'
  } else if (answers.mobilePlatform !== 'flutter') {
    answers.framework = await select({
      message: '选择前端框架',
      choices: [
        { name: 'React', value: 'react' },
        { name: 'Vue', value: 'vue' },
      ],
    })
  }

  if (supportsTypeScriptChoice(answers)) {
    answers.useTypeScript = await confirm({
      message: '是否使用 TypeScript?',
      default: true,
    })
  } else {
    answers.useTypeScript = true
  }

  if (answers.mobilePlatform === 'flutter') {
    answers.flutterStateManagement = await select({
      message: '选择状态管理方案',
      choices: ['Provider', 'Riverpod', 'Bloc'],
    })

    answers.flutterTargetPlatforms = await checkbox({
      message: '选择目标平台',
      choices: [
        { name: 'iOS', value: 'iOS' },
        { name: 'Android', value: 'Android' },
        { name: 'Web', value: 'Web' },
        { name: 'Windows', value: 'Windows' },
        { name: 'macOS', value: 'macOS' },
        { name: 'Linux', value: 'Linux' },
      ],
      required: true,
    })

    answers.flutterMaterial3 = await confirm({
      message: '是否使用 Material Design 3?',
      default: true,
    })

    answers.flutterInternationalization = await confirm({
      message: '是否初始化国际化?',
      default: false,
    })
  } else if (answers.mobilePlatform === 'uni-app') {
    answers.framework = 'vue'
    answers.uiLibrary = '@dcloudio/uni-ui'
  } else if (projectType === 'micro-frontend') {
    answers.cssFramework = 'none'
  } else {
    answers.uiLibrary = await selectUiLibrary(answers)
  }

  if (answers.mobilePlatform !== 'flutter' && projectType !== 'micro-frontend') {
    answers.cssFramework = await select({
      message: '选择 CSS 框架（可与 UI 库配合）',
      choices: [
        { name: 'Tailwind CSS', value: 'tailwindcss' },
        { name: 'UnoCSS', value: 'unocss' },
        { name: 'CSS Modules / 原生方案', value: 'none' },
      ],
    })

    if (answers.uiLibrary === 'shadcn-ui' && answers.cssFramework !== 'tailwindcss') {
      warn('shadcn/ui 依赖 Tailwind CSS，已自动切换为 Tailwind')
      answers.cssFramework = 'tailwindcss'
    }

    if (answers.uiLibrary === 'shadcn-ui' && answers.useTypeScript === false) {
      info('shadcn/ui 将保留 tsconfig.json 与 TypeScript 工具链，供 CLI 解析 @/* 路径别名')
    }
  }

  if (projectType === 'micro-frontend') {
    if (answers.microFrontendTool === 'module-federation') {
      answers.useMonorepo = true
    } else {
      answers.useMonorepo = await confirm({
        message: '是否使用 Monorepo (Turborepo) 管理？',
        default: true,
      })
    }
  } else if (answers.mobilePlatform === 'taro') {
    answers.useMonorepo = await confirm({
      message: '是否使用 Monorepo (Turborepo) 管理？',
      default: false,
    })
  } else {
    answers.useMonorepo = await confirm({
      message: '是否使用 Monorepo (Turborepo) 管理？',
      default: projectType === 'desktop',
    })
  }

  answers.engineering = await promptEngineeringOptions(answers)

  answers.packageManager = await select({
    message: '选择包管理器',
    choices: [
      { name: 'pnpm（推荐）', value: 'pnpm' },
      { name: 'yarn', value: 'yarn' },
      { name: 'bun', value: 'bun' },
      { name: 'npm', value: 'npm' },
    ],
  })

  answers.initGit = await confirm({
    message: '是否初始化 Git 仓库?',
    default: true,
  })

  return { projectName: name, answers }
}

async function promptEngineeringOptions(answers: ProjectAnswers) {
  if (!supportsJsEngineering(answers)) {
    return createEngineeringFromPreset('minimal')
  }

  const preset = await select<EngineeringPreset>({
    message: '选择工程化预设',
    choices: [
      {
        name: 'Standard（推荐）- ESLint + Prettier + Stylelint + Vitest + commitlint + husky',
        value: 'standard',
      },
      { name: 'Minimal - 仅 ESLint + Prettier（初始化 Git 时自动启用提交规范）', value: 'minimal' },
      {
        name: 'Strict - Standard + cspell 拼写校验',
        value: 'strict',
      },
      { name: '自定义', value: 'custom' },
    ],
    default: 'standard',
  })

  if (preset !== 'custom') {
    return createEngineeringFromPreset(preset)
  }

  const stylelintDefault = defaultStylelintForAnswers(answers)
  const selected = await checkbox({
    message: '选择要启用的工程化工具',
    choices: [
      { name: 'ESLint', value: 'eslint', checked: true },
      { name: 'Prettier', value: 'prettier', checked: true },
      { name: 'Stylelint', value: 'stylelint', checked: stylelintDefault },
      { name: 'markdownlint', value: 'markdownlint', checked: true },
      { name: 'cspell 拼写校验', value: 'spellcheck', checked: false },
      { name: 'Vitest 单元测试', value: 'vitest', checked: true },
      { name: 'commitlint + cz-git 提交规范', value: 'commitlint', checked: false },
      { name: 'husky + lint-staged Git hooks', value: 'gitHooks', checked: false },
    ],
    required: true,
  })

  const gitHooks = selected.includes('gitHooks')

  return createEngineeringFromPreset('custom', {
    eslint: selected.includes('eslint'),
    prettier: selected.includes('prettier'),
    stylelint: selected.includes('stylelint'),
    markdownlint: selected.includes('markdownlint'),
    spellcheck: selected.includes('spellcheck'),
    vitest: selected.includes('vitest'),
    commitlint: selected.includes('commitlint') || gitHooks,
    husky: gitHooks,
    lintStaged: gitHooks,
  })
}

async function selectUiLibrary(answers: ProjectAnswers): Promise<string> {
  if (answers.projectType === 'mobile') {
    if (answers.framework === 'vue') {
      return select({
        message: '选择 UI 组件库',
        choices: [
          { name: 'Vant（移动端首选）', value: 'vant' },
          { name: 'NutUI（京东出品，Vue3）', value: '@nutui/nutui' },
        ],
      })
    }
    return select({
      message: '选择 UI 组件库',
      choices: [
        { name: 'Ant Design Mobile', value: 'antd-mobile' },
        { name: 'React Vant', value: 'react-vant' },
      ],
    })
  }

  if (answers.framework === 'vue') {
    return select({
      message: '选择 UI 组件库',
      choices: [
        { name: 'Element Plus', value: 'element-plus' },
        { name: 'Ant Design Vue', value: 'ant-design-vue' },
        { name: 'Naive UI', value: 'naive-ui' },
        { name: 'Vuetify', value: 'vuetify' },
        { name: 'PrimeVue', value: 'primevue' },
      ],
    })
  }

  return select({
    message: '选择 UI 组件库',
    choices: [
      { name: 'Ant Design', value: 'antd' },
      { name: 'MUI', value: '@mui/material' },
      { name: 'NextUI', value: '@nextui-org/react' },
      { name: 'shadcn/ui', value: 'shadcn-ui' },
      { name: 'Mantine', value: '@mantine/core' },
      { name: 'Chakra UI', value: '@chakra-ui/react' },
    ],
  })
}
