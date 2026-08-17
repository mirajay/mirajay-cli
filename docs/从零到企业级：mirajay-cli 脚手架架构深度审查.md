# 从零到企业级：mirajay-cli 脚手架架构深度审查

> 写在前面：市面上「创建项目」的 CLI 很多，真正能在桌面 Web、移动端、微前端三条线上统一体验、又能把工程化做成可组合预设的，并不多见。本文基于对 **mirajay-cli** 源码与模板体系的完整审查，从架构取舍、模板分层、工程化注入到微前端选型，拆解一个企业级前端脚手架是怎么「长」出来的。

---

## 一、为什么还要自己造脚手架？

`create-vite`、`create-next-app`、`@vue/create`、各家微前端官方 demo……工具并不缺。团队真正头疼的往往是另一件事：

- **起点不统一**：A 项目用 Element Plus + Tailwind，B 项目用 Ant Design + CSS Modules，C 项目连 ESLint flat config 都还没迁完。
- **工程化是后补的**：业务跑起来了才补 commitlint、husky、Stylelint，规范永远「差点意思」。
- **场景割裂**：中后台一套脚手架，H5/小程序另一套，微前端再 fork 一份 monorepo 模板，维护成本随矩阵膨胀。

企业级脚手架要解决的，不是「能不能生成一个 Hello World」，而是：

1. **一次交互，覆盖真实业务矩阵**（桌面 / 移动 / 微前端）；
2. **工程化可预设、可裁剪**，而不是写死在模板里；
3. **模板可演进**（本地 + 远程），CLI 自身也能自我升级与依赖同步。

mirajay-cli 的定位正是这条路上的答案：基于 unjs 生态构建的 CLI，外加分层模板与工程化共享层。

---

## 二、技术底座：站在 unjs 肩膀上

脚手架自身的技术选型很克制，几乎全部押在 unjs 系工具上：

| 能力 | 选型 | 在本项目中的角色 |
| --- | --- | --- |
| 命令定义 | **citty** | `defineCommand` + 子命令树，类型友好、帮助自动生成 |
| 交互问答 | **@inquirer/prompts** | 按项目类型动态分支，而不是静态 prompt 列表 |
| 日志 | **consola + picocolors** | 步骤感清晰，终端可读性好 |
| 配置加载 | **c12** | `.clirc.ts` 智能加载，支持默认包管理器 / 远程模板映射 |
| 远程模板 | **giget** | `gh:` / `gitlab:` / `https:` 拉取并本地缓存 |
| 生命周期 | **hookable** | `init:before` / `template:after` 等扩展点 |
| 模板渲染 | **EJS** | 业务文件按答案条件渲染，不做过度 AST 魔法 |
| 自身构建 | **tsup + Vitest** | ESM 产出，测试覆盖矩阵与安全边界 |

入口非常干净——`src/index.ts` 用 citty 挂载 `init`（别名 `create`）、`lint`、`build`、`test`、`commit`、`doctor`、`deploy`、`upgrade`、`update-deps`。CLI 自己也是一个「产品」：能诊断环境、能升级自己、能批量刷新模板里的依赖版本。这是企业工具和「周末玩具脚本」的分野。

```text
用户输入
  → citty 路由
    → prompts 收集答案（或 -y 默认）
      → resolveTemplateName
        → generateProject（业务模板 + monorepo-base + engineering-base + git-base）
          → 装依赖 / Git hooks / shadcn 组件
            → next-steps 指引
```

---

## 三、核心架构：四层模板，而不是「一个巨型模板」

审查源码后，最值得写进博客的设计决策是：**把「业务骨架」和「工程化配置」拆开。**

### 1. 业务模板（`templates/desktop-*` / `mobile-*` / `micro-*`）

只关心「这个场景下最小可运行的产品结构」：入口、路由、示例页面、UI 库接入点、CSS 方案相关文件。大约 20+ 套场景模板，覆盖：

