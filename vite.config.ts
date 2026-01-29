import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .env 파일 로드
  const env = loadEnv(mode, process.cwd(), '');
  const WEATHER_KEY = env.VITE_WEATHER_API_KEY;

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
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      }),
    ],
    server: {
      proxy: {
        '/api/weather': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const queryString = path.split('?')[1] || '';
            const baseApiUrl = '/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
            return `${baseApiUrl}?serviceKey=${encodeURIComponent(WEATHER_KEY)}&dataType=JSON&pageNo=1&numOfRows=1000&${queryString}`;
          }
        },
        '/api/forecast': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const queryString = path.split('?')[1] || '';
            // 단기예보 조회 서비스
            const baseApiUrl = '/1360000/VilageFcstInfoService_2.0/getVilageFcst';
            return `${baseApiUrl}?serviceKey=${encodeURIComponent(WEATHER_KEY)}&dataType=JSON&pageNo=1&numOfRows=1000&${queryString}`;
          }
        },
        '/api/mid-land': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const queryString = path.split('?')[1] || '';
            // 중기 육상 예보
            const baseApiUrl = '/1360000/MidFcstInfoService/getMidLandFcst';
            return `${baseApiUrl}?serviceKey=${encodeURIComponent(WEATHER_KEY)}&dataType=JSON&pageNo=1&numOfRows=10&${queryString}`;
          }
        },
        '/api/mid-ta': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const queryString = path.split('?')[1] || '';
            // 중기 기온 예보
            const baseApiUrl = '/1360000/MidFcstInfoService/getMidTa';
            return `${baseApiUrl}?serviceKey=${encodeURIComponent(WEATHER_KEY)}&dataType=JSON&pageNo=1&numOfRows=10&${queryString}`;
          }
        },
        '/api/dust-proxy': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            // path: /api/dust-proxy?serviceKey=...&stationName=...
            // 이를 /B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?... 로 변경
            const queryString = path.split('?')[1] || '';
            const baseApiUrl = '/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty';
            return `${baseApiUrl}?${queryString}`;
          }
        }
      }
    }
  }
})

