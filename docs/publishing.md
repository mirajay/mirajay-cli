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

### 本地

```bash
pnpm install
pnpm docs:dev      # http://localhost:5173
pnpm docs:build    # 产出 docs/.vitepress/dist
pnpm docs:preview  # 预览构建结果
```

### GitHub Pages

1. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。
2. 推送 `main` 后，workflow [`.github/workflows/docs.yml`](../.github/workflows/docs.yml) 会构建并部署。
3. 站点地址一般为：

```text
https://YOUR_GITHUB_USERNAME.github.io/mirajay-cli/
```

CI 构建时设置 `VITEPRESS_BASE=/mirajay-cli/`，与项目站路径一致。若改用自定义域名或 `username.github.io` 根站，把 base 改成 `/`，并改 workflow 环境变量。

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

**Q: Pages 404？**  
检查 `base` 是否为 `/仓库名/`，以及 Actions 是否部署成功。

**Q: 本地文档 CSS 丢失？**  
确认用 `pnpm docs:dev`，不要直接打开 `dist` 里的 html（除非 `docs:preview`）。

**Q: npm 提示缺 dist？**  
先 `pnpm build`，或依赖 `prepublishOnly`；确认 `files` 含 `dist`。
