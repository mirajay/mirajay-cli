# mirajay-cli 开发踩坑与 AI 编程复盘

> 本文整理脚手架从立项到可矩阵回归期间，真实遇到过的问题：含简单笔误、复杂架构坑，以及 **AI 辅助编程时的偷工减料、空洞实现、文档夸大**。
>
> 素材主要来自开发对话与后续修复（尤其是工程化落地、模板矩阵、微前端拆分等阶段），并对照当前源码中的防护点（如 `templates-dir` 双路径、EJS 禁用 HTML 转义、`shouldInjectWorkspaceEngineering`、scaffold matrix 等）。

---

## 一、先说结论：AI 写脚手架最爱犯什么错？

用一句话概括：

> **AI 很容易把「看起来完整」当成「真的能跑」。**  
> Prompt 写了、README 写了、`package.json` 里甚至写了 script——但配置文件、依赖、分支渲染、Monorepo 挂接经常缺一半。

对本仓库最伤的几类问题：

| 类型 | 典型表现 | 后果 |
|------|----------|------|
| **空洞壳（Hollow Shell）** | 问答有选项 / README 声称支持，生成物没有对应实现 | 用户以为配好了，一跑 `lint`/`dev` 就炸 |
| **只做 Happy Path** | 只通 Vue+Element+桌面；H5/Taro/微前端/Strict 没真跑 | 矩阵一扩全军覆没 |
| **接线忘记接** | 工具函数写了，却没挂进 `generateProject` / `init` | 「代码在，功能不在」 |
| **路径与打包幻觉** | 按源码相对路径写死，忽略 `dist/` 布局 | 本地 dev 偶发正常，build/link 后挂 |
| **跨栈拷贝不改干净** | 微前端 demo 残留另一栈命名/依赖 | 选 Vue 仍像 React，或文案骗人 |
| **文档超前于实现** | `doc.md` / README 先写能力清单 | 评审以为做完了，实际是愿景 |

后面按 **现象 → 根因 → 处理 → 防再发** 罗列。编号便于内部复盘引用。

---

## 二、简单错误（一眼能修，但很要命）

### P01 · 打包后找不到模板：`Template not found: desktop-react`

- **现象**：`pnpm build && pnpm link --global` 后 `create` 报模板不存在。  
- **根因**：模板目录相对 `import.meta.url` 写死；源码在 `src/core/`，产物在 `dist/`，多一层目录后路径指到仓库外。  
- **处理**：`templates-dir.ts` 依次尝试 `../templates`（产物）与 `../../templates`（源码），谁存在用谁。  
- **教训**：凡是「相对当前模块找资源」，必须按 **构建后布局** 验证，不能只在 `tsx`/`vitest` 源码路径下测通。

### P02 · EJS 把 `&&` 转成 `&amp;&amp;`

- **现象**：生成的 `package.json` scripts 异常，浏览器/脚本行为诡异。  
- **根因**：EJS 默认 HTML 转义，shell 运算符被当成 HTML。  
- **处理**：模板渲染对 JSON/JS 等输出 **关闭 HTML escape**（见 `template.ts` 注释）。  
- **教训**：脚手架渲染的是「代码与配置」，不是网页；默认 escape 是陷阱。

### P03 · 移动端 Vue Router：`./App.vue` 路径写错

- **现象**：`Failed to resolve import "./App.vue" from "src/router/index.ts"`。  
- **根因**：文件在 `src/App.vue`，从 `src/router/` 应写 `../App.vue`。  
- **处理**：改相对路径。  
- **教训**：AI 复制桌面模板时经常漏改一层目录；生成后至少 `dev` 冒烟。

### P04 · 缺 `postcss-html`（Vue Stylelint）

- **现象**：`Cannot resolve custom syntax module "postcss-html"`。  
- **根因**：`stylelint-config-standard-vue` 的 peer 没写进 `engineering-manifest`。  
- **处理**：补依赖清单。  
- **教训**：工程化「声明了 config」不等于「声明了跑得起来的 deps」；peer 依赖要显式落盘。

### P05 · ESLint：`.cjs` 报 `module is not defined`；cspell 不认识 `mirajay`

