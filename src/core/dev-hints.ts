export interface DevRunHint {
  /** package.json script name */
  script: string
  /** Local dev server URL when applicable */
  url?: string
  /** Short explanation shown next to the dev command */
  note?: string
  /** Script to preview production build locally */
  previewScript?: string
  previewUrl?: string
}

const VITE_BROWSER_TEMPLATES = new Set([
  'desktop-react',
  'desktop-vue',
  'mobile-h5-react',
  'mobile-h5-vue',
  'mobile-uni-app',
  'micro-qiankun-react',
  'micro-qiankun-vue',
  'micro-wujie-react',
  'micro-wujie-vue',
  'micro-micro-app-react',
  'micro-micro-app-vue',
  'micro-module-federation-react',
  'micro-module-federation-vue',
  'micro-module-federation-mixed-react-vue',
  'micro-module-federation-mixed-vue-react',
])

function isStandaloneMicroFrontendTemplate(templateName: string): boolean {
  return (
    templateName.startsWith('micro-qiankun-') ||
    templateName.startsWith('micro-wujie-') ||
    templateName.startsWith('micro-micro-app-')
  )
}

function isModuleFederationTemplate(templateName: string): boolean {
  return templateName.startsWith('micro-module-federation-')
}

export function usesViteAutoOpen(templateName: string): boolean {
  return VITE_BROWSER_TEMPLATES.has(templateName)
}

export function getDevRunHint(templateName: string): DevRunHint {
  switch (templateName) {
    case 'desktop-react':
    case 'desktop-vue':
    case 'mobile-h5-react':
    case 'mobile-h5-vue':
      return {
        script: 'dev',
        url: 'http://localhost:5173',
        note: '启动开发服务器',
        previewScript: 'preview',
        previewUrl: 'http://localhost:4173',
      }
    case 'mobile-taro':
      return {
        script: 'dev:h5',
        url: 'http://localhost:10086',
        note: 'H5 浏览器开发；小程序请用 dev:weapp',
      }
    case 'mobile-uni-app':
      return {
        script: 'dev:h5',
        url: 'http://localhost:5173',
        note: 'H5 浏览器开发；微信小程序请用 dev:mp-weixin',
      }
    case 'mobile-rn':
      return {
        script: 'web',
        url: 'http://localhost:8081',
        note: 'Expo Web 预览；原生调试请用 start / android / ios',
      }
    case 'mobile-flutter':
      return {
        script: 'run',
        note: '在项目目录执行 flutter run（Web: flutter run -d chrome）',
      }
    case 'monorepo-base':
      return {
        script: 'dev',
        note: 'Monorepo 根目录启动各子包 dev',
      }
    default:
      if (isStandaloneMicroFrontendTemplate(templateName)) {
        return {
          script: 'dev',
          url: 'http://localhost:5173',
          note: '启动主应用开发服务器',
          previewScript: 'preview',
          previewUrl: 'http://localhost:4173',
        }
      }
      if (isModuleFederationTemplate(templateName)) {
        return {
          script: 'dev',
          url: 'http://localhost:5000',
          note: 'Monorepo 主应用（remote: http://localhost:5001）',
          previewScript: 'preview',
        }
      }
      return {
        script: 'dev',
        url: 'http://localhost:5173',
        note: '启动开发服务器',
        previewScript: 'preview',
        previewUrl: 'http://localhost:4173',
      }
  }
}
