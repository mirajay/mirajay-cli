# 从零到企业级：mirajay-cli 脚手架的架构设计与实现

> 本文以 `mirajay-cli` 项目为例，深入剖析一个企业级前端脚手架的架构设计思路、核心模块实现以及工程化最佳实践。适合想要构建自己的 CLI 工具、或对脚手架内部原理感兴趣的开发者阅读。

## 一、为什么需要自建脚手架？

当团队规模扩大、项目数量增多时，每个新项目都要经历相同的前置工作：选型、配置 ESLint / Prettier / Stylelint、搭 Monorepo、配 CI/CD……这些重复劳动不仅耗时，而且难以保持一致性。

一个成熟的企业级脚手架需要解决三个核心问题：

1. **标准化** — 所有项目共享统一的工程化配置，降低协作摩擦
2. **全场景覆盖** — 桌面 Web、移动端、微前端，一个工具搞定
3. **可扩展** — 插件体系让团队能定制流程，而不是 fork 整个仓库

`mirajay-cli` 正是为此而生。

---

## 二、整体架构概览

`mirajay-cli` 基于 **unjs 生态** 构建，技术选型一览：

| 能力 | 技术方案 | 说明 |
|------|---------|------|
| CLI 框架 | `citty` | unjs 出品，轻量、类型安全的命令定义 |
| 交互式问答 | `@inquirer/prompts` | 支持 select / input / confirm / checkbox |
| 终端美化 | `consola` + `picocolors` | 结构化日志 + 彩色输出 |
| 配置加载 | `c12` | 支持 `.clirc.ts` / `.clirc.json` 等多格式 |
| 模板引擎 | `ejs` | 动态生成项目文件，支持条件过滤 |
| 远程模板 | `giget` | 从 GitHub / GitLab 拉取模板 |
| 插件体系 | `hookable` | 生命周期钩子，支持插件扩展 |
| 进程执行 | `execa` | Promise 化的子进程调用 |
| 构建工具 | `tsup` | 基于 esbuild，极速打包 TypeScript |
| 测试框架 | `vitest` | 与 Vite 生态无缝集成 |

### 架构分层图

```
┌─────────────────────────────────────────────────────────────┐
│                      bin/cli.mjs (入口)                      │
│                    动态 import dist/index.js                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │    src/index.ts (主入口)  │
              │    citty runMain(main)   │
              └────────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐ ┌───────▼───────┐
│  Commands    │  │     Core        │  │   Templates   │
│  (命令层)     │  │   (核心引擎)     │  │  (模板层)      │
│              │  │                  │  │               │
│ • init       │  │ • template.ts    │  │ • desktop-*   │
│ • lint       │  │ • prompts.ts     │  │ • mobile-*    │
│ • build      │  │ • hooks.ts       │  │ • micro-*     │
│ • doctor     │  │ • engineering.ts │  │ • monorepo    │
│ • commit     │  │ • config.ts      │  │ • engineering │
│ • deploy     │  │ • utils.ts       │  │   -base       │
│ • upgrade    │  │ • logger.ts      │  │ • git-base    │
│ • test       │  │ • remote-*.ts    │  │               │
│ • update-deps│  │ • monorepo-*.ts  │  │               │
│              │  │ • shadcn.ts      │  │               │
└──────────────┘  └──────────────────┘  └───────────────┘
```

设计上有三个关键分层：

- **命令层** (`src/commands/`)：每个命令一个文件，用 `defineCommand` 定义，职责单一
- **核心引擎层** (`src/core/`)：模板渲染、交互问答、钩子系统、工程化配置等核心逻辑
- **模板层** (`templates/`)：20 套项目模板 + 共享工程化模板，EJS 动态渲染

---

## 三、核心流程：从 `mirajay-cli create` 到项目就绪

当用户执行 `mirajay-cli create my-app` 时，整个流程如下：