- **现象**：Strict/Standard 下 lint 失败。  
- **根因**：只配了 browser globals；自定义品牌词未进字典。  
- **处理**：对 `**/*.{cjs,mjs}` 配 Node globals；字典加 `mirajay` / `mirajay-cli`；跨端再补平台词。  
- **教训**：生成物自检时，**自己的项目名** 往往是第一批 false positive。

### P06 · Taro Vue 缺 `@vitejs/plugin-vue-jsx`

- **现象**：Taro Vue 启动直接挂。  
- **根因**：只装了 `@vitejs/plugin-vue`，Taro Vue3 链路还要 JSX 插件。  
- **处理**：补依赖 + 测试。  
- **教训**：跨端框架的「隐式 peer」比普通 Vite 应用多一截，不能按桌面 Vite 模板想当然。

### P07 · 微前端子应用 demo 命名串栈

- **现象**：React 方案文案/注册名仍是 `sub-app-vue` 等，看着像混栈。  
- **根因**：从混合 demo 拷贝后没改干净。  
- **处理**：同栈模板对齐命名；混栈留给 MF mixed 模板。  
- **教训**：文案和注册名也是「可运行契约」的一部分。

### P08 · 用户把 `build` 当成可访问页面

- **现象**：构建成功，却找不到 Local URL。  
- **根因**：产品提示不足；`build` ≠ `dev`。  
- **处理**：强化 next-steps、README、部分模板 `open: true`。  
- **教训**：脚手架成功页必须写清「下一步敲哪条命令」。

---

## 三、AI 偷工减料 / 空洞实现（最高发）

### P10 · 工程化「口头承诺」——最大一次空洞壳

- **现象**：README/文档写支持 ESLint、Prettier 等；交互几乎只问 markdownlint；生成项目 **没有** 对应配置文件与完整依赖合并。  
- **根因**：AI 先把「能力列表」写进文档与 prompts 皮，实现停留在业务 Hello World。  
- **处理**：引入 `engineering-base` + 预设（Minimal/Standard/Strict/Custom）+ `engineering-manifest` 合并依赖/脚本；用测试锁住。  
- **防再发**：  
  - 文档写「支持 X」之前，必须有「生成物含 X 文件」的测试或矩阵步骤；  
  - Prompt 选项与 `PRESET_DEFINITIONS` / 模板文件 **同 PR 落地**，禁止分期「先问后做」。

### P11 · Monorepo 辅助函数写了但没接线

- **现象**：勾选 Monorepo 仍得不到可用的 `apps/` + `packages/` 体验。  
- **根因**：layout/render 代码存在，却未真正挂进主生成流程。  
- **处理**：接入 `generateProject`，补 README 运行说明。  
- **防再发**：新模块合并前用「用户路径」验收：`create` 出来的目录树是否符合设计，而不是「仓库里有对应 ts 文件」。

### P12 · H5 选了 NutUI，生成仍是 Vant

- **现象**：UI 选择被忽略；列表里还曾出现易误导的 `uni-ui`。  
- **根因**：`mobile-h5-vue` 写死 Vant；`uiLibrary` 未参与渲染分支。  
- **处理**：按 `uiLibrary` 分支；H5 去掉 uni-ui；uni-app 模板接真实 uni-ui。  
- **防再发**：凡 prompts 出现的枚举，必须有 `ui-coverage` / 模板条件测试；禁止「选项装饰」。

### P13 · Taro 选 NutUI 同样不生效

- **现象**：选择写进答案，模板零注入。  
- **根因**：`mobile-taro` 未分支 `uiLibrary`。  
- **处理**：注入 NutUI-Taro、插件与示例页。  
- **防再发**：同 P12；跨端 UI 库是高发偷工点。

### P14 · Taro「能生成」但 H5 白屏 / 缺平台插件

- **现象**：缺 `@tarojs/plugin-platform-h5` 等；产物几乎只有空 HTML；小程序脚本不完整。  
- **根因**：按「最小 Vite 页」思路糊跨端骨架，未对齐官方 Taro 工程必备件。  
- **处理**：对齐 Taro 版本与平台插件、babel/dev/prod、HTML 入口占位等。  
- **防再发**：跨端模板必须以「官方 create 产物 diff」为基线，而不是桌面模板改名。

### P15 · Git 初始化了，却没有 `.gitignore`

