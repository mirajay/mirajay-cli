/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'remoteApp/Header' {
  import type { ComponentType } from 'react'
  const Header: ComponentType
  export default Header
}
