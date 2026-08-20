# 发布指南：Git · GitHub · npm · VitePress Pages

> 本文是操作手册。占位符 `YOUR_GITHUB_USERNAME` 请全局替换成你的 GitHub 用户名；若仓库名不是 `mirajay-cli`，同步改 `base`、workflow 与 `package.json` 里的 URL。

---

## 0. 本机 Git 配置说明（只做一次）

**注意：** 仓库内脚本不会改你的全局 `git config`。以下命令请你在本机自行执行。

```bash
# 查看当前配置
git config --global --list

# 若尚未设置用户信息（提交必需）
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"

# 可选：默认主分支名
git config --global init.defaultBranch main

# 可选：HTTPS 凭据缓存 / SSH
# ssh-keygen -t ed25519 -C "你的邮箱"
# 把公钥加到 GitHub → Settings → SSH keys
```

安装 CLI（任选）：

```bash
# GitHub CLI（建仓、开 PR 方便）
brew install gh   # macOS
gh auth login

# npm 登录（发包用）
npm login
```

---

## 1. 初始化本仓库 Git 并推到 GitHub

在项目根目录：

```bash
# 若尚未 init（本仓库若已执行过可跳过）
git init
git add .
git status

# 统一主分支名为 main（当前 init 可能是 master）
git branch -M main

git commit -m "chore: initial commit with VitePress docs and CI drafts"

# 方式 A：GitHub CLI 一键建仓并推送
gh repo create mirajay-cli --public --source=. --remote=origin --push

# 方式 B：网页新建空仓库后
git branch -M main
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/mirajay-cli.git
git push -u origin main
```

推送前请全局替换文档与配置里的：

- `docs/.vitepress/config.ts` → `socialLinks` / `editLink`
- `package.json` → `repository` / `homepage` / `bugs`
- 本页与 README 中的用户名

---

## 2. 文档站（VitePress）

### 2.1 本地预览（可选，用来确认内容）

```bash
pnpm install
pnpm docs:dev      # http://localhost:5173
pnpm docs:build    # 产出 docs/.vitepress/dist
pnpm docs:preview  # 预览构建结果
```

本地 `docs:dev` 的 `base` 是 `/`；线上 GitHub Pages 项目站要用 `/mirajay-cli/`，由 CI 环境变量 `VITEPRESS_BASE` 注入（见 `.github/workflows/docs.yml`），**你平时改文档不用改 base**。

---

### 2.2 在 GitHub 网页上开通 Pages（重点：点哪里）

你的仓库是：https://github.com/mirajay/mirajay-cli  
目标文档地址：https://mirajay.github.io/mirajay-cli/

仓库里已经有部署文件：`.github/workflows/docs.yml`。你要做的是在 GitHub **打开 Pages 开关**，再让这个 workflow 跑一次。

#### 步骤 A：把 Pages 的发布来源改成 GitHub Actions

1. 浏览器打开仓库：https://github.com/mirajay/mirajay-cli  
2. 点顶部 **Settings**（设置）。  
   - 若看不到 Settings：说明你不是仓库 Owner/Admin，需要有权限的人操作，或先确认登录的是 `mirajay` 账号。  
3. 左侧栏往下找到 **Pages**（在 “Code and automation” 一组里）。  
4. 右侧 **Build and deployment** 区域：  
   - 找到 **Source**  
   - 下拉框不要选 `Deploy from a branch`（那是旧的 gh-pages 分支方式）  
   - 选 **GitHub Actions**  
5. 选好后页面会提示用 Actions 部署；到这里 **只是开通了能力**，还没有真正生成网站，需要再跑 workflow。

> 有的界面会显示 “Get started with a suggested workflow”——可以忽略，因为仓库里已经有 `docs.yml`。

#### 步骤 B：手动跑一次「Deploy docs」工作流（推荐首次这样）

因为 `docs.yml` 配置了 `paths` 过滤，只有改 `docs/` 等文件再 push 才会自动触发；**首次开通 Pages 后，建议手动跑一次**：

1. 打开仓库顶部 **Actions** 标签。  
2. 左侧 Workflows 列表点 **Deploy docs**。  
3. 右侧点 **Run workflow**（手动运行）。  
   - Branch 选 **main**  
   - 再点绿色 **Run workflow**  
4. 刷新后会出现一条新的运行记录，点进去看进度：  
   - 先有 job **build**（`pnpm docs:build`）  
   - 成功后再有 **deploy**  
5. 两个都变绿（绿色勾）即部署成功。

若 **build** 红了：点进失败步骤看日志（常见是 Node/pnpm/lockfile）。  
若 **deploy** 红了、提示 Pages 未配置：回到步骤 A，确认 Source 已是 **GitHub Actions**，再重新 Run workflow。