- **桌面**：`desktop-vue` / `desktop-react`
- **移动**：H5（Vue/React）、Taro、uni-app、React Native（Expo）、Flutter
- **微前端**：Module Federation（同栈 + 混合栈）、wujie、micro-app、qiankun（遗留）

### 2. 工程化共享层（`engineering-base`）

ESLint（按 profile 分文件）、Prettier、Stylelint、Vitest smoke、markdownlint、cspell、commitlint / husky / lint-staged……**不是复制粘贴进每个业务模板**，而是 init 时按预设合并注入。

### 3. Monorepo 底座（`monorepo-base`）

Turborepo + pnpm workspace + `packages/shared`。桌面/H5 勾选 Monorepo 时，业务应用落到 `apps/web`，根目录由底座铺好。

### 4. Git 底座（`git-base`）

统一 `.gitignore` 等仓库级文件，避免每套模板各写一份、漏一项。

这种分层带来的直接收益：

- 改一条 ESLint 规则，不必改 20 个模板目录；
- 业务模板更「薄」，审查与贡献成本更低；
- Monorepo / Git hooks 可以按布局差异化挂载（单包 vs 工作区根）。

`generateProject` 的真实顺序大致是：

1. 解析本地或远程模板目录；
2. 渲染业务模板到目标目录（Monorepo 时为 `apps/web`）；
3. 如需 Monorepo，再铺 `monorepo-base`；
4. 若启用工程化，渲染 `engineering-base`，并用 **engineering-manifest** 合并 `package.json` 的 scripts / devDependencies；
5. Monorepo 场景把 Git hooks 挂到仓库根，并把子包工程化脚本同步下去；
6. 最后渲染 `git-base`。

这是典型的「组合优于复制」。

---

## 四、交互设计：答案驱动，而不是表单堆砌

`prompts.ts` 没有做成「一次性抛出 20 个问题」。它按决策树推进：

1. 项目类型：桌面 / 移动 / 微前端  
2. 移动端再选平台；微前端再选方案与同栈/混合栈  
3. 框架（部分平台锁定，如 uni-app → Vue，Flutter 走 Dart）  
4. TypeScript 可选（跨端骨架多固定 TS）  
5. UI 库 / CSS（Flutter、微前端有独立路径）  
6. Monorepo 与工程化预设  

几个细节体现了「做过一线」的经验：

- **shadcn/ui 强依赖 Tailwind**：选了 shadcn 却没选 Tailwind，会自动纠正并提示。  
- **qiankun 明确标为遗留**：交互里警告，引导新项目走 Module Federation / wujie。  
- **Module Federation 混合栈**：主应用框架选定后，remote 自动取反，并提示「演示用，生产优先同栈」。  
- **白名单校验**：`ALLOWED_FRAMEWORKS` / `ALLOWED_UI_LIBRARIES` 等在 init 末尾再验一遍，防止异常输入污染生成逻辑。  
- **`-y` 非交互模式**：默认 Standard 工程化 + Vue + Element Plus + Tailwind，适合 CI 脚手架矩阵与脚本化建仓。

好的脚手架交互，本质是**决策树 + 合理默认 + 危险选项明示**，而不是把所有可能性平铺成超长问卷。

---

## 五、工程化预设：把「规范」做成产品能力

许多脚手架只塞一份「全家桶」ESLint。mirajay-cli 把工程化拆成预设：

| 预设 | 大致能力 |
| --- | --- |
| **minimal** | ESLint + Prettier |
| **standard**（默认） | + Stylelint + markdownlint + Vitest + commitlint + husky + lint-staged |
| **strict** | Standard + cspell |
| **custom** | 逐项勾选 |

背后是 `engineering-manifest.ts`：根据 **EngineeringProfile**（`react` / `vue` / `taro-react` / `taro-vue` / `uni-app` / `react-native`）拼出不同的依赖与脚本。模板侧用文件名区分配置（如 `eslint.react.config.js.ejs` vs `eslint.taro.vue.config.js.ejs`），渲染时按 profile 过滤，输出统一成 `eslint.config.js`。

