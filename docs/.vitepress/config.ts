import { defineConfig } from 'vitepress'

/**
 * GitHub Pages 项目站默认 base 为 `/<repo>/`。
 * 本地开发用 `/`；CI 构建时通过环境变量 VITEPRESS_BASE=/mirajay-cli/ 注入。
 * 若仓库名不是 mirajay-cli，请同步改 workflows 与此处默认值。
 */
const base = process.env.VITEPRESS_BASE || '/'

export default defineConfig({
  title: 'mirajay-cli',
  description: '企业级前端脚手架 - 桌面 Web · 移动端 · 微前端',
  lang: 'zh-CN',
  base,
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  head: [['link', { rel: 'icon', href: `${base}favicon.svg` }]],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'mirajay-cli' },
    siteTitle: 'mirajay-cli',
    outline: { label: '本页目录', level: [2, 3] },
    socialLinks: [
      // 推到 GitHub 后改成真实地址
      { icon: 'github', link: 'https://github.com/mirajay/mirajay-cli' },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有结果',
            resetButtonTitle: '清除',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
    nav: [
      { text: '指南', link: '/00-快速入门' },
      { text: '小白入门', link: '/mirajay-cli-小白入门指南' },
      { text: '变更日志', link: '/changelog' },
      { text: '踩坑复盘', link: '/mirajay-cli-开发踩坑与AI编程复盘' },
      { text: '发布说明', link: '/publishing' },
      {
        text: '进阶',
        items: [
          { text: '架构深度审查', link: '/从零到企业级：mirajay-cli 脚手架架构深度审查' },
          { text: '企业级深度解析', link: '/mirajay-cli-企业级前端脚手架深度解析' },
          { text: '架构设计与实现', link: '/mirajay-cli-脚手架架构设计与实现' },
        ],
      },
    ],
    sidebar: [
      {
        text: '开始',
        collapsed: false,
        items: [
          { text: '文档中心', link: '/' },
          { text: '快速入门', link: '/00-快速入门' },
          { text: '小白入门指南', link: '/mirajay-cli-小白入门指南' },
          { text: '版本变更与迭代', link: '/changelog' },
          { text: 'GitHub / npm / Pages 发布', link: '/publishing' },
        ],
      },
      {
        text: '系统学习',
        collapsed: false,
        items: [
          { text: '01 项目总览', link: '/01-项目总览' },
          { text: '02 架构设计', link: '/02-架构设计' },
          { text: '03 核心模块详解', link: '/03-核心模块详解' },
          { text: '04 命令系统详解', link: '/04-命令系统详解' },
          { text: '05 模板系统详解', link: '/05-模板系统详解' },
          { text: '06 工程化体系', link: '/06-工程化体系' },
          { text: '06 工程化配置详解', link: '/06-工程化配置详解' },
          { text: '07 开发指南', link: '/07-开发指南' },
        ],
      },
      {
        text: '复盘与深度',
        collapsed: true,
        items: [
          { text: '开发踩坑与 AI 编程复盘', link: '/mirajay-cli-开发踩坑与AI编程复盘' },
          { text: '架构深度审查', link: '/从零到企业级：mirajay-cli 脚手架架构深度审查' },
          { text: '企业级深度解析', link: '/mirajay-cli-企业级前端脚手架深度解析' },
          { text: '架构设计与实现', link: '/mirajay-cli-脚手架架构设计与实现' },
          { text: '补充笔记 doc.md', link: '/doc' },
        ],
      },
    ],
    editLink: {
      pattern: 'https://github.com/mirajay/mirajay-cli/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © mirajay-cli',
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
  },
})