#### 步骤 C：第一次部署时可能弹出 Environment 授权

deploy job 使用了 environment `github-pages`：

1. 若 Actions 停在等待审批 / 或提示创建 environment：按页面提示 **Review deployments** → 勾选 `github-pages` → **Approve and deploy**。  
2. 也可到 **Settings → Environments** 查看是否已有 `github-pages`（一般第一次部署会自动出现）。

#### 步骤 D：打开文档站

1. 回到 **Settings → Pages**。  
2. 顶部 **Your site is live at …** 会出现链接，一般是：

```text
https://mirajay.github.io/mirajay-cli/
```

3. 浏览器打开该地址。若刚部署完，等 1～2 分钟再刷新。  
4. **不要**只打开 `https://mirajay.github.io/`（那是账号根站，不是这个仓库的项目站）。

`package.json` 里 `homepage` 已写成上述 URL，与仓库名一致即可。

---

### 2.3 以后改文档怎么更新站点？

任选其一：

| 方式 | 怎么做 |
|------|--------|
| 自动 | 改 `docs/` 下内容 → `git push` 到 `main` → Actions 里 `Deploy docs` 自动跑 |
| 手动 | Actions → Deploy docs → Run workflow |

**不用**把 `docs/.vitepress/dist` 提交进仓库，也不用手动上传任何文件。

---

### 2.4 和 VitePress `base` 的关系（理解即可）

| 场景 | base | 谁设置 |
|------|------|--------|
| 本地 `pnpm docs:dev` | `/` | `config.ts` 默认 |
| 线上 Pages 项目站 | `/mirajay-cli/` | CI：`VITEPRESS_BASE: /mirajay-cli/` |

若仓库改名了，三处一起改：

1. `.github/workflows/docs.yml` 里的 `VITEPRESS_BASE`  
2. `package.json` 的 `homepage`  
3. （可选）文档里写死的链接  

若将来用自定义域名或 `mirajay.github.io` 用户根站仓库，把 base 改成 `/`。

---

### 2.5 自检清单

- [ ] Settings → Pages → Source = **GitHub Actions**  
- [ ] Actions → Deploy docs 最近一次 **build + deploy 全绿**  
- [ ] 能打开 https://mirajay.github.io/mirajay-cli/  
- [ ] 首页 CSS/侧栏正常（若样式全无，多半是 base 配错成了 `/`）  
- [ ] 本地仍用 `pnpm docs:dev` 预览草稿  

---

## 3. 发布到 npm

本包名：`mirajay-cli`。 
GitHub：https://github.com/mirajay/mirajay-cli  
安装后命令：`mirajay-cli`

`files` 已限制只发布 `bin` / `dist` / `templates`；`docs/`、`src/`、`tests/` **不会**进包。  
`prepublishOnly` 会在正式 `publish` 前自动执行 `pnpm build`。

---

### 3.1 注册 / 登录 npm（本机只做一次）

1. 打开 https://www.npmjs.com/signup 注册账号（可用 GitHub 关联）。  
2. 邮箱验证通过后再继续。  
3. 本机终端登录（任选一种）：

```bash
# 推荐：浏览器登录（新版 npm）
npm login

# 或
npm adduser
```

按提示完成浏览器授权或输入用户名/密码/邮箱。  
验证是否登录成功：

```bash
npm whoami
# 应打印你的 npm 用户名，例如 mirajay
```

> 未登录时 `npm whoami` 会报 `ENEEDAUTH`，先完成上面步骤。

---

### 3.2 发布前自检（强烈建议）

在项目根目录，建议使用 **Node ≥ 24.18**（与 `engines` 一致）：

```bash
cd /path/to/mirajay-cli   # 你的本地仓库
node -v                   # 建议 v24.18+
pnpm install
pnpm typecheck
pnpm test
pnpm build

# 看最终会打进包的文件（不要出现 docs、src、tests、node_modules）
npm pack --dry-run
```

期望列表大致包含：

- `package.json`
- `bin/cli.mjs`
- `dist/...`（构建产物）
- `templates/...`

可选：补全 `package.json` 的 `author`（npm 页会显示）：

```json
"author": "mirajay"
```

确认 `repository` / `homepage` / `bugs` 已指向 GitHub 与文档站（当前已配置好可跳过）。

---

### 3.3 干跑发布（不真正上传）

```bash
npm publish --dry-run
```

会模拟打包与发布流程，**不会**真正发到 npm。确认无报错即可。

---

### 3.4 正式发布（第一次）

当前版本是 `1.0.0`。首次发布：

```bash
npm publish
```

成功后：

1. 打开 https://www.npmjs.com/package/mirajay-cli 应能看到包页。  
2. 另开终端验证安装：

