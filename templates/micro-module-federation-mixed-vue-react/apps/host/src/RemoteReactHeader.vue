<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const container = ref<HTMLDivElement | null>(null)
let root: Root | null = null

onMounted(async () => {
  const RemoteHeader = (await import('remoteApp/Header')).default
  if (!container.value) return
  root = createRoot(container.value)
  root.render(createElement(RemoteHeader))
})

onUnmounted(() => {
  root?.unmount()
  root = null
})
</script>

<template>
  <div ref="container" />
</template>
