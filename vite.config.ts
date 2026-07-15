import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const deepLApiKey = env.DEEPL_API_KEY?.trim()
  const deepLApiHost = deepLApiKey?.endsWith(':fx')
    ? 'https://api-free.deepl.com'
    : 'https://api.deepl.com'

  return {
    plugins: [react()],
    define: {
      __DEEPL_API_CONFIGURED__: JSON.stringify(Boolean(deepLApiKey)),
    },
    server: {
      proxy: {
        '/hotpepper-api': {
          target: 'https://webservice.recruit.co.jp',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/hotpepper-api/, ''),
        },
        '/deepl-api': {
          target: deepLApiHost,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/deepl-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyRequest) => {
              if (deepLApiKey) {
                proxyRequest.setHeader(
                  'Authorization',
                  `DeepL-Auth-Key ${deepLApiKey}`,
                )
              }
            })
          },
        },
      },
    },
  }
})