```bash
npm view mirajay-cli version
npx mirajay-cli --help
# 或
npm i -g mirajay-cli
mirajay-cli --help
```

> 若提示包名已被占用：改 `name` 为 scope 包，例如 `"name": "@mirajay/cli"`，并执行  
> `npm publish --access public`。

---

### 3.5 以后怎么发新版本？

**不要**直接改版本号却忘记打 tag；推荐：

```bash
# 1. 改完代码，测试通过，先推到 GitHub
git add .
git commit -m "feat: xxx"
git push origin main

# 2. 升版本（会改 package.json 并自动打 git tag）
npm version patch   # 修 bug：1.0.0 → 1.0.1
# npm version minor # 新功能：1.0.0 → 1.1.0
# npm version major # 破坏性变更：1.0.0 → 2.0.0

# 3. 推送提交与 tag
git push origin main --follow-tags

# 4. 发布到 npm（同一版本只能发一次，不能覆盖）
npm publish
```

同一 `version` 发过之后不能再发；要修只能再升版本（如 `1.0.2`）。

---

### 3.6 用 GitHub Actions 自动发 npm（配置 Secrets + workflow）

仓库文件：[`.github/workflows/release.yml`](../.github/workflows/release.yml)。

#### 你需要准备什么？

| Token | 要不要放进 GitHub Secrets？ | 说明 |
|-------|---------------------------|------|
| **npm token** | **要**，名称必须叫 `NPM_TOKEN` | 用来 `npm publish` |
| **GitHub PAT / token** | **一般不要** | Actions 自带 `GITHUB_TOKEN`，checkout/读仓库够用；只有你要跨仓库操作才需要自建 PAT |

#### A. 在 npm 上创建 Token

1. 登录 https://www.npmjs.com/  
2. 右上角头像 → **Access Tokens**（或打开 https://www.npmjs.com/settings/~/tokens ）  
3. **Generate New Token**：  
   - 推荐 **Granular Access Token**  
     - Permissions：对包 `mirajay-cli` 勾选 **Read and write**（或 Organizations 下 publish）  
     - 或经典 **Automation** token（适合 CI，不会因 2FA 卡住）  
4. 复制生成的字符串（只显示一次），形如 `npm_xxxx...`

#### B. 在 GitHub 仓库里添加 Secret（网页点选）

1. 打开 https://github.com/mirajay/mirajay-cli  
2. **Settings** → 左侧 **Secrets and variables** → **Actions**  
3. **New repository secret**  
4. 填写：  
   - **Name**：`NPM_TOKEN`（必须与 workflow 里 `secrets.NPM_TOKEN` 一致）  
   - **Secret**：粘贴刚才的 npm token  
5. 点 **Add secret**

> 不要把 token 写进 `release.yml` 明文，也不要提交到仓库。

#### C. workflow 里关键几行（已写好，理解即可）

```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: 24
    registry-url: https://registry.npmjs.org   # 必须，才会写 npm 登录配置

- name: Publish to npm
  run: npm publish --access public --provenance
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}  # 读取你配置的 Secret
```

#### D. 怎么触发自动发布？

**方式 1：打版本 tag（推荐）**

先保证 `package.json` 的 `version` 已升到要发的版本，并已 push 到 `main`：

```bash
# 本地改完并测试通过后
npm version patch          # 例如 1.0.0 → 1.0.1，并生成 tag v1.0.1
git push origin main --follow-tags
```

推送 `v*` tag 会触发 **Release npm** workflow，自动 `npm publish`。

**方式 2：Actions 手动跑**

1. 仓库 → **Actions** → 左侧 **Release npm**  
2. **Run workflow**  
3. 可选勾选 **dry_run**（只演练不上传）  
4. 不勾 dry_run 则按当前 `package.json` 的 version 真正发布  

注意：手动跑前，`package.json` 的 version 必须是 npm 上**还没有**的版本。

#### E. 自检

- [ ] Secrets 里有 `NPM_TOKEN`  
- [ ] `release.yml` 已在 `main`  
- [ ] Actions → Release npm 跑绿  
- [ ] https://www.npmjs.com/package/mirajay-cli 版本已更新  

#### F. 常见报错

| 现象 | 处理 |
|------|------|
| `ENEEDAUTH` / 401 | Secret 名不是 `NPM_TOKEN`，或 token 无效/过期，重新生成并更新 Secret |
| **403 … Two-factor authentication or granular access token with bypass 2fa** | 见下方 **§3.6.1**（最常见） |
| 403 Forbidden（其它） | token 权限不够，或包名不属于你的账号 |
| 不能覆盖已有版本 | 先 `npm version patch` 再推 tag |
| `--provenance` 失败 | 已从默认流程去掉；需要时可再加回并确认 `id-token: write` |
| Actions 只看到 `exit code 1` / log 路径 | 在失败步骤日志里**往上翻**，找 `npm error code` / `403` / `ENEEDAUTH` |
| Secret 为空 | Settings → Secrets 确认名称正好是 `NPM_TOKEN`，且用的是 **npm** token |
| 用了 GitHub PAT 当 NPM_TOKEN | 无效；必须换成 npmjs.com 生成的 token |

