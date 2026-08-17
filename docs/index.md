---
layout: home

hero:
  name: mirajay-cli
  text: 企业级前端脚手架
  tagline: 桌面 Web · 移动端 · 微前端 · 工程化预设 · Monorepo
  actions:
    - theme: brand
      text: 快速入门
      link: /00-快速入门
    - theme: alt
      text: 小白入门指南
      link: /mirajay-cli-小白入门指南
    - theme: alt
      text: 发布到 GitHub / npm
      link: /publishing

features:
  - title: 全端覆盖
    details: 桌面 Vue/React、H5/Taro/uni-app/RN/Flutter，以及 Module Federation / wujie / micro-app / qiankun。
  - title: 工程化可预设
    details: Minimal / Standard / Strict，ESLint、Prettier、Vitest、commitlint、husky 由 engineering-base 合并注入。
  - title: 模板可演进
    details: 本地 templates + giget 远程模板；update-deps 同步依赖版本；矩阵测试兜底回归。
---

## 学习路径

| 顺序 | 文档 | 收获 |
|------|------|------|
| 0 | [小白入门指南](/mirajay-cli-小白入门指南) | 一篇通关：使用 + 架构 + 源码 |
| 1 | [00 快速入门](/00-快速入门) | 10 分钟跑通第一个项目 |
| 2 | [01 → 07 分册](/01-项目总览) | 系统理解设计与实现 |
| — | [踩坑与 AI 复盘](/mirajay-cli-开发踩坑与AI编程复盘) | 真实问题与防再发 |

## 常用命令

```bash
pnpm install && pnpm build && pnpm link --global
mirajay-cli create my-app
mirajay-cli create my-app -y
mirajay-cli doctor
```

本地预览本文档站：

```bash
pnpm docs:dev
```