- **现象**：提示 Git 已初始化，仓库级忽略文件缺失；身份未配时 commit 可能静默失败。  
- **根因**：只调了 `git init`，没渲染 `git-base`。  
- **处理**：`templates/git-base` + 合理本地 identity 回退。  
- **防再发**：`initGit: true` 的验收清单：至少 `.gitignore` 存在 + hooks 策略明确。

### P16 · Husky / commitlint 空壳 + Monorepo 放错目录

- **现象**：Standard 几乎没有真 hooks；有也塞进 `apps/web`；commitlint/cz 配置弱；装完不激活 husky。  
- **根因**：工程化「有开关」≠「文件落在正确 workspace 根」；AI 常按单包路径生成。  
- **处理**：Standard 纳入 hooks；hooks 落在 monorepo 根；install 后 `setupGitHooks`；规则补全。  
- **防再发**：Monorepo 下所有「仓库级工具」默认假设根目录，单测要断言路径。

### P17 · 微前端：选 Vue 仍生成 React 味模板

- **现象**：qiankun/wujie 等 prompts 收了 `framework`，`resolveTemplateName` 却忽略，一套混装模板打天下。  
- **根因**：为赶进度用「一个工具一个目录」，未按栈拆分。  
- **处理**：拆成 `-react` / `-vue`；MF 再区分同栈与 mixed。  
- **防再发**：`resolveTemplateName` 单测覆盖「每个 framework × tool」组合；禁止 answers 字段无消费者。

### P18 · 立项期：`doc.md` 愿景 ≫ 实现

- **现象**：早期 CLI 能力清单超前；工程化/Monorepo/CI/uni 等大量缺口；环境要求与文档也可能不一致。  
- **根因**：AI 擅长先写「完整设计文档 + 薄实现」。  
- **处理**：后续 P0–P3 与矩阵回归补齐。  
- **防再发**：文档分级——「已实现 / 规划中」必须分开；发布说明只写测过的矩阵单元。

---

## 四、复杂架构与工程化注入问题

### P20 · 工程化注入进 `packages/shared`，配置却只在 `apps/web`

- **现象**：`pnpm lint` 在 shared 上报「有 script/deps、无 eslint config」；web 侧 Prettier/Stylelint/Markdownlint 连环炸。  
- **根因**：`mergeEngineeringToWorkspacePackages` 对所有 workspace 包一视同仁。  
- **处理**：`shouldInjectWorkspaceEngineering()`，原则上只注入 `apps/*`；并修规则与模板格式。后续进一步统一为「根共享 Prettier 等 + `apps/*` 放 ESLint/Stylelint/Vitest」。  
- **防再发**：workspace 注入策略要有专门单测（本仓库 `monorepo-engineering` 相关测试即为此服务）。

### P33 · 全链路矩阵暴露的微前端模板缺陷（1.1.0）

- **现象**：`micro-wujie-vue` build 因 `fetch` 类型失败；MF Vue / mixed remote 的 `index.html` 仍指向 `main.tsx`；MF 根缺 `test`；混栈 Vue 宿主 ESLint 解析不了 `<script setup lang="ts">`。  
- **根因**：模板从 React 拷贝未改干净；工程化分层后根不再「顺带」带上 app 的 eslint，暴露宿主配置缺口；MF 根脚本未与 turbo `test` 对齐。  
- **处理**：修正 wujie `fetch` 类型；Vue remote 入口改为 `main.ts` + `#app`；MF 根补 `test`；Vue ESLint flat config 为 `*.vue` 挂 TypeScript parser。  
- **防再发**：`SCAFFOLD_MATRIX=1` 覆盖 MF 同栈/混栈的 install/build/lint/test。

### P34 · CI `typecheck` 批量失败：unused / 断言 / consola / hookable

- **现象**：Release / CI 跑 `pnpm typecheck`（`tsc --noEmit`，且 `noUnusedLocals`）直接挂，典型报错：
  - `TS6133`：`warn` / `info` / `profileUsesReact` 等 import 了未使用  
  - `TS2352`：`update-deps` 里把 `args.package`（citty 推断为 `string`）强转成 `string[]`  
  - `TS2502`：`hooks.ts` 里 `setup?: (hooks: typeof hooks) => ...`，`hooks` 在自己的类型注解中循环引用  
  - `TS2353`：`createConsola({ fancy: true })` —— 本仓库 `moduleResolution: "bundler"` 解析到 consola 的 **browser** 类型，`Partial<ConsolaOptions>` 没有 `fancy`  
  - `TS2554`：`pc.bold(pc.blue('→'), message)` —— picocolors 的 `bold` 只接受 1 个参数  