```
用户执行 create 命令
        │
        ▼
┌───────────────────┐
│  1. 加载 CLI 配置   │  c12 加载 .clirc.ts
│  (loadCliConfig)  │  合并默认配置
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  2. 交互式问答     │  @inquirer/prompts
│  (runInitPrompts) │  项目类型 → 框架 → UI库 → CSS → 工程化预设
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  3. 校验用户输入   │  白名单校验 (ALLOWED_*)
│  (validateAnswers)│  防止非法参数注入
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  4. 触发前置钩子   │  hooks.callHook('init:before')
│  (init:before)    │  插件可在此注入逻辑
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  5. 解析模板名称   │  resolveTemplateName()
│                   │  根据 answers 映射到 templates/ 下的目录
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  6. 生成项目文件   │  generateProject()
│                   │  ├─ 渲染业务模板 (EJS)
│                   │  ├─ 配置 Monorepo 布局
│                   │  ├─ 合并工程化配置 (engineering-base)
│                   │  ├─ 合并 Git Hooks (commitlint/husky)
│                   │  └─ 生成 .gitignore
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  7. 初始化 Git     │  git init + 首次提交
│  (initGitRepo)    │  自动配置 user.name / user.email
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  8. 安装依赖       │  execa 调用 pnpm/yarn/npm install
│(installDependencies)│ Flutter 项目走 flutter pub get
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│  9. 配置 Git Hooks │  husky init + pre-commit + commit-msg
│  (setupGitHooks)  │  仅当 engineering.husky 为 true
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ 10. shadcn 组件    │  npx shadcn@latest add input label separator
│  (可选)            │  仅当 uiLibrary === 'shadcn-ui'
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ 11. 触发后置钩子   │  hooks.callHook('init:after')
│  (init:after)     │  插件可在此注入逻辑
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ 12. 输出下一步指引 │  printNextSteps()
│                   │  cd my-app → pnpm dev → 浏览器访问
└───────────────────┘
```

---

## 四、核心模块深度解析

### 4.1 交互式问答系统 (`prompts.ts`)

问答系统是脚手架与用户的第一个触点。`mirajay-cli` 采用**条件分支式问答**：根据用户的前置选择，动态决定后续问题。

```
项目类型选择
    │
    ├─── 桌面 Web ──→ 框架(React/Vue) ──→ UI库 ──→ CSS方案 ──→ 工程化预设
    │
    ├─── 移动端 ──→ 平台选择
    │                ├── H5 ──→ 框架 ──→ UI库 ──→ CSS方案
    │                ├── Taro ──→ 框架 ──→ CSS方案
    │                ├── uni-app ─→ (自动 Vue + uni-ui)
    │                ├── RN ──→ (自动 TypeScript)
    │                └── Flutter ─→ 状态管理 ─→ 目标平台 ─→ Material3 ─→ 国际化
    │
    └─── 微前端 ──→ 方案选择
                     ├── Module Federation ──→ 同栈/混合栈 ──→ 框架
                     ├── wujie ──→ 框架
                     ├── micro-app ──→ 框架
                     └── qiankun ──→ 框架 (标记为遗留)
                                        │
                                        ▼
                               工程化预设 ──→ 包管理器 ──→ Git初始化
```

关键设计点：

- **白名单校验**：所有用户输入在 `validateAnswers` 中通过 `ALLOWED_*` 集合校验，防止注入
- **智能默认值**：如 `useMonorepo` 在桌面项目默认 `true`，微前端 Module Federation 强制 `true`
- **联动逻辑**：选择 `shadcn-ui` 时自动切换 CSS 为 Tailwind；选择 `qiankun` 时给出遗留警告

### 4.2 模板引擎 (`template.ts`)

模板引擎是脚手架的核心，负责将 `templates/` 目录下的 EJS 模板渲染为实际项目文件。

#### 模板解析流程

```
resolveTemplateName(answers)
        │
        ▼
┌───────────────────────┐
│ answers.projectType   │
│ + framework           │
│ + mobilePlatform      │
│ + microFrontendTool   │
└───────────┬───────────┘
            │
            ▼
    匹配 templates/ 下的目录名
    如: desktop-vue / mobile-taro / micro-wujie-react
```

#### 文件渲染管线

```
collectFiles(templateDir)          递归收集模板目录下所有文件
        │
        ▼
shouldSkipFile(file, answers)      条件过滤：CSS方案、UI库、TypeScript 等
        │                           如: 非 Tailwind 项目跳过 tailwind.config
        ▼
shouldSkipEngineeringFile(...)     工程化过滤：ESLint profile、Vitest、Stylelint 等
        │                           如: Vue 项目跳过 eslint.react.config
        ▼
getOutputFilename(file, answers)   文件名映射
        │                           .ejs 后缀剥离 + TS/JS 扩展名切换
        ▼
shouldRenderFile(file)             判断是否需要 EJS 渲染
        │
        ├── 是 ──→ renderFile()     EJS 渲染，注入 RenderContext
        │           │               禁用 HTML 转义（避免 && 变 &amp;&amp;）
        │           ▼
        │         writeFile()
        │
        └── 否 ──→ copyFile()       原样复制（如图片、二进制文件）
```

