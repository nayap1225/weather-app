export default async function handler(request, response) {
  const { stationName } = request.query;
  // VITE_DUST_API_KEY는 .env.local에 저장되어 있어야 함
  const apiKey = process.env.VITE_DUST_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'API key is missing on server.' });
  }

  // 에어코리아: 측정소별 실시간 측정정보 조회
  // returnType=json, numOfRows=1, pageNo=1, dataTerm=DAILY, ver=1.0, stationName={stationName}
  const url = `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?serviceKey=${apiKey}&returnType=json&numOfRows=1&pageNo=1&stationName=${encodeURIComponent(stationName)}&dataTerm=DAILY&ver=1.0`;

  try {
    const fetchResponse = await fetch(url);
    if (!fetchResponse.ok) {
      throw new Error(`API error: ${fetchResponse.status}`);
    }
    const data = await fetchResponse.json();

    // 응답 구조 확인 및 전달
    if (data.response?.body?.items) {
      return response.status(200).json(data.response.body.items);
    } else {
      return response.status(404).json({ error: 'No dust data found' });
    }
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Failed to fetch dust data' });
  }
}
