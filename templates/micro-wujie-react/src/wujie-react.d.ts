declare module 'wujie-react' {
  import type { FC, ReactNode } from 'react'

  export interface WujieReactProps {
    name?: string
    url?: string
    sync?: boolean
    width?: string
    height?: string
    children?: ReactNode
  }

  interface WujieReactStatic {
    setupApp: (config: Record<string, unknown>) => void
    preloadApp: (config: Record<string, unknown>) => void
  }

  const WujieReact: FC<WujieReactProps> & WujieReactStatic
  export default WujieReact
}
