import { useEffect, useRef } from 'react'
import { createApp, type App as VueApp } from 'vue'

export function RemoteVueHeader() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<VueApp | null>(null)

  useEffect(() => {
    let mounted = true

    import('remoteApp/Header').then((mod) => {
      if (!mounted || !containerRef.current) return
      appRef.current = createApp(mod.default)
      appRef.current.mount(containerRef.current)
    })

    return () => {
      mounted = false
      appRef.current?.unmount()
      appRef.current = null
    }
  }, [])

  return <div ref={containerRef} />
}
