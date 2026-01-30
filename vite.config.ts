import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .env 파일 로드
  const env = loadEnv(mode, process.cwd(), '');
  const WEATHER_KEY = env.VITE_WEATHER_API_KEY;
  const DUST_KEY = env.VITE_DUST_API_KEY;
  const KAKAO_KEY = env.VITE_KAKAO_API_KEY;

  console.log(`[ViteConfig] Keys loaded: Weather(${!!WEATHER_KEY}), Dust(${!!DUST_KEY}), Kakao(${!!KAKAO_KEY})`);
  if (KAKAO_KEY) console.log(`[ViteConfig] Kakao Key starts with: ${KAKAO_KEY.slice(0, 4)}...`);

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
            const baseApiUrl = '/1360000/MidFcstInfoService/getMidTa';
            return `${baseApiUrl}?serviceKey=${encodeURIComponent(WEATHER_KEY)}&dataType=JSON&pageNo=1&numOfRows=10&${queryString}`;
          }
        },
        '/api/tm-coord': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const queryString = path.split('?')[1] || '';
            const baseApiUrl = '/B552584/MsrstnInfoInqireSvc/getTMStdrCrdnt';
            return `${baseApiUrl}?serviceKey=${encodeURIComponent(DUST_KEY)}&returnType=json&${queryString}`;
          }
        },
        '/api/nearby-station': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const queryString = path.split('?')[1] || '';
            const baseApiUrl = '/B552584/MsrstnInfoInqireSvc/getNearbyMsrstnList';
            return `${baseApiUrl}?serviceKey=${encodeURIComponent(DUST_KEY)}&returnType=json&${queryString}`;
          }
        },
        '/api/sido-dust': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const queryString = path.split('?')[1] || '';
            const baseApiUrl = '/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty';
            return `${baseApiUrl}?serviceKey=${encodeURIComponent(DUST_KEY)}&returnType=json&numOfRows=200&${queryString}`;
          }
        },
        '/api/dust': {
          target: 'https://apis.data.go.kr',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => {
            const queryString = path.split('?')[1] || '';
            const baseApiUrl = '/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty';
            return `${baseApiUrl}?serviceKey=${encodeURIComponent(DUST_KEY)}&returnType=json&${queryString}`;
          }
        },
        '/api/kakao-address': {
          target: 'https://dapi.kakao.com',
          changeOrigin: true,
          secure: false,
          headers: {
            'Authorization': `KakaoAK ${KAKAO_KEY}`
          },
          rewrite: (path) => {
            const queryString = path.split('?')[1] || '';
            return `/v2/local/geo/coord2address.json?${queryString}`;
          }
        }
      }
    }
  }
})