- **根因**：脚手架本体源码在文档/模板大改期间积了未使用导入与过时类型写法；依赖类型与打包条件导出（consola `node` vs `default`/`browser`）不一致；`typeof hooks` 自引用在严格检查下不过。  
- **处理**：
  - 删掉未使用导入（`doctor` / `test` / `remote-templates` / `engineering-manifest`）  
  - `args.package` 按 `string | string[]` 归一化后再 `flatMap`  
  - `registerPlugin` 参数改为 `Hookable<CliHooks>`，打断循环  
  - 去掉 `fancy`（Node 下 consola 默认已够用）；`step` 改为模板字符串拼接  
- **附带坑**：本机版本若是 Node 18，`vitest` 可能报 `node:events` 无 `addAbortListener`（需 Node ≥ 24.18，与 `engines` / CI 一致）；与本次 TS 修复无关，但会误判「测试也挂了」。  
- **防再发**：合并前本地用 **Node 24** 跑 `pnpm typecheck && pnpm test && pnpm build`（与 `ci.yml` / `release.yml` 门禁对齐）；改 logger / citty args / hookable 时注意类型条件导出与循环引用。

### P21 · shadcn：没有可用 `tsconfig` / paths 就去装组件

- **现象**：React + 工程化场景下 shadcn CLI 失败，页面缺组件样式结构。  
- **根因**：JS 模式或文件过滤把 `tsconfig` 跳过；shadcn 强依赖 paths。  
- **处理**：shadcn 场景强制保留/回退 tsconfig；补 `components.json`；过滤逻辑识别 `.ejs`。  
- **防再发**：第三方 CLI 的前置条件清单化，生成后自动安装前先 assert 文件存在。

### P22 · shadcn 装上了仍无样式 + Tailwind v4 层级战争

- **现象**：组件在，视觉像没 Tailwind；`p-6` 等 utility 失效。  
- **根因**：  
  1. theme 变量落在未接入的 css 文件；  
  2. `global.css` 里 **未分层** 的 `* { margin:0; padding:0 }` 压过 `@layer utilities`（Tailwind v4 典型坑）。  
- **处理**：theme 合并进实际入口 css；reset/body 放进 `@layer base`；补 `tw-animate-css`；去掉冲突覆盖。  
- **防再发**：凡 Tailwind v4 + 全局 reset，默认怀疑 cascade；视觉回归不能只看「依赖装没装」。

### P23 · shadcn 生成后 Prettier `--check` / Stylelint 不过

- **现象**：刚 create 完 `pnpm lint` 即失败。  
- **根因**：第三方生成代码未格式化；Stylelint 不认识 Tailwind v4 at-rules。  
- **处理**：lint 流程先 format；shadcn 后 format；stylelint 放行 `@theme` 等；prettierignore。  
- **防再发**：**生成物必须「开箱 lint 绿」**，否则 Standard 预设是在羞辱用户。

### P24 · 移动端 Monorepo：缺 tsconfig、Turbo script 契约不一致

- **现象**：H5 monorepo build 挂；Taro/uni/RN 根脚本对不上 Turbo `dev`/`build`。  
- **根因**：模板按单包脚本命名（`dev:h5`），Monorepo 底座假定统一 `dev`/`build`；tsconfig 被漏。  
- **处理**：补 tsconfig；根与 app 的 script alias 对齐。  
- **防再发**：Monorepo × 每类 mobile 至少一条矩阵用例。

### P25 · Flutter：没装 SDK 就禁止创建

- **现象**：本机无 Flutter 时直接中断脚手架。  
- **根因**：把「运行期依赖」误当成「生成期硬依赖」。  
- **处理**：改为警告仍生成；探测 FVM/`FLUTTER_ROOT`/常见路径；跳过 pnpm；有 SDK 再 `pub get`。  
- **防再发**：区分 generate-time vs runtime；`doctor` 负责环境，`create` 负责落盘。

