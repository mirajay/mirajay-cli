export type EngineeringPreset = 'minimal' | 'standard' | 'strict' | 'custom'

export interface EngineeringOptions {
  preset: EngineeringPreset
  eslint: boolean
  prettier: boolean
  stylelint: boolean
  markdownlint: boolean
  spellcheck: boolean
  vitest: boolean
  commitlint: boolean
  husky: boolean
  lintStaged: boolean
}

export interface ProjectAnswers {
  projectType: 'desktop' | 'mobile' | 'micro-frontend'
  framework?: 'react' | 'vue'
  uiLibrary?: string
  cssFramework?: 'tailwindcss' | 'unocss' | 'none'
  mobilePlatform?: 'h5' | 'taro' | 'uni-app' | 'react-native' | 'flutter'
  flutterStateManagement?: 'Provider' | 'Riverpod' | 'Bloc'
  flutterTargetPlatforms?: string[]
  flutterMaterial3?: boolean
  flutterInternationalization?: boolean
  microFrontendTool?: 'module-federation' | 'wujie' | 'micro-app' | 'qiankun'
  /** Module Federation：同栈或混合栈演示 */
  microFrontendStackMode?: 'same' | 'mixed'
  /** Module Federation 远程子应用框架（同栈时与 framework 相同） */
  remoteFramework?: 'react' | 'vue'
  useMonorepo?: boolean
  /** @deprecated Use `engineering.markdownlint` instead */
  needMarkdownlint?: boolean
  engineering?: EngineeringOptions
  packageManager?: 'pnpm' | 'yarn' | 'bun' | 'npm'
  initGit?: boolean
  /** 是否使用 TypeScript（默认 true；Taro / uni-app / RN / Flutter 固定为 true） */
  useTypeScript?: boolean
}

export interface TemplateMeta {
  name: string
  description: string
  match: (answers: ProjectAnswers) => boolean
}

export interface CliConfig {
  templatesDir?: string
  defaultPackageManager?: 'pnpm' | 'yarn' | 'bun' | 'npm'
  defaultEngineeringPreset?: EngineeringPreset
  /** giget 远程模板映射，如 { 'desktop-react': 'gh:org/repo/templates/desktop-react' } */
  remoteTemplates?: Record<string, string>
  /** 远程模板缓存目录，默认 ~/.cache/mirajay-cli/templates */
  templateCacheDir?: string
}

export const ALLOWED_ENGINEERING_PRESETS = new Set<EngineeringPreset>([
  'minimal',
  'standard',
  'strict',
  'custom',
])

export const ALLOWED_UI_LIBRARIES = new Set([
  'element-plus',
  'ant-design-vue',
  'naive-ui',
  'vuetify',
  'primevue',
  'antd',
  '@mui/material',
  '@nextui-org/react',
  'shadcn-ui',
  '@mantine/core',
  '@chakra-ui/react',
  'vant',
  '@nutui/nutui',
  '@dcloudio/uni-ui',
  'antd-mobile',
  'react-vant',
])

export const ALLOWED_FRAMEWORKS = new Set(['react', 'vue'])

export const ALLOWED_CSS_FRAMEWORKS = new Set(['tailwindcss', 'unocss', 'none'])

export const ALLOWED_MICRO_STACK_MODES = new Set(['same', 'mixed'])

export const ALLOWED_MICRO_TOOLS = new Set([
  'module-federation',
  'wujie',
  'micro-app',
  'qiankun',
])

export const ALLOWED_MOBILE_PLATFORMS = new Set([
  'h5',
  'taro',
  'uni-app',
  'react-native',
  'flutter',
])
