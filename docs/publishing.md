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

### 发布前检查

```bash
pnpm install
pnpm typecheck   # 若脚本存在
pnpm test
pnpm build
pnpm pack --dry-run   # 确认只有 bin / dist / templates
```

`package.json` 的 `files` 已限制发布内容；`docs/`、`src/`、`tests/` **不会**进 npm 包。`prepublishOnly` 会在 publish 前自动 `pnpm build`。

### 包名

到 npm 确认 `mirajay-cli` 是否可用。被占用则改名或使用 scope：

```json
{ "name": "@YOUR_NPM_SCOPE/mirajay-cli", "publishConfig": { "access": "public" } }
```

### 发布

```bash
npm login
npm publish --dry-run
npm publish
# scope 包：
# npm publish --access public
```

版本迭代：

```bash
npm version patch   # 或 minor / major
git push && git push --tags
npm publish
```

###（可选）用 GitHub Actions 发 npm

草稿见 [`.github/workflows/release.yml`](../.github/workflows/release.yml)。需要：

1. npm 建 Access Token（Automation）
2. 仓库 Secrets 增加 `NPM_TOKEN`
3. 打 tag 或手动 `workflow_dispatch` 触发

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