这套机制的价值在于：

- **平台差异被承认**：Taro / RN 规则集与纯 Vite Web 不同，硬揉一套只会误伤；
- **依赖版本集中治理**：配合 `update-deps` 命令扫描模板与 manifest，从 npm 拉最新版本并保留 `^` / `~` 前缀，维护者不用手工改几十个 `package.json.ejs`；
- **Monorepo 感知**：hooks 相关依赖挂在仓库根，应用包只拿 lint/test 能力，职责清晰。

---

## 六、条件过滤：模板「看起来大」，产出「刚刚好」

`template.ts` 里的 `getFileFilters` / `shouldSkipEngineeringFile` 是另一处关键设计。用户选 UnoCSS 时，不会带上 Tailwind / PostCSS 配置；没选 shadcn 时，不会生成 `components/ui/*` 与 `components.json`；Taro 按 React/Vue 只保留对应入口与页面。

再配合 EJS 上下文（`projectName`、`uiLibrary`、`engineering`、`useTypeScript`、README 命令片段等），生成物尽量接近「这个团队会真的用的仓库」，而不是「需要删半小时样板代码」的仓库。

对 JavaScript 模式还有扩展名改写：在可选 TS 的场景下，可把输出落到 `.js` / `.jsx`，同时 shadcn 仍可保留必要的 tsconfig 以解析 `@/*` 路径——细节小，却决定「生成完能不能立刻跑」。

---

## 七、微前端：用模板矩阵表达业界共识

微前端部分没有假装「一种方案打天下」，而是用模板矩阵把选型写进产品：

| 方案 | 模板策略 | 产品态度 |
| --- | --- | --- |
| **Module Federation** | 同栈 React/Vue + 混合栈 React↔Vue 演示 | **新项目首选**；同栈优先 |
| **wujie** | React / Vue 主应用分栈 | 多技术栈快速集成 |
| **micro-app** | React / Vue 分栈 | 低侵入嵌入 |
| **qiankun** | React / Vue 分栈 | **遗留维护**，交互明示不推荐 |

Module Federation 模板天然是 monorepo 形态（host + remote + shared），与 Turborepo 契合；运行时沙箱方案则更轻，适合「先嵌进去再治理」。脚手架把「推荐」写进 prompt 文案和警告，比写在 wiki 里有效得多——**规范最好发生在创建那一刻**。

混合栈模板的存在也很务实：它不鼓吹「生产环境随便混」，而是承认存量现实——主应用 React、远程还是 Vue——并给出可跑通的桥接演示，降低 PoC 成本。

---

## 八、跨端与 Flutter：同一 CLI，不同运行时诚实以待

移动端覆盖 H5 → Taro / uni-app → RN → Flutter，光谱完整。审查时特别注意到：Flutter **没有假装成 Node 项目**。

- 交互独立：状态管理（Provider / Riverpod / Bloc）、目标平台、Material 3、国际化；
- 依赖安装走 `flutter pub get`，并支持通过 fvm 等解析 SDK；
- `doctor` 把 Flutter SDK 纳入环境诊断；缺失时仍可生成骨架，但明确提示后续命令。

这种「诚实」很重要。硬把 Dart 生态塞进 `pnpm install` 叙事，只会制造虚假的「一键成功」。

---

## 九、远程模板、安全与可扩展性

企业场景里，模板往往不能只住在 npm 包里——业务线要私有化定制。mirajay-cli 提供两条路：

1. **`--from`** / `.clirc` 的 `remoteTemplates`：giget 拉取，缓存到 `~/.cache/mirajay-cli/templates`；  
2. **`templatesDir`**：指向自定义本地模板根目录。

