
const DUST_KEY = 'f116219c339f5606076070271e3a0bff147d7d02f973f9aad1e594128652dd15';

async function testSido() {
  const sidoName = '경기'; // 2글자 요함
  const encodedSido = encodeURIComponent(sidoName);
  const url = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${encodeURIComponent(DUST_KEY)}&returnType=json&sidoName=${encodedSido}&numOfRows=100&pageNo=1&ver=1.0`;

  console.log(`[Test] Calling Sido API: ${url}`);
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log(`[Test] Response Text (First 200chars): ${text.slice(0, 200)}...`);

    if (text.startsWith('<')) {
      console.error("[Test] FAILED: API returned XML/HTML.");
      return;
    }

    const json = JSON.parse(text);
    const items = json.response?.body?.items;
    console.log(`[Test] Found ${items?.length || 0} items for ${sidoName}`);

    if (items) {
      const ansanStations = items.filter(item => item.stationName.includes('안산') || item.stationName === '부곡동' || item.stationName === '고잔동');
      console.log(`[Test] Found ${ansanStations.length} matching stations for Ansan area:`);
      ansanStations.slice(0, 5).forEach(item => {
        console.log(`  Station: ${item.stationName}, PM10: ${item.pm10Value}`);
      });
    }
  } catch (e) {
    console.error(`[Test] Error: ${e.message}`);
  }
}

testSido();
