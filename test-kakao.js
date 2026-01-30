
import fs from 'fs';

// .env.local 직접 파싱 (dotenv 없이)
function loadEnv() {
  try {
    const content = fs.readFileSync('.env.local', 'utf8');
    const lines = content.split('\n');
    const env = {};
    lines.forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });
    return env;
  } catch (e) {
    return {};
  }
}

async function testKakao() {
  const env = loadEnv();
  const KAKAO_KEY = env.VITE_KAKAO_API_KEY;
  console.log(`[Test] Using Key: ${KAKAO_KEY ? KAKAO_KEY.slice(0, 4) + '...' : 'MISSING'}`);

  if (!KAKAO_KEY || KAKAO_KEY === 'your_kakao_rest_api_key_here') {
    console.error("[Test] Error: Kakao API Key is not set correctly in .env.local");
    return;
  }

  const lat = 37.4979;
  const lon = 127.0276;
  const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lon}&y=${lat}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_KEY}`
      }
    });

    const data = await res.json();
    console.log(`[Test] Status: ${res.status}`);
    console.log(`[Test] Response:`, JSON.stringify(data, null, 2));

    if (res.status === 403) {
      console.error("\n[Test] 403 Forbidden! Possible reasons:");
      console.error("1. REST API 키가 아님 (JavaScript 키일 확률 높음)");
      console.error("2. 카카오 설정에서 도메인(localhost:5173 또는 5174) 등록 안 됨");
      console.error("3. 키에 오타가 있음");
    } else if (res.status === 200) {
      console.log("\n[Test] Success! The key is valid.");
    }
  } catch (e) {
    console.error(`[Test] Fetch Error: ${e.message}`);
  }
}

testKakao();