安全上对远程源做了格式校验，并拒绝 `;`、`&`、`` ` `` 等可注入字符；框架与 UI 库走白名单。hookable 暴露 `init:*` / `template:*` / `lint:*` / `build:*`，为插件化预留了缝——当前插件 API 仍偏轻量，但方向正确：扩展点应挂在生命周期，而不是 fork 整仓。

---

## 十、自身工程化：脚手架也要像产品一样被测

`tests/` 里不只有单元测试，还有 scaffold matrix、UI coverage、micro-frontend、security、engineering-manifest、shadcn、Flutter SDK 等专题。对脚手架而言，**回归成本极高**：一次过滤逻辑写错，可能静默丢掉关键配置文件。矩阵测试和 `scripts/run-scaffold-matrix.mjs` 这类维护脚本，是这个仓库「可演进」的底气。

命令面也闭环：

- `doctor`：Node（≥24.18）、包管理器、Git、Flutter；  
- `upgrade`：升级 CLI 自身；  
- `update-deps`：维护者一键对齐模板依赖（含 `--dry-run` / `--check`）；  
- `lint` / `commit` / `build` / `test` / `deploy`：面向「生成后的项目」或工具链本身的日常动作。

---

## 十一、审查结论：优点、边界与演进建议

### 做得很扎实的地方

1. **业务模板 × 工程化共享层 × Monorepo/Git 底座** 的分层清晰，可维护性显著高于「巨型拷贝模板」。  
2. **工程化预设 + profile 化 ESLint** 贴近真实多端差异。  
3. **微前端选型有态度**：推荐、演示、遗留分层明确。  
4. **unjs 技术栈一致**，CLI 启动与扩展成本可控。  
5. **维护者路径完整**（远程模板、update-deps、测试矩阵），不像一次性 demo。

### 需要清醒认识的边界

1. **模板矩阵越大，语义一致性越难**：命名、README 片段、默认端口、shared 约定需要持续对齐。  
2. **插件体系目前偏「钩子预留」**：距离成熟插件市场（官方插件包、配置声明式注册）还有一步。  
3. **生成成功 ≠ 业务架构成功**：脚手架解决的是「第一公里」与规范基线，领域模型、权限、监控仍要团队自己补。  
4. **混合栈 MF / 多微前端方案并存** 会增加认知负担——文档与 prompt 文案必须持续当「导航员」。

### 可继续演进的方向（审查视角）

- 将「推荐默认」产品化：例如按团队 `.clirc` 固化 UI 库与工程化预设，减少每次选择。  
- 加强生成后的**可运行性契约测试**（install + build + lint 冒烟）作为发布门禁。  
- 插件 API 文档化：`registerPlugin` + 官方示例（注入私有 ESLint 规则集、注入内部组件库）。  
- 对微前端模板补充「何时选谁」的决策树短文，直接链到 create 交互说明。

---

## 十二、写给团队的落地建议

如果你准备在组织内推广类似脚手架，可以直接复用 mirajay-cli 的三条原则：

1. **先分层，再扩矩阵**——没有 engineering-base，就不要急着加第 N 个业务模板。  
2. **把规范做成预设，而不是说教**——Standard / Strict 比「请大家记得装 husky」有效。  
3. **用交互表达技术决策**——遗留方案可以保留，但必须在选择当下说清楚代价。

快速体验：

```bash
pnpm install && pnpm build && pnpm link --global
mirajay-cli create my-app
# 或
mirajay-cli create my-app -y
mirajay-cli doctor
```

自定义团队默认值可参考 `.clirc.example.ts`：默认包管理器、工程化预设、远程模板映射。

---

## 结语

企业级前端脚手架的本质，不是堆砌更多框架选项，而是**在创建瞬间完成一次高质量的架构与工程决策**。mirajay-cli 用 unjs 搭好 CLI 骨架，用四层模板解决复制膨胀，用预设与 profile 消化多端差异，用微前端矩阵对齐业界共识——这套组合，经得起代码审查，也经得起团队规模化后的维护压力。

下一公里留给业务；第一公里，值得用工程认真对待。

---

*基于 mirajay-cli 仓库源码与模板体系审查整理。文中命令与目录以当前仓库实现为准。*
