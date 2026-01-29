import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .env 파일 로드 (VITE_WEATHER_API_KEY 사용을 위해)
  const env = loadEnv(mode, process.cwd(), '');
  const SERVICE_KEY = env.VITE_WEATHER_API_KEY;

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'Weather App',
          short_name: 'Weather',
          description: 'Weather Information App',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),
    ],
    server: {
      proxy: {
        '/api/weather': { // 프론트와 동일한 경로
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            // path: /api/weather?nx=...

            // 쿼리 스트링 추출
            const queryString = path.split('?')[1] || '';
            const baseApiUrl = '/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';

            // 로컬 개발 시에는 Vite Proxy가 "백엔드 역할"을 수행하여 키를 주입
            return `${baseApiUrl}?serviceKey=${SERVICE_KEY}&dataType=JSON&pageNo=1&numOfRows=1000&${queryString}`;
          }
        }
      }
    }
  }
})
