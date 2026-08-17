# mirajay-cli

企业级前端脚手架工具，覆盖桌面 Web、移动端与微前端全场景。

基于 unjs 生态（citty、consola、picocolors、giget）构建，集成 Turborepo、tsup、markdownlint 等工程化工具。

## 特性

- **全端覆盖**：桌面 Web (SPA/SSG)、移动端 (H5/Taro/uni-app/RN/Flutter)、微前端 (Module Federation/wujie/micro-app/qiankun)
- **交互式初始化**：通过 `@inquirer/prompts` 引导选择项目类型、框架、UI 库、CSS 方案及工程化预设
- **模板引擎**：EJS 动态生成项目文件，支持条件过滤；工程化配置由 `engineering-base` 共享层合并注入
- **插件体系**：基于 hookable 的生命周期钩子，支持插件扩展
- **跨端骨架**：Taro / uni-app / React Native (Expo Router) 最小可运行模板
- **远程模板 (giget)**：`mirajay-cli init app --from gh:org/repo/templates/desktop-react`
- **平台 ESLint**：Taro / uni-app / RN 独立 lint 配置
- **shadcn/ui**：init 后自动安装 input/label/separator，`pnpm ui:add dialog` 添加更多

## 快速开始

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 链接到全局
pnpm link --global

# 创建项目
mirajay-cli create my-app

# 或使用非交互模式（默认 Standard 工程化预设）
mirajay-cli create my-app -y
```

## 命令

| 命令 | 说明 |
| --- | --- |
| `mirajay-cli create [name]` | 初始化新项目 |
| `mirajay-cli lint` | 运行代码检查 |
| `mirajay-cli build` | 构建项目 |
| `mirajay-cli test` | 运行测试 |
| `mirajay-cli commit` | 规范化 Git 提交 |
| `mirajay-cli doctor` | 环境诊断 |
| `mirajay-cli deploy` | CI/CD 部署 |
| `mirajay-cli upgrade` | 升级脚手架 CLI 本身 |
| `mirajay-cli update-deps` | 一键更新模板中的 npm 依赖版本（维护者命令） |

## 支持的项目类型

### 桌面 Web

- Vue 3 + Element Plus / Ant Design Vue / Naive UI / Vuetify / PrimeVue
- React 19 + Ant Design / MUI / Mantine / Chakra UI / NextUI / shadcn/ui（含 components.json 与示例 Button）
- CSS: Tailwind CSS / UnoCSS / CSS Modules

### 移动端

- H5: Vue + Vant / React + antd-mobile
- 跨端: Taro / uni-app
- 原生: React Native (Expo) / Flutter

### 微前端

- Module Federation (推荐) — 同栈 React/Vue 或混合栈演示
- 无界 wujie — React / Vue 分栈模板
- micro-app — React / Vue 分栈模板
- qiankun (遗留) — React / Vue 分栈模板

## 配置

支持通过 `.clirc.ts` 自定义脚手架行为，参考 `.clirc.example.ts`：

```ts
export default {
  templatesDir: './custom-templates',  // 自定义模板目录
  defaultPackageManager: 'pnpm',     // 默认包管理器
}
```

```bash
pnpm dev      # 监听模式构建
pnpm test     # 运行测试
pnpm lint     # 代码检查
```

## 维护：更新模板依赖

当 npm 上的依赖版本过时，可在脚手架仓库根目录一键同步模板中的版本号：

```bash
# 预览可更新的包（不写文件）
mirajay-cli update-deps --dry-run

# 一键更新 templates/ 与 engineering-manifest.ts 中的依赖
mirajay-cli update-deps

# 仅更新指定包
mirajay-cli update-deps -p react -p vite

# 同时更新 CLI 自身的 package.json
mirajay-cli update-deps --include-cli

# CI 检查是否有可更新依赖
mirajay-cli update-deps --check
```

命令会扫描 `templates/**/package.json(.ejs)` 与 `src/core/engineering-manifest.ts`，从 npm registry 拉取最新版本，并保留原有的 `^` / `~` 前缀。

## 目录结构

```
mirajay-cli/
├── bin/cli.mjs           # CLI 入口
├── src/
│   ├── commands/         # 命令实现
│   ├── core/             # 核心模块 (logger, template, prompts, hooks)
│   └── index.ts          # 主入口
├── templates/            # 项目模板
│   ├── desktop-vue/
│   ├── desktop-react/
│   ├── mobile-h5-vue/
│   ├── mobile-h5-react/
│   ├── mobile-taro/
│   ├── mobile-uni-app/
│   ├── mobile-rn/
│   ├── mobile-flutter/
│   ├── micro-module-federation-react/
│   ├── micro-module-federation-vue/
│   ├── micro-module-federation-mixed-react-vue/
│   ├── micro-module-federation-mixed-vue-react/
│   ├── micro-wujie-react/
│   ├── micro-wujie-vue/
│   ├── micro-micro-app-react/
│   ├── micro-micro-app-vue/
│   ├── micro-qiankun-react/
│   ├── micro-qiankun-vue/
│   ├── monorepo-base/
│   └── engineering-base/
└── tests/
```

## 文档

文档源码在 [`docs/`](./docs/)，由 VitePress 构建文档站。

- 本地预览：`pnpm docs:dev`
- [文档中心（学习路径）](./docs/index.md)
- [小白入门指南](./docs/mirajay-cli-小白入门指南.md)
- [快速入门](./docs/00-快速入门.md)
- [GitHub / npm / Pages 发布说明](./docs/publishing.md)

发布文档站与 npm 的完整步骤见 `docs/publishing.md`。

## License

MIT
