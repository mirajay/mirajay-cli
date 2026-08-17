import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'remoteApp',
      filename: 'remoteEntry.js',
      exposes: {
        './Header': './src/Header.vue',
      },
      shared: ['vue'],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: { port: 5001 },
})