---

## 五、环境、用法与认知类问题

### P30 · `dev:weapp`「起不来」

- **常见真实原因**：在脚手架仓库根目录跑、依赖没装、期待浏览器 URL（小程序要开发者工具打开 `dist`）。  
- **处理**：文档写清 cwd 与工具链预期。  
- **教训**：跨端成功标准不是「打印 localhost」。

### P31 · Node / 全局 link / 未 build

- **现象**：`command not found`；或 `Failed to load CLI. Did you run pnpm build?`。  
- **根因**：`bin/cli.mjs` 只加载 `dist/`；全局 link 未做；Node &lt; engines。  
- **处理**：开发文档强调 `build`/`dev` + `link`；`doctor` 查环境。  

### P32 · 文档编写阶段的 AI 问题（本仓库 doc 迭代中也出现过）

| 问题 | 表现 |
|------|------|
| FAQ / 章节截断或重复粘贴 | 同一章出现两套结尾 |
| 虚构公共 API | 写 `import { hooks } from 'mirajay-cli/core/hooks'`，包并未导出该子路径 |
| 能力写过头 | 「已支持插件市场」类表述，实际只有内部 hookable |
| 分册编号冲突 | 同时存在多份 `06-*.md` 需靠索引说明关系 |

**防再发**：文档合并前全文搜重复标题；对外 API 以 `package.json` exports 为准；示例代码至少能 typecheck 或注明「源码内扩展示意」。

---

## 六、安全相关（偏预防，不是线上事故）

脚手架攻击面不同于业务站，但仍有投入：

