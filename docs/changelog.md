# 版本变更与迭代说明

> 记录 mirajay-cli 面向用户与维护者的重要变更。版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)；与 `package.json` 的 `version` 字段对齐发布。

---

## [1.1.0] — 2026-08-20

### 亮点

统一所有 Monorepo 模板的工程化配置归属，并修复矩阵回归中暴露的微前端模板问题。

### 新增 / 行为变更

#### Monorepo 工程化分层（桌面 / 移动 / Module Federation 统一）

| 位置 | 配置与依赖 |
|------|------------|
| **仓库根** | Prettier、EditorConfig、markdownlint、cspell；commitlint / husky / lint-staged |
| **主应用**（`apps/web` 或 MF 的 `apps/host`） | ESLint、Stylelint、Vitest |
| **`packages/*`** | 不注入 lint（避免无配置却装依赖） |

- `getEngineeringManifest` 支持 `scope: 'shared' | 'app' | 'hooks' | 'all'`
- `isWorkspaceEngineeringMonorepo`：桌面/移动勾选 Monorepo，以及 `micro-module-federation-*` 走同一套分层
- 根目录 `pnpm lint` 仍为 `turbo run lint`；格式化使用根上的 `pnpm format`
- `lint-staged` 通过 `engineeringAppPath` 指向正确的应用级 ESLint/Stylelint 配置（不再写死 `apps/web`）

#### Module Federation

- 根 `package.json` / `turbo.json` 补齐 `test` 任务（`turbo run test`）
- Vue remote 的 `index.html` 入口修正为 `main.ts` + `#app`
- Vue ESLint flat config 为 `*.vue` 挂载 TypeScript parser，混栈宿主可正确解析 `<script setup lang="ts">`

#### 无界 wujie

- `fetch` 回调参数类型改为 `RequestInfo | URL`，修复 Vue 模板 `vue-tsc` 构建失败

### 文档

- 更新 Monorepo 工程化说明（`05` / `06` / 架构类文档）
- 新增本变更日志

### 测试

- 单元测试与 scaffold 全链路矩阵（create → install → dev → build → lint → test）覆盖上述场景

### 升级注意

- 已用旧版脚手架生成的 Monorepo 项目：若 Prettier 仍在 `apps/web`，可手动上移到根并与本文分层对齐；新创建项目无需处理
- 要求 Node.js `>= 24.18.0`（与 `engines` 一致）

---

## [1.0.0] — 初始发布

### 能力概览

- 桌面 Web（Vue / React）、移动端（H5 / Taro / uni-app / RN / Flutter）
- 微前端：Module Federation（同栈 / 混栈）、wujie、micro-app、qiankun
- 工程化预设：Minimal / Standard / Strict（ESLint 9 flat、Prettier、Stylelint、Vitest、commitlint、husky 等）
- Monorepo：`monorepo-base` + Turborepo；微前端自带 workspace
- 远程模板（giget）、`update-deps`、scaffold 矩阵回归、文档站（VitePress）

---

## 版本规划约定（维护者）

| 变更类型 | 版本位 | 示例 |
|----------|--------|------|
| 破坏性（交互/生成结构不兼容、engines 大升级） | major | 2.0.0 |
| 功能增强、模板修复、文档与非破坏默认调整 | minor | 1.1.0 |
| 仅补丁、文案、依赖安全修复 | patch | 1.1.1 |

发布流程见 [publishing.md](./publishing.md)。
