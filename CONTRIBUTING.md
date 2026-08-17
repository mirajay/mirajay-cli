# 贡献指南

感谢你有兴趣为 mirajay-cli 做出贡献！

## 开发环境

- Node.js >= 24.18.0（项目根目录含 `.nvmrc`，可用 `nvm use` 切换）
- pnpm (推荐)

## 本地开发

```bash
git clone <repo-url>
cd mirajay-cli
pnpm install
pnpm dev
```

## 添加新模板

1. 在 `templates/` 下创建新目录
2. 使用 `.ejs` 后缀标记需要模板渲染的文件
3. 在 `src/core/template.ts` 的 `resolveTemplateName` 中添加匹配逻辑
4. 在 `src/core/prompts.ts` 中添加对应的交互选项
5. 添加测试用例

## 添加新命令

1. 在 `src/commands/` 下创建命令文件
2. 使用 citty 的 `defineCommand` 定义命令
3. 在 `src/index.ts` 中注册子命令
4. 如需扩展点，在 `src/core/hooks.ts` 中添加钩子

## 添加插件

插件通过 hookable 钩子系统扩展脚手架行为：

```ts
import { registerPlugin, hooks } from 'mirajay-cli'

registerPlugin({
  name: 'my-plugin',
  setup(hooks) {
    hooks.hook('init:after', async (ctx) => {
      // 项目创建后的自定义逻辑
    })
  },
})
```

## 提交规范

使用 Conventional Commits 规范：

- `feat:` 新功能
- `fix:` 修复
- `docs:` 文档
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具

## Pull Request

1. Fork 仓库
2. 创建功能分支
3. 提交变更
4. 确保测试通过 (`pnpm test`)
5. 发起 PR
