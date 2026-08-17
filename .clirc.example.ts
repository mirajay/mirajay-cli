import type { CliConfig } from './types.js'

/**
 * mirajay-cli 配置文件示例
 * 复制为 .clirc.ts 使用
 */
export default {
  /** 自定义模板目录（绝对路径或相对路径） */
  // templatesDir: './custom-templates',

  /** 默认包管理器 */
  defaultPackageManager: 'pnpm',

  /** 非交互模式 (-y) 默认工程化预设：minimal | standard | strict */
  defaultEngineeringPreset: 'standard',

  /** giget 远程模板映射（模板名 -> giget 源） */
  // remoteTemplates: {
  //   'desktop-react': 'gh:your-org/frontend-cli/templates/desktop-react',
  // },

  /** 远程模板缓存目录 */
  // templateCacheDir: '~/.cache/mirajay-cli/templates',
} satisfies CliConfig
