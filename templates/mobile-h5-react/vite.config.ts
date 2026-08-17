import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postcssPxToRem from 'postcss-pxtorem'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true, open: true },
  css: {
    postcss: {
      plugins: [
        postcssPxToRem({
          rootValue: 37.5,
          propList: ['*'],
          selectorBlackList: ['.norem'],
        }),
      ],
    },
  },
})