#### 3.6.1 专门处理：403 要求 2FA / granular bypass 2fa

报错原文类似：

```text
403 Forbidden - Two-factor authentication or granular access token
with bypass 2fa enabled is required to publish packages.
```

说明：npm 现在要求「开了 2FA」或「带绕过 2FA 的 Granular Token」才能 publish。CI 里用的 token 类型不对就会 403。

**推荐做法（适合 GitHub Actions）：**

1. 打开 https://www.npmjs.com/settings/~/tokens  
2. **Generate New Token → Granular Access Token**  
3. 关键选项大致这样填：  
   - **Token name**：`github-actions-mirajay-cli`  
   - **Expiration**：按需（如 90 days / 1 year）  
   - **Packages and scopes**：选 **Read and write**  
   - 在包权限里允许对 `mirajay-cli`（或 “All packages”）的 **publish**  
   - 必须勾选类似：  
     **Bypass two-factor authentication** / **Bypass 2FA for automation**  
     （没有这一项，CI 仍会 403）  
4. 生成后复制 token → 更新 GitHub Secret `NPM_TOKEN`（旧的删掉重加，或 Update）  
5. 再跑 **Release npm**

**备选做法：**

1. 账号开启 2FA：npm → Account → **Two-Factor Authentication**  
2. 再生成经典 **Automation** token（专门给 CI，不受登录 2FA 交互卡住）  
3. 把 Automation token 设为 `NPM_TOKEN`

> 不要用：仅 Read-only 的 token、未勾选 bypass 2fa 的 granular token、GitHub PAT。

本地若也要发：开 2FA 后用 `npm login`，或同样使用带 bypass 的 granular / automation token 写入本机 `~/.npmrc`（勿提交进仓库）。

---

### 3.7 npm 发布检查清单

- [ ] `npm whoami` 已登录  
- [ ] `pnpm test` / `pnpm build` 通过  
- [ ] `npm pack --dry-run` 文件列表正确  
- [ ] `npm publish --dry-run` 无报错  
- [ ] `npm publish` 成功  
- [ ] https://www.npmjs.com/package/mirajay-cli 可打开  
- [ ] `npx mirajay-cli --help` 可用  

---

## 4. CI 说明

| Workflow | 作用 |
|----------|------|
| `ci.yml` | `main` / PR：install → typecheck → test → build |
| `docs.yml` | `main` 且 docs 变更：构建 VitePress → GitHub Pages |
| `release.yml` | 可选：tag / 手动触发时 `npm publish` |

首次启用 Pages 后，在 Actions 里确认 `Deploy docs` 成功，再打开 Pages URL。

---

## 5. 推荐检查清单

- [ ] 本机 `user.name` / `user.email` 已配置
- [ ] GitHub 仓库已创建并 `git push`
- [ ] 替换所有 `YOUR_GITHUB_USERNAME`
- [ ] `pnpm docs:dev` 侧栏与首页正常
- [ ] Settings → Pages → Source = GitHub Actions
- [ ] `pnpm pack --dry-run` 文件列表正确
- [ ] `npm publish` 成功
- [ ] README / `homepage` 指向文档站

---

## 6. 常见问题

**Q: Actions 报「指定了多个版本的 pnpm」？**  
`pnpm/action-setup` 的 `version` 与 `package.json` 的 `packageManager` 不能同时指定。本仓库保留 `packageManager: pnpm@9.15.0`，workflow 里不要再写 `version:`。

**Q: Pages 404？**  
检查 `base` 是否为 `/仓库名/`，以及 Actions 是否部署成功。

**Q: 本地文档 CSS 丢失？**  
确认用 `pnpm docs:dev`，不要直接打开 `dist` 里的 html（除非 `docs:preview`）。

**Q: npm 提示缺 dist？**  
先 `pnpm build`，或依赖 `prepublishOnly`；确认 `files` 含 `dist`。

**Q: `npm whoami` 报 ENEEDAUTH？**  
本机未登录：执行 `npm login` 完成浏览器/账号登录后再发。

**Q: 发布报 403 / 包名不可用？**  
包名已被别人占用，或你没有该包权限。换 `name`，或用 scope：`@mirajay/cli` + `npm publish --access public`。

**Q: 同一版本再次 publish 失败？**  
npm 不允许覆盖已发布版本。执行 `npm version patch` 后再 `npm publish`。

名称包
作者