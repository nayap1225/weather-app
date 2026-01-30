
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env.local에서 API 키 읽기
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/VITE_DUST_API_KEY=([^\s]+)/);
let API_KEY = apiKeyMatch ? apiKeyMatch[1] : null;

if (!API_KEY) {
  console.error("API KEY not found in .env.local");
  process.exit(1);
}

// Decoding Key -> Encoding Key (if necessary, but usually standard fetch handles it)
// If the key in .env is already encoded, we use it. If decoded, we might need to encode it.
// AirKorea usually needs the encoded key.

async function testAnsanDust() {
  const sidoName = encodeURIComponent('경기');
  // ver 1.3
  const url = `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${API_KEY}&returnType=json&numOfRows=1000&pageNo=1&sidoName=${sidoName}&ver=1.3`;

  console.log(`Fetching dust info for Gyeonggi-do...`);
  try {
    const res = await fetch(url);
    const json = await res.json();

    if (json.response?.header?.resultCode !== '00') {
      console.error("API Error:", json.response?.header);
      process.exit(1);
    }

    const items = json.response?.body?.items;
    if (!items) {
      console.error("No items in response body");
      process.exit(1);
    }

    console.log(`Total stations in Gyeonggi: ${items.length}`);

    // 안산 관련 측정소 필터링
    const ansanStations = items.filter(item =>
      item.stationName.includes('안산') ||
      item.stationName.includes('상록') ||
      item.stationName.includes('단원') ||
      item.stationName.includes('원시') ||
      item.stationName.includes('부곡') ||
      item.stationName.includes('고잔') ||
      item.stationName.includes('본오') ||
      item.stationName.includes('호수') ||
      item.stationName.includes('대부')
    );

    console.log(`\n--- Ansan Related Stations Found ---`);
    ansanStations.forEach(s => {
      console.log(`Station: [${s.stationName}] PM10: ${s.pm10Value} PM2.5: ${s.pm25Value} Time: ${s.dataTime}`);
    });

    if (ansanStations.length === 0) {
      console.log("No Ansan-related stations found in the first 1000 items.");
      // 전체 목록 출력 (디버깅용 상위 10개)
      console.log("\nSample station names from Gyeonggi:");
      items.slice(0, 10).forEach(s => console.log(`- ${s.stationName}`));
    }

  } catch (e) {
    console.error("Error fetching data:", e.message);
  }
}

testAnsanDust();
