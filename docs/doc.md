# 企业级前端脚手架搭建指南（2026 全栈跨端·完整版）

以 unjs 生态为基石，集成 citty、consola、picocolors、giget、Turborepo、tsup、markdownlint，覆盖桌面 Web、移动端（H5/小程序/React Native/Flutter）与微前端（Module Federation、wujie、micro-app、qiankun），提供主流 UI 框架/组件库及工程化规范。十年一线经验系统沉淀，构建企业级全场景脚手架。

## 目录

- [技术选型全景](#一技术选型全景)
- [插件体系与命令设计](#二插件体系与命令设计)
- [项目模板体系](#三项目模板体系)
- [交互式初始化流程](#四交互式初始化流程configts设计)
- [各场景模板细节](#五各场景模板细节)
- [工程化与规范](#六工程化与规范)
- [十年经验打磨的关键点](#七十年经验打磨的关键点)
- [最终项目目录](#八最终项目目录)
- [总结](#九总结)

---

## 一、技术选型全景

### 1. 运行时与语言

- **Node.js ≥ 22 LTS**：原生 ESM、内置测试、稳定 API。
- **TypeScript 5.7+**：全链类型安全，脚手架与模板均使用 TS。

### 2. CLI 核心框架

| 库 | 角色 |
| --- | --- |
| citty | 命令定义与解析。类型安全、零依赖、自动帮助生成。 |
| @inquirer/prompts | 交互式问答（list、checkbox、search、confirm）。 |
| consola | 结构化日志，内建进度条，终端报告。 |
| picocolors | 轻量字符串着色，快速高亮输出。 |
| c12 | 智能配置加载（.clirc.ts、环境变量）。 |
| giget | 模板下载引擎，支持 Git/NPM，内置缓存。init 可通过 `--from` 或 `.clirc` 的 `remoteTemplates` 拉取远程模板。 |

### 3. 模板引擎

- **EJS**：动态生成项目文件。
- **magicast（高级场景）**：AST 级别注入（如 UI 库自动配置）。

### 4. 脚手架自身构建与测试

- **tsup**：极速打包，输出 ESM/CJS。
- **vitest**：单元测试。

### 5. 包管理器

pnpm（默认）、yarn、bun 可选。

### 6. 版本与发布

changesets + bumpp + verdaccio。

---

## 二、插件体系与命令设计

使用 citty 的 `defineCommand` 定义所有命令，通过 hookable 注入生命周期钩子，支持插件动态扩展。

### 内置命令

- **init（别名 create）**：初始化项目（支持桌面/移动/微前端）。
- **lint**：ESLint + Prettier + Stylelint + markdownlint。
- **commit**：cz-git + commitlint 规范提交。
- **test**：启动 vitest。
- **build**：根据模板调用 Vite / Turborepo / tsup / 跨端构建。
- **deploy**：CI/CD 集成。
- **doctor**：环境诊断。
- **upgrade**：脚手架自我更新。

---

## 三、项目模板体系

脚手架支持三种项目类型，覆盖全端场景：

### 1. 桌面 Web 应用（SPA/SSG）

- React + 主流 UI 框架
- Vue + 主流 UI 框架
- 可选原子化 CSS 框架（Tailwind CSS / UnoCSS）

### 2. 移动端应用

- H5 移动端（Vue + Vant / React + Antd Mobile / NutUI）
- 跨端框架（Taro / uni-app，可编译至微信小程序、H5 等）
- React Native（面向原生 App）
- Flutter（原生跨端，覆盖 iOS/Android/Desktop/Web）

### 3. 微前端架构（2026 最新方案）

| 方案 | 类型 | 核心亮点 | 适用场景 |
| --- | --- | --- | --- |
| Module Federation | 构建时共享模块 | Webpack / Rspack / Vite 均原生支持，共享依赖、运行时独立部署，性能最佳 | 中大型新项目，技术栈统一或可控，追求极致性能 |
| 无界 (wujie) | 运行时沙箱 (Web Components + iframe) | 腾讯出品，完美隔离，保活、预加载、样式隔离优秀，接入成本极低 | 快速集成多技术栈遗留系统 |
| micro-app | 运行时沙箱 (类 Web Components) | 京东出品，对 iframe 增强封装，侵入性极低，可直接加载外部 URL | 需要极低改造成本嵌入子应用的场景 |
| qiankun (遗留方案) | 运行时沙箱 (Proxy) | 早期事实标准，生态成熟，但性能瓶颈明显，新项目不再推荐 | 存量项目维护，模板保留但标记为遗留 |

#### 微前端模板目录结构示例（Monorepo + Module Federation）

```text
micro-frontend-monorepo/
├── apps/
│   └── host/                # 主应用 (Vite/Webpack Module Federation)
├── packages/
│   ├── remote-app1/         # 子应用1
│   ├── remote-app2/         # 子应用2
│   └── shared-ui/           # 公共组件/工具库
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

对于无界或 micro-app，主应用模板内置了加载子应用的统一适配器，支持通过配置注册子应用。

---

## 四、交互式初始化流程（config.ts 设计）

用户在 `cli create` 时依次选择：项目类型 → 前端框架 → UI 框架/库 → 样式方案 → 移动端具体平台 → 微前端方案 → 工程化选项。

### 典型 prompts 流程

```ts
export default {
  prompts: [
    // 1. 项目类型
    {
      type: 'list',
      name: 'projectType',
      message: '选择项目类型',
      choices: [
        { name: '桌面 Web 应用', value: 'desktop' },
        { name: '移动端应用', value: 'mobile' },
        { name: '微前端架构', value: 'micro-frontend' }
      ]
    },
    // 2. 前端框架（桌面/移动/微前端均需）
    {
      type: 'list',
      name: 'framework',
      message: '选择前端框架',
      choices: ['react', 'vue'],
      when: (answers) => answers.projectType !== 'micro-frontend' // 微前端单独处理
    },
    // 3. UI 框架 / 组件库（根据项目类型和框架动态）
    {
      type: 'list',
      name: 'uiLibrary',
      message: '选择 UI 组件库 / 框架',
      choices: (answers) => {
        if (answers.projectType === 'mobile') {
          if (answers.mobilePlatform === 'flutter') return [] // Flutter 无此类选项
          if (answers.framework === 'vue') return [
            { name: 'Vant（移动端首选）', value: 'vant' },
            { name: 'NutUI（京东出品，Vue3）', value: '@nutui/nutui' },
            { name: 'uni-ui（uni-app 专用）', value: '@dcloudio/uni-ui' }
          ]
          if (answers.framework === 'react') return [
            { name: 'Ant Design Mobile', value: 'antd-mobile' },
            { name: 'React Vant', value: 'react-vant' }
          ]
        }
        // 桌面端
        if (answers.framework === 'vue') return [
          { name: 'Element Plus', value: 'element-plus' },
          { name: 'Ant Design Vue', value: 'ant-design-vue' },
          { name: 'Naive UI', value: 'naive-ui' },
          { name: 'Vuetify', value: 'vuetify' },
          { name: 'PrimeVue', value: 'primevue' }
        ]
        return [
          { name: 'Ant Design', value: 'antd' },
          { name: 'MUI', value: '@mui/material' },
          { name: 'NextUI', value: '@nextui-org/react' },
          { name: 'shadcn/ui', value: 'shadcn-ui' },
          { name: 'Mantine', value: '@mantine/core' },
          { name: 'Chakra UI', value: '@chakra-ui/react' }
        ]
      }
    },
    // 4. 样式方案（原子化 CSS 框架）
    {
      type: 'list',
      name: 'cssFramework',
      message: '选择 CSS 框架（可与 UI 库配合）',
      choices: [
        { name: 'Tailwind CSS', value: 'tailwindcss' },
        { name: 'UnoCSS', value: 'unocss' },
        { name: 'CSS Modules / 原生方案', value: 'none' }
      ],
      when: (a) => a.mobilePlatform !== 'flutter' // Flutter 无此类选项
    },
    // 5. 移动端细分（仅当 projectType === 'mobile'）
    {
      type: 'list',
      name: 'mobilePlatform',
      message: '选择移动端平台',
      choices: [
        { name: 'H5 移动 Web', value: 'h5' },
        { name: '跨端框架（Taro）', value: 'taro' },
        { name: '跨端框架（uni-app）', value: 'uni-app' },
        { name: 'React Native', value: 'react-native' },
        { name: 'Flutter（原生跨端）', value: 'flutter' } // 新增
      ],
      when: (a) => a.projectType === 'mobile'
    },
    // 6. Flutter 专属配置（仅当 mobilePlatform === 'flutter'）
    {
      type: 'list',
      name: 'flutterStateManagement',
      message: '选择状态管理方案',
      choices: ['Provider', 'Riverpod', 'Bloc'],
      when: (a) => a.mobilePlatform === 'flutter'
    },
    {
      type: 'list',
      name: 'flutterTargetPlatforms',
      message: '选择目标平台',
      choices: ['iOS', 'Android', 'Web', 'Windows', 'macOS', 'Linux'],
      when: (a) => a.mobilePlatform === 'flutter'
    },
    {
      type: 'confirm',
      name: 'flutterMaterial3',
      message: '是否使用 Material Design 3?',
      default: true,
      when: (a) => a.mobilePlatform === 'flutter'
    },
    {
      type: 'confirm',
      name: 'flutterInternationalization',
      message: '是否初始化国际化?',
      default: false,
      when: (a) => a.mobilePlatform === 'flutter'
    },
    // 7. 微前端方案（仅当 projectType === 'micro-frontend'）
    {
      type: 'list',
      name: 'microFrontendTool',
      message: '选择微前端方案',
      choices: [
        { name: 'Module Federation（推荐，构建时共享）', value: 'module-federation' },
        { name: '无界 (wujie)（多技术栈快速集成）', value: 'wujie' },
        { name: 'micro-app（低侵入嵌入）', value: 'micro-app' },
        { name: 'qiankun（遗留方案，仅用于存量维护）', value: 'qiankun' }
      ],
      when: (a) => a.projectType === 'micro-frontend'
    },
    // 8. 是否使用 Monorepo（Turborepo）
    {
      type: 'confirm',
      name: 'useMonorepo',
      message: '是否使用 Monorepo (Turborepo) 管理？',
      default: false
    },
    // 9. 工程化预设（desktop / h5 等 JS 项目）
    {
      type: 'list',
      name: 'engineeringPreset',
      message: '选择工程化预设',
      choices: [
        { name: 'Standard（推荐）- ESLint + Prettier + Stylelint + markdownlint + Vitest', value: 'standard' },
        { name: 'Minimal - 仅 ESLint + Prettier', value: 'minimal' },
        { name: 'Strict - Standard + cspell + commitlint + husky + lint-staged', value: 'strict' },
        { name: '自定义', value: 'custom' }
      ]
    }
  ],
  filters: { /* 按条件过滤文件 */ },
  async complete(ctx) { /* 安装依赖、初始化 Git 等 */ }
}
```

---

## 五、各场景模板细节

### 1. 桌面 Web 应用模板

- 模板内置：`desktop-react`、`desktop-vue`
- 根据选择安装 UI 库 + CSS 框架
- 自动注入 Tailwind 配置或 UnoCSS 插件

### 2. 移动端模板

#### a. H5 移动端

- `mobile-vue-h5`：Vite + Vue + Vant + Tailwind
- `mobile-react-h5`：Vite + React + antd-mobile + Tailwind
- 内置移动端适配（flexible 或 viewport 方案）、rem 转换

#### b. 跨端框架

- `mobile-taro`：Taro 3.x + React/Vue + NutUI/Taro UI
- `mobile-uni-app`：uni-app + Vue3 + uni-ui
- 模板中包含多端构建脚本和条件编译示例

#### c. React Native

- `mobile-rn`：React Native + Expo / 原生 CLI
- 适合有原生需求的企业团队

#### d. Flutter

- 独立的 Dart/Flutter 项目骨架（`lib/`, `pubspec.yaml`, `android/`, `ios/`, 可选 `web/` 等）
- 预置架构：状态管理（Provider / Riverpod / Bloc 可选）、路由（go_router）、网络（dio）、国际化（intl）
- 可选 Material Design 3 或 Cupertino 风格
- 工程化：`flutter_lints`、`analysis_options.yaml`，CI 模板（`.github/workflows/flutter.yml`）
- 支持 melos 管理 Flutter Monorepo（若用户选择 Monorepo）
- 环境检测：doctor 命令检查 Flutter SDK，创建时若缺失则给出安装提示

### 3. 微前端模板（2026 主流方案落地）

#### a. Module Federation 模板

- **同栈（推荐）**：`micro-module-federation-react` / `micro-module-federation-vue`，主应用与 remote 使用相同框架，共享依赖配置最简单。
- **混合栈演示**：`micro-module-federation-mixed-react-vue` / `micro-module-federation-mixed-vue-react`，主应用与 remote 不同框架，内置桥接组件（React 侧 `createApp` 挂载 Vue 远程模块，或 Vue 侧 `createRoot` 挂载 React 远程模块），用于存量系统集成演示。
- **交互**：选择 Module Federation 后先问「同栈 / 混合栈」，再选主应用框架；混合栈时 remote 框架自动取反，与主应用框架分离，避免混淆。

- **主应用 (host)**：Vite + Vue/React + `@originjs/vite-plugin-federation`，定义 remotes 与 shared。
- **子应用 (remote)**：独立构建，暴露 Header 组件，支持独立开发与部署。

**模板特性**：

- 自动生成 `exposes` 和 `remotes` 配置。
- 内置类型提示（通过 `@module-federation/typescript` 或自定义类型生成）。
- 包含示例：主应用加载子应用的 Header 组件，演示双向通信。

#### b. 无界 (wujie) 模板

- **主应用 (wujie-host)**：内置 wujie 容器组件，支持配置数组注册子应用。
- **子应用**：无需特殊改造，可以是任意技术栈的独立应用（甚至静态 HTML）。

**模板特性**：

- 预设生命周期钩子、预加载配置、样式隔离开关。
- 演示加载一个 Vue 子应用和一个 React 子应用，展示多技术栈混合。

#### c. micro-app 模板

- **主应用**：引入 micro-app 库，使用 `<micro-app>` 标签嵌入子应用。
- **子应用**：最低限度适配（允许跨域、添加生命周期脚本），模板中提供 Vue/React 适配示例。

#### d. qiankun 模板（遗留方案）

仅作保留，供有明确需要维护旧项目的团队使用，交互中标记为"不推荐新项目"。

---

## 六、工程化与规范

- **Turborepo**：微前端或跨端项目默认推荐 Monorepo 管理，利用 `turbo.json` 编排构建、lint、test。
- **engineering-base**：init 时按预设合并 ESLint 9 flat config、Prettier、Stylelint、markdownlint、cspell、Vitest、commitlint、husky、lint-staged。
- **Git 规范**：Strict 预设启用 commitlint + cz-git + husky + lint-staged；init 时先初始化 Git 再安装依赖以确保 husky prepare 生效。
- **Monorepo 工程化**：桌面/移动 Monorepo 与 Module Federation 统一分层——根目录放 Prettier 等共享规范与 Git hooks，`apps/*` 放 ESLint/Stylelint/Vitest；`packages/*` 不注入 lint。
- **平台 ESLint**：Taro / uni-app / React Native 使用独立 ESLint 配置与插件（含 `@react-native` 规则）。
- **远程模板 (giget)**：支持 `--from gh:org/repo/path` 或 `.clirc` 中 `remoteTemplates` 映射，缓存至 `~/.cache/mirajay-cli/templates`。
- **shadcn/ui**：预置 Button + Card，init 后自动尝试 `shadcn add input label separator`，并提供 `pnpm ui:add` 脚本。
- **markdownlint**：由 engineering-base 按选项注入 `.markdownlint.json` 与 CI 检查。
- **tsup**：脚手架自身打包，移动端/桌面项目内部可使用 tsup 构建库。
- **Lint 统一**：`cli lint` 按项目已生成的配置文件探测运行；`cli commit` 检测 cz-git / commitlint 是否已配置。
- **Flutter 专项**：Flutter 项目使用 `flutter_lints` 和 `flutter analyze`，脚手架 lint 命令自动识别项目类型并调用对应检查。
- **CI/CD**：每个模板提供对应 CI 示例文件（GitHub Actions / GitLab CI），包括构建、测试、发布流程。

---

## 六（附）、版本迭代说明

详细变更日志见独立文档：[changelog.md](./changelog.md)。

### 1.1.0 摘要（2026-08-20）

- **Monorepo 工程化统一分层**：根共享 Prettier 等；主应用放 ESLint/Stylelint/Vitest；`packages/*` 不注入 lint。
- **MF**：根补齐 `test`；Vue remote `index.html` 入口修正；Vue ESLint 支持 `.vue` 内 TypeScript。
- **wujie-vue**：修复 `fetch` 类型导致的构建失败。

发布与版本号约定亦见 [publishing.md](./publishing.md)。

---

## 七、十年经验打磨的关键点

### 1. UI 框架的灵活组合

- 原子化 CSS（Tailwind/UnoCSS）可与任何 UI 组件库共存，模板中自动处理样式优先级。
- 为 shadcn/ui 这类依赖 Tailwind 的库，选择 Tailwind 时自动初始化其配置。

### 2. 移动端适配

- H5 模板默认集成 `postcss-pxtorem` 或 vw 适配方案。
- 跨端模板中，条件编译指令预置，避免开发者踩坑。

### 3. 微前端方案选择与演化

- 新项目默认推荐 Module Federation，享受构建时共享依赖的性能优势，配合 Turborepo 实现高效的协同开发。
- 多技术栈混合或遗留系统嵌入首选 wujie，其 Web Components + iframe 沙箱模式接入成本极低，性能优于 qiankun。
- 需要极低侵入时可选 micro-app，可直接嵌入一个外部 URL 作为子应用。
- qiankun 仅保留模板用于存量维护，新项目不再推荐，以引导团队向现代方案迁移。

### 4. Flutter 的定位与集成

- 作为移动端的一个原生级选项存在，不与 JS 模板混淆，拥有独立交互路径。
- 创建项目时强依赖 Flutter SDK，脚手架通过 doctor 和创建时的检测避免生成不可用项目。
- 提供主流状态管理和国际化模板，降低 Dart 生态的入门门槛。

### 5. 性能与缓存

- giget 缓存加速，模板二次创建秒级。
- tsup 打包脚手架，启动速度极快。

### 6. 安全与白名单

- UI 库、框架名称严格校验，防止命令注入。
- 模板文件下载后完整性校验。

### 7. 文档与社区

- 使用 VitePress 搭建文档站，融入可交互的命令示例。
- 提供 CONTRIBUTING.md 引导团队贡献模板与插件。

---

## 八、最终项目目录

```text
mirajay-cli/
├── bin/
│   └── cli.mjs
├── src/
│   ├── commands/
│   │   ├── init.ts          # 全类型项目初始化逻辑
│   │   ├── lint.ts
│   │   ├── build.ts
│   │   └── doctor.ts
│   ├── core/
│   │   ├── hooks.ts
│   │   ├── template.ts      # giget + EJS，含多模板选择
│   │   └── logger.ts
│   ├── adapters/
│   │   └── commander-adapter.ts (可选)
│   └── index.ts
├── templates/
│   ├── desktop-vue/
│   ├── desktop-react/
│   ├── mobile-h5-vue/
│   ├── mobile-h5-react/
│   ├── mobile-taro/
│   ├── mobile-uni-app/
│   ├── mobile-rn/               # React Native
│   ├── mobile-flutter/          # Flutter 模板
│   │   ├── template/
│   │   │   ├── {name}/
│   │   │   │   ├── lib/
│   │   │   │   │   ├── main.dart
│   │   │   │   │   ├── app/
│   │   │   │   │   │   ├── router.dart
│   │   │   │   │   │   └── theme.dart
│   │   │   │   │   └── l10n/    # 国际化
│   │   │   │   ├── pubspec.yaml
│   │   │   │   ├── analysis_options.yaml
│   │   │   │   └── ...
│   │   │   └── config.ts        # 状态管理、平台等选项
│   │   └── README.md
│   ├── micro-module-federation-react/         # Module Federation（React 同栈）
│   ├── micro-module-federation-vue/           # Module Federation（Vue 同栈）
│   ├── micro-module-federation-mixed-react-vue/ # MF 混合栈：React 主 + Vue 远程
│   ├── micro-module-federation-mixed-vue-react/ # MF 混合栈：Vue 主 + React 远程
│   ├── micro-wujie-react/             # 无界 React 主应用
│   ├── micro-wujie-vue/               # 无界 Vue 主应用
│   ├── micro-micro-app-react/         # micro-app React 主应用
│   ├── micro-micro-app-vue/           # micro-app Vue 主应用
│   ├── micro-qiankun-react/           # 遗留 qiankun React 主应用
│   ├── micro-qiankun-vue/             # 遗留 qiankun Vue 主应用
│   ├── monorepo-base/
│   └── engineering-base/        # ESLint / Prettier / Stylelint / cspell / Vitest 共享层
├── tests/
├── .changeset/
├── tsup.config.ts
├── package.json
└── CONTRIBUTING.md
```

---

## 九、总结

本方案彻底打破了端与架构的壁垒，将桌面 UI 框架、移动端（含 Flutter 原生跨端）、微前端三大领域无缝整合至同一脚手架中。开发者只需一次交互，即可生成适配多端、多架构的工程化项目，且所有选择均基于 2026 年主流且活跃的技术栈。

微前端部分精准反映了当前业界趋势：以 Module Federation 作为现代构建共享方案，无界成为运行时沙箱的领跑者，micro-app 提供极低侵入嵌入能力，同时兼容遗留的 qiankun 存量项目。移动端方面，从 H5 到 Taro/uni-app 小程序跨端，再到 React Native 和 Flutter 原生跨端，提供了覆盖 WebView 到原生渲染的完整光谱。

结合 citty 的简洁命令、giget 的极速模板下载、Turborepo 的任务编排、tsup 的自身构建以及 markdownlint 的文档规范，企业团队无论面对 B 端中后台、C 端移动应用还是大型分布式微前端项目，均可从第一天就拥有统一、高质量的起点，将精力专注于业务创新。
