import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/hotpepper-api': {
        target: 'https://webservice.recruit.co.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hotpepper-api/, ''),
      },
    },
  },
})
