
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

const API_KEY_ENC = API_KEY;

async function debugNearbyStation(umdName, sidoName, sggName) {
  console.log(`\nDebugging for: ${sidoName} ${sggName} ${umdName}`);

  // 1. TM 좌표 조회
  const tmUrl = `http://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getTMStdrCrdnt?serviceKey=${API_KEY_ENC}&returnType=json&numOfRows=100&pageNo=1&umdName=${encodeURIComponent(umdName)}`;
  console.log(`Fetching TM coords: ${tmUrl}`);

  try {
    const tmRes = await fetch(tmUrl);
    const tmJson = await tmRes.json();
    const items = tmJson.response?.body?.items || [];
    const itemArr = Array.isArray(items) ? items : [items];

    console.log(`Found ${itemArr.length} TM candidates.`);

    // 매칭 로직 (dust.ts와 동일하게)
    const sShort = sidoName.slice(0, 2);
    const sClean = sggName.replace(/\s+/g, '');
    const matchedTM = itemArr.find(item => {
      if (!item.sidoName || !item.sggName) return false;
      const itemSidoShort = item.sidoName.slice(0, 2);
      const itemSggClean = item.sggName.replace(/\s+/g, '');
      const isSidoMatch = (sShort === itemSidoShort);
      const isSggMatch = (sClean.includes(itemSggClean) || itemSggClean.includes(sClean.replace(/시|구|군/g, '')) || sClean.startsWith(itemSggClean.slice(0, 2)));
      return isSidoMatch && isSggMatch;
    });

    const finalTM = matchedTM || itemArr[0];
    if (!finalTM) {
      console.error("No TM coordinates found at all.");
      return;
    }
    console.log(`Selected TM: X=${finalTM.tmX}, Y=${finalTM.tmY} (${finalTM.sidoName} ${finalTM.sggName} ${finalTM.umdName})`);

    // 2. 근거리 측정소 조회
    const nearbyUrl = `http://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getNearbyMsrstnList?serviceKey=${API_KEY_ENC}&returnType=json&tmX=${finalTM.tmX}&tmY=${finalTM.tmY}&ver=1.1`;
    console.log(`Fetching nearby stations: ${nearbyUrl}`);

    const nearbyRes = await fetch(nearbyUrl);
    const nearbyJson = await nearbyRes.json();
    const stations = nearbyJson.response?.body?.items || [];
    const stationArr = Array.isArray(stations) ? stations : [stations];

    console.log(`Found ${stationArr.length} nearby stations.`);
    stationArr.forEach(s => console.log(`- ${s.stationName} (Distance: ${s.tm}km)`));

    // 3. 미세먼지 정보 조회 (첫 번째 측정소)
    if (stationArr.length > 0) {
      const stationName = stationArr[0].stationName;
      const dustUrl = `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnInforInqireSvc?serviceKey=${API_KEY_ENC}&returnType=json&numOfRows=1&pageNo=1&stationName=${encodeURIComponent(stationName)}&dataTerm=DAILY&ver=1.0`;
      console.log(`Fetching dust for ${stationName}: ${dustUrl}`);

      const dustRes = await fetch(dustUrl);
      const dustJson = await dustRes.json();
      const dustItem = dustJson.response?.body?.items?.[0];
      if (dustItem) {
        console.log(`Result: PM10=${dustItem.pm10Value}, PM25=${dustItem.pm25Value}`);
      } else {
        console.warn("No dust data for this station.");
      }
    }

  } catch (e) {
    console.error("Error during debug:", e);
  }
}

// 안산동 테스트
debugNearbyStation("안산동", "경기도", "안산시상록구");
