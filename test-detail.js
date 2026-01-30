
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env.local에서 API 키 읽기
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/VITE_DUST_API_KEY=([^\s]+)/);
let API_KEY = apiKeyMatch ? apiKeyMatch[1] : null;

async function testAnsanDetail() {
  const sidoName = encodeURIComponent('경기');
  const url = `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${API_KEY}&returnType=json&numOfRows=10&pageNo=1&sidoName=${sidoName}&ver=1.3`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const item = json.response.body.items[0];
    console.log("Full Item Keys:", Object.keys(item));
    console.log("Station:", item.stationName);
    console.log("MSRSTN_NM (if exists):", item.msrstnNm);
    // ver 1.3/1.4 response doesn't usually include address.
    // Let's check if there is ANY field that implies sggName.
  } catch (e) {
    console.error(e);
  }
}
testAnsanDetail();