| 点 | 做法 |
|----|------|
| 框架 / UI / CSS / 微前端工具 / 预设 | `ALLOWED_*` 白名单 + `validateAnswers` |
| 远程模板源 | `validateRemoteTemplateSource`，拒绝 `;` `&` `` ` `` `$` 等危险字符，限制 giget 形态 |
| 回归 | `tests/security.test.ts` |

**教训**：AI 若直接把用户字符串拼进路径或 shell，极易埋命令注入；白名单要在「类型联合」之外再做运行时校验（CLI args / `-y` / 配置文件都可能绕过 prompts）。

---

## 七、测试与回归：为什么最后靠矩阵救命

### 发生过什么

全量「生成 → install → dev/build/lint/test」一度大量红：缺包、字典不全、模板半成品、工程化路径错误等交叉出现。中间矩阵从大量失败收敛到全绿（对话记录中曾到 **15/15** 场景 + 数十单测），并沉淀：

- `tests/helpers/scaffold-matrix.ts` / `scaffold-matrix.test.ts`  
- `scripts/run-scaffold-matrix.mjs`  
- 专题：`engineering*`、`monorepo-engineering`、`shadcn`、`micro-frontend`、`flutter-sdk`、`ui-coverage`、`security` 等  

### 核心认知

> 脚手架的 Bug 经常是 **静默错误**：文件被 filter 掉了、选项没分支、依赖没合并——单元测「函数返回值」测不出来，必须测 **生成目录契约**。

建议门禁：

1. 改 `template.ts` / filter / monorepo / engineering → 跑相关单测 + 至少 1 条矩阵；  
2. 改某个 `templates/<name>` → 对该 name 做 generate + lint（能装依赖则再 build）；  
3. 新增 prompts 选项 → 同步测试「答案字段被消费」。

---

## 八、问题全景速查表

| ID | 摘要 | 类别 |
|----|------|------|
| P01 | dist 后模板路径错误 | 简单 / 构建 |
| P02 | EJS 转义 `&&` | 模板 |
| P03 | Router `App.vue` 相对路径 | 模板 |
| P04 | 缺 `postcss-html` | 工程化 |
| P05 | CJS globals / cspell 词库 | 工程化 |
| P06 | Taro Vue 缺 jsx 插件 | 模板 |
| P07 | 微前端 demo 命名串栈 | 模板 |
| P08 | build/dev 认知与提示不足 | UX |
| P10 | 工程化空洞壳 | **AI 偷工** |
| P11 | Monorepo 未接线 | **AI 偷工** |
| P12 | H5 UI 选择无效 | **AI 偷工** |
| P13 | Taro NutUI 无效 | **AI 偷工** |
| P14 | Taro 平台插件/入口不全 | **AI 偷工** |
| P15 | 无 `.gitignore` | **AI 偷工** |
| P16 | Husky 空壳/路径错 | 工程化 + **AI 偷工** |
| P17 | 微前端忽略 framework | 架构 + **AI 偷工** |
| P18 | 文档超前实现 | **AI 偷工** / 文档 |
| P20 | shared 误注入工程化 | 复杂 / Monorepo |
| P21 | shadcn 缺 tsconfig | 模板 |
| P22 | Tailwind v4 层级 / theme 未接入 | 复杂 / CSS |
| P23 | 生成后 lint 不绿 | 工程化 |
| P24 | 移动 Monorepo script/tsconfig | 复杂 |
| P25 | Flutter SDK 硬阻断 | 环境设计 |
| P30–P32 | 用法、环境、文档 AI 幻觉 | 环境 / 文档 |
| P33 | MF/wujie 矩阵缺陷（入口/test/parser） | 模板 / 工程化 |
| P34 | CI typecheck（unused / citty 数组 / consola fancy / hookable 自引用） | 构建 / 类型 |
| 安全 | 白名单与远程源校验 | 预防 |

---

## 九、给「继续用 AI 写脚手架」的作业规范

1. **禁止选项装饰**：prompts 每增一项，同变更必须有消费者（模板分支或合并逻辑）+ 测试。  
2. **禁止文档超车**：README「支持列表」只能引用矩阵绿过的组合。  
3. **生成物开箱绿**：Standard 预设下，`lint`（及可行的 `build`）必须通过。  
4. **区分单包与 Monorepo 根**：husky、commitlint、workspace 工程化注入路径写进检查表。  
5. **打包后再测一次 CLI**：`pnpm build && node bin/cli.mjs create ...`，专抓 `dist` 路径类 bug。  
6. **跨端对官方骨架**：Taro/uni/RN/Flutter 不要从桌面 Vite 模板「脑补」。  
7. **CSS 与第三方 CLI 单独验收**：shadcn、Tailwind v4、Stylelint 不要假定「装上即美观」。  
8. **答案字段审计**：定期搜 `ProjectAnswers` 字段，找出「只采集不使用」的死字段。  
9. **对外 API 以包导出为准**：文档示例禁止虚构子路径。  
10. **矩阵是产品，不是锦上添花**：模板矩阵扩大时，先加测再加模板。

---

## 十、相关代码与文档锚点

| 主题 | 位置 |
|------|------|
| 模板目录双路径 | `src/core/templates-dir.ts` |
| EJS 禁用 HTML 转义 | `src/core/template.ts` |
| Workspace 工程化注入过滤 | `src/core/monorepo-engineering.ts` |
| 工程化预设与依赖清单 | `src/core/engineering-manifest.ts` |
| 远程源校验 | `src/core/remote-templates.ts` |
| 答案白名单 | `src/types.ts`、`src/commands/init.ts` |
| Flutter 降级策略 | `src/commands/init.ts`、`src/core/flutter-sdk.ts` |
| 矩阵回归 | `tests/helpers/scaffold-matrix.ts`、`scripts/run-scaffold-matrix.mjs` |
| Logger / Consola | `src/core/logger.ts` |
| Hookable 插件注册 | `src/core/hooks.ts` |
| update-deps 包名参数 | `src/commands/update-deps.ts` |
| 架构边界讨论 | [从零到企业级：架构深度审查](./从零到企业级：mirajay-cli%20脚手架架构深度审查.md) |
| 工程化说明 | [06-工程化体系](./06-工程化体系.md) |

---

## 十一、写在最后

脚手架开发的痛苦不在「会不会用 citty」，而在：

> **组合爆炸 × 静默失败 × AI 善于表演完整。**

mirajay-cli 后来能稳住，靠的不是一次写对，而是：把空洞壳拆成可合并的分层、把注入路径测死、用矩阵把「能生成」升级成「能跑能检」。  

若只记住一条：

**凡是 AI 声明「已经支持」的能力，请立刻用生成目录和一条真实命令打脸验证。**

---

**维护建议**：以后每修一类生成物事故，在本文件追加一条 `Pxx`，并链到对应测试名——踩坑文档本身也应纳入回归资产。