#### RenderContext 注入

EJS 模板渲染时注入的上下文对象：

```typescript
interface RenderContext extends ProjectAnswers {
  projectName: string        // 项目名称
  year: number               // 当前年份（用于 LICENSE）
  engineering: EngineeringOptions  // 工程化配置
  useTypeScript: boolean     // 是否使用 TypeScript
  readmeCommandsSection: string    // README 命令段
  readmeStructureSection: string   // README 结构段
  sharedPackageName: string       // Monorepo 共享包名
  engineeringAppPath: string      // 主应用相对路径：apps/web | apps/host | .
  // ... 以及所有 ProjectAnswers 字段
}
```

工作区工程化按 `fileScope: 'shared' | 'app'` 分别渲染到根与主应用；`getEngineeringManifest({ scope })` 同步拆分依赖。详见 [changelog 1.1.0](./changelog.md)。

### 4.3 工程化配置体系

这是 `mirajay-cli` 最有设计感的部分。它不是简单地把配置文件复制过去，而是构建了一套**预设 → Profile → Manifest → 合并**的四层体系。

```
┌─────────────────────────────────────────────────────────┐
│                    EngineeringPreset                     │
│          (用户选择的工程化预设级别)                        │
│                                                         │
│   minimal    standard     strict      custom            │
│   ESLint     ESLint       ESLint      自由组合            │
│   Prettier   Prettier     Prettier                      │
│              Stylelint    Stylelint                     │
│              markdownlint markdownlint                   │
│              Vitest       Vitest                        │
│              commitlint   cspell                        │
│              husky        commitlint                    │
│              lint-staged  husky                         │
│                          lint-staged                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  EngineeringProfile                     │
│           (根据技术栈解析的工程化画像)                     │
│                                                         │
│   react       vue       taro-react   taro-vue          │
│   uni-app     react-native                             │
│                                                         │
│   决定使用哪套 ESLint 配置、哪套 Vitest 配置等             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               getEngineeringManifest()                  │
│         (生成 devDependencies + scripts)                │
│                                                         │
│   根据 preset + profile 生成精确的依赖清单和 npm scripts  │
│   如: vue profile → eslint-plugin-vue                   │
│       react profile → eslint-plugin-react-hooks         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               mergePackageManifest()                    │
│         (合并到目标项目的 package.json)                   │
│                                                         │
│   读取 package.json → 合并 devDependencies/scripts      │
│   → 写回文件                                            │
└─────────────────────────────────────────────────────────┘
```

这种分层设计的好处：

1. **预设层**让用户不需要理解每个工具的细节，选一个级别即可
2. **Profile 层**自动适配技术栈差异，Vue 项目不会装 React 的 ESLint 插件
3. **Manifest 层**集中管理版本号，避免模板中散落的硬编码版本
4. **合并层**保证工程化配置可以叠加到任何业务模板上，而不需要每个模板都自带

### 4.4 插件与钩子系统 (`hooks.ts`)

基于 `hookable` 实现的生命周期钩子，让脚手架具备可扩展性。

```typescript
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
```

钩子触发时机：

```
init:before ──→ (用户问答完成、校验通过后)
    │
    init:prompts ──→ (answers 对象构建完成后)
    │
    template:before ──→ (模板渲染开始前)
    │
    template:after ──→ (模板渲染完成后)
    │
init:after ──→ (所有初始化步骤完成后)
```

插件注册示例：

```typescript
import { registerPlugin, hooks } from 'mirajay-cli'

registerPlugin({
  name: 'my-plugin',
  setup(hooks) {
    hooks.hook('init:after', async (ctx) => {
      // 在项目创建后自动注入自定义配置
      await addCustomConfig(ctx.targetDir)
    })
  },
})
```

### 4.5 远程模板系统 (`remote-templates.ts`)

通过 `giget` 支持从 GitHub / GitLab 等远程仓库拉取模板，实现模板与 CLI 解耦。

```
模板来源优先级
    │
    ├── 1. --from 参数 (最高优先级)
    │   mirajay-cli create app --from gh:org/repo/templates/desktop-react
    │
    ├── 2. .clirc.ts 中的 remoteTemplates 映射
    │   { 'desktop-react': 'gh:org/repo/templates/desktop-react' }
    │
    └── 3. 本地 templates/ 目录 (默认)
```

远程模板会被缓存到 `~/.cache/mirajay-cli/templates/<hash>` 目录，使用 SHA-256 哈希避免冲突。安全方面，`validateRemoteTemplateSource` 会对来源字符串做正则校验，拒绝包含 `;` `&` `|` `` ` `` `$` 等危险字符的输入。

### 4.6 Monorepo 布局 (`monorepo-layout.ts`)

当用户选择 Monorepo 时，项目结构会从扁平布局转换为 Turborepo 布局：

```
扁平布局 (useMonorepo: false)        Monorepo 布局 (workspace)
                                      my-app/
my-app/                               ├── turbo.json
├── package.json                      ├── pnpm-workspace.yaml
├── vite.config.ts                    ├── package.json (root: shared lint tools + hooks)
├── eslint.config.js                  ├── prettier.config.mjs
├── prettier.config.mjs               ├── apps/
├── src/                              │   └── web/   (MF 则为 host/)
│   ├── App.tsx                       │       ├── package.json (eslint/stylelint/vitest)
│   └── ...                           │       ├── eslint.config.js
└── ...                               │       └── src/
                                      └── packages/
                                          └── shared/
```

`finalizeMonorepoLayout` 负责渲染 `monorepo-base` 模板（turbo.json、pnpm-workspace.yaml 等）到根目录，同时将业务模板渲染到 `apps/web/` 子目录。微前端项目（`micro-*` 模板）跳过 Monorepo 布局，因为它们自带多 app 结构。

### 4.7 配置系统 (`config.ts`)

使用 `c12` 实现分层配置加载：

```
配置加载优先级 (从低到高)
    │
    ├── DEFAULT_CONFIG (内置默认值)
    │   { defaultPackageManager: 'pnpm',
    │     defaultEngineeringPreset: 'standard' }
    │
    └── .clirc.ts / .clirc.json (用户自定义)
        { templatesDir: './custom-templates',
          remoteTemplates: { ... } }
```

---

## 五、模板矩阵：全场景覆盖

`mirajay-cli` 内置 20 套模板，覆盖三大场景：

```
templates/
│
├── 桌面 Web (2套)
│   ├── desktop-react/     React 19 + Vite + Ant Design / MUI / shadcn/ui ...
│   └── desktop-vue/       Vue 3 + Vite + Element Plus / Ant Design Vue ...
│
├── 移动端 (6套)
│   ├── mobile-h5-react/   React + antd-mobile
│   ├── mobile-h5-vue/     Vue + Vant
│   ├── mobile-taro/       Taro (React/Vue 双栈)
│   ├── mobile-uni-app/    uni-app (Vue)
│   ├── mobile-rn/         React Native (Expo Router)
│   └── mobile-flutter/    Flutter (Provider/Riverpod/Bloc)
│
├── 微前端 (9套)
│   ├── micro-module-federation-react/         MF 同栈 React
│   ├── micro-module-federation-vue/           MF 同栈 Vue
│   ├── micro-module-federation-mixed-react-vue/  MF 混合栈 (主 React + 子 Vue)
│   ├── micro-module-federation-mixed-vue-react/  MF 混合栈 (主 Vue + 子 React)
│   ├── micro-wujie-react/                     无界 wujie React
│   ├── micro-wujie-vue/                       无界 wujie Vue
│   ├── micro-micro-app-react/                 micro-app React
│   ├── micro-micro-app-vue/                   micro-app Vue
│   ├── micro-qiankun-react/                   qiankun React (遗留)
│   └── micro-qiankun-vue/                     qiankun Vue (遗留)
│
└── 共享层 (3套)
    ├── engineering-base/   工程化配置 (ESLint/Prettier/Stylelint/Vitest/...)
    ├── monorepo-base/      Monorepo 根配置 (turbo.json/pnpm-workspace.yaml)
    └── git-base/           Git 基础文件 (.gitignore)
```

### 模板匹配逻辑

`resolveTemplateName` 是模板路由的核心函数，它根据用户的问答结果映射到对应的模板目录：

```typescript
function resolveTemplateName(answers: ProjectAnswers): string {
  // 桌面：按框架二选一
  if (projectType === 'desktop')
    return framework === 'vue' ? 'desktop-vue' : 'desktop-react'

  // 移动端：按平台 + 框架
  if (projectType === 'mobile')
    switch (mobilePlatform) {
      case 'h5':       return framework === 'vue' ? 'mobile-h5-vue' : 'mobile-h5-react'
      case 'taro':     return 'mobile-taro'
      case 'uni-app':  return 'mobile-uni-app'
      case 'react-native': return 'mobile-rn'
      case 'flutter':  return 'mobile-flutter'
    }

  // 微前端：按方案 + 框架 + 栈模式
  if (projectType === 'micro-frontend')
    return resolveMicroFrontendTemplateName(microFrontendTool, answers)
}
```

---

## 六、工程化预设详解

### 预设对比

| 特性 | Minimal | Standard | Strict | Custom |
|------|:-------:|:--------:|:------:|:------:|
| ESLint | ✅ | ✅ | ✅ | 可选 |
| Prettier | ✅ | ✅ | ✅ | 可选 |
| Stylelint | ❌ | ✅ | ✅ | 可选 |
| markdownlint | ❌ | ✅ | ✅ | 可选 |
| cspell 拼写校验 | ❌ | ❌ | ✅ | 可选 |
| Vitest | ❌ | ✅ | ✅ | 可选 |
| commitlint | ❌* | ✅ | ✅ | 可选 |
| husky + lint-staged | ❌* | ✅ | ✅ | 可选 |

> *Minimal 预设在用户选择初始化 Git 时，会自动启用 commitlint + husky + lint-staged（见 `applyGitHooksForInitGit`）。

### Profile 驱动的差异化配置

同一个预设，不同技术栈会得到不同的依赖清单：

```
Standard 预设
    │
    ├── Profile: react
    │   ESLint: eslint-plugin-react-hooks, eslint-plugin-react-refresh
    │   Vitest: @testing-library/react, @testing-library/jest-dom
    │   Stylelint: stylelint-config-standard
    │
    ├── Profile: vue
    │   ESLint: eslint-plugin-vue
    │   Vitest: @vue/test-utils
    │   Stylelint: stylelint-config-standard-vue + postcss-html
    │
    ├── Profile: taro-react
    │   ESLint: 同 react（但配置文件不同）
    │
    ├── Profile: react-native
    │   ESLint: eslint-plugin-react-native (额外)
    │
    └── Profile: flutter
        └── 返回 null → 不注入任何 JS 工程化配置
```

---

## 七、安全设计

作为脚手架，安全性容易被忽视。`mirajay-cli` 在几个关键点做了防护：

### 7.1 输入校验

```typescript
// 项目名称校验
validate: (value) => {
  if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(value))
    return '项目名称只能包含字母、数字、连字符和下划线，且以字母开头'
  return true
}

// 白名单校验
if (answers.framework && !ALLOWED_FRAMEWORKS.has(answers.framework))
  throw new Error(`Invalid framework: ${answers.framework}`)
```

### 7.2 远程模板来源校验

```typescript
const REMOTE_SOURCE_PATTERN = /^(gh:|gitlab:|bitbucket:|git:|https?:\/\/|file:\/\/)/

export function validateRemoteTemplateSource(source: string): void {
  if (!REMOTE_SOURCE_PATTERN.test(source.trim()))
    throw new Error(`Invalid remote template source: ${source}`)
  // 拒绝命令注入字符
  if (/[;&|`$]/.test(source.trim()))
    throw new Error('Remote template source contains invalid characters')
}
```

### 7.3 文件过滤

`shouldSkipFile` 和 `shouldSkipEngineeringFile` 确保只有符合条件的文件才会被渲染和输出，避免将不相关的配置文件（如 Flutter 项目中的 `vite.config.ts`）写入目标目录。

---

## 八、依赖版本管理 (`update-deps` 命令)

脚手架维护者面临一个独特痛点：模板中的 `package.json` 依赖版本会过时。`mirajay-cli` 提供了 `update-deps` 命令来一键同步：

```
mirajay-cli update-deps
        │
        ▼
┌─────────────────────────────┐
│ 1. 扫描 templates/**/        │
│    package.json(.ejs)        │
│    + engineering-manifest.ts │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 2. 从 npm registry 查询      │
│    每个包的最新版本           │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 3. 保留原有 ^ / ~ 前缀       │
│    只替换版本号              │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ 4. 写入更新 (或 --dry-run    │
│    仅预览 / --check 供 CI)   │
└─────────────────────────────┘
```

支持的场景：
- `--dry-run`：预览可更新项，不写文件
- `--check`：有可更新依赖时退出码为 1，供 CI 检测
- `-p react -p vite`：仅更新指定包
- `--include-cli`：同时更新 CLI 自身的 package.json

---

## 九、测试策略

项目使用 Vitest 编写测试，测试文件覆盖核心模块：

```
tests/
├── template.test.ts              模板解析与渲染
├── engineering.test.ts           工程化预设逻辑
├── engineering-manifest.test.ts  依赖清单生成
├── generate.test.ts              项目生成全流程
├── scaffold-matrix.test.ts       模板矩阵覆盖测试
├── micro-frontend.test.ts        微前端模板
├── monorepo-engineering.test.ts  Monorepo 工程化
├── shadcn.test.ts                shadcn/ui 集成
├── typescript-mode.test.ts       TS/JS 模式切换
├── dev-hints.test.ts             开发提示
├── flutter-sdk.test.ts           Flutter SDK 检测
├── deps-registry.test.ts         依赖版本管理
├── ui-coverage.test.ts           UI 库覆盖
├── security.test.ts              安全校验
├── helpers/scaffold-matrix.ts    测试辅助工具
├── p2.test.ts                    P2 级测试
└── p3.test.ts                    P3 级测试
```

---

## 十、构建与发布

### 构建配置 (`tsup.config.ts`)

```typescript
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],        // 纯 ESM 输出
  dts: true,              // 生成类型声明
  clean: true,            // 每次构建清理 dist
  sourcemap: true,        // 生成 source map
  target: 'node24',       // 目标 Node.js 24
  splitting: false,       // 不做代码分割（CLI 场景不需要）
  shims: false,           // 不注入 process 等 shim
})
```

### 发布产物

`package.json` 中 `files` 字段精确控制发布内容：

```json
{
  "files": ["bin", "dist", "templates"]
}
```

只发布运行时必需的三个目录，`src/`、`tests/`、`docs/` 等不会进入 npm 包。

### 入口引导

`bin/cli.mjs` 是一个轻量入口，动态 `import` 编译后的 `dist/index.js`：

```javascript
const distPath = join(__dirname, '../dist/index.js')
try {
  await import(distPath)
} catch (error) {
  console.error('Failed to load CLI. Did you run `pnpm build`?')
  process.exit(1)
}
```

这种设计让开发时可以 `pnpm dev`（tsup watch 模式）实时调试，发布时则使用编译后的产物。

---

## 十一、设计哲学与经验总结

### 1. 选择 unjs 生态的理由

`mirajay-cli` 大量使用 unjs 生态的库（citty、consola、giget、c12、hookable、picocolors）。这些库的共同特点是：**轻量、零依赖、ESM-first、TypeScript 原生支持**。相比之下，commander 体积更大、inquirer 的 API 不够现代。unjs 生态让整个 CLI 的 `node_modules` 保持精简。

### 2. 模板与引擎分离

业务模板 (`desktop-react` 等) 和工程化模板 (`engineering-base`) 是分开的。这意味着：

- 新增一个 UI 库只需要改业务模板，不影响工程化配置
- 升级 ESLint 配置只需要改 `engineering-base`，所有项目自动受益
- 工程化配置可以叠加到任何业务模板上

### 3. Profile 抽象的价值

`EngineeringProfile` 是一个关键的抽象层。它将 "React 桌面项目" 和 "React Native 项目" 的共性（都用 React ESLint）和差异（RN 需要额外的 eslint-plugin-react-native）统一管理。新增一个跨端框架时，只需要新增一个 Profile，而不需要修改每个模板。

### 4. 渐进式复杂度

用户可以选择：
- `mirajay-cli create my-app -y` → 一键默认，零认知负担
- 交互式问答 → 逐步选择，适合首次使用
- `.clirc.ts` → 自定义模板目录、远程模板映射，适合企业内部定制
- 插件系统 → 钩子注入，适合深度定制

### 5. 可维护性优先

- `update-deps` 命令解决模板依赖过时问题
- `doctor` 命令帮助用户自检环境
- Conventional Commits 规范保证提交历史可读
- 完善的测试覆盖（17 个测试文件）保证重构信心

---

## 十二、结语

`mirajay-cli` 展示了一个企业级前端脚手架的完整设计：从交互问答到模板渲染，从工程化配置到插件扩展，每个模块各司其职又紧密协作。它的核心设计思路——**分层架构、模板与引擎分离、Profile 驱动差异化、钩子实现可扩展**——不仅适用于脚手架，对任何需要 "根据配置生成代码" 的工具（如代码生成器、CRUD 脚手架、文档生成器）都有参考价值。

如果你正在构建自己的 CLI 工具，希望这篇文章能给你一些启发。

---

> **项目地址**：`mirajay-cli`  
> **技术栈**：TypeScript + unjs ecosystem + EJS + Vitest  
> **License**：MIT
