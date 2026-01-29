export default async function handler(req, res) {
  const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);

  // API Key 가져오기 (환경변수)
  const WEATHER_KEY = process.env.VITE_WEATHER_API_KEY;
  const DUST_KEY = process.env.VITE_DUST_API_KEY;

  // 인코딩된 키가 필요할 수 있으므로 상황에 따라 decode/encode 처리
  // 공공데이터포털은 보통 Decoding된 키를 쿼리에 넣으면 알아서 처리되거나, Encoding된 키를 넣어야 함.
  // 여기서는 '서비스키' 자체를 그대로 전달하는 방식을 시도.

  let targetUrl = '';
  let serviceKey = '';

  // 경로에 따른 타겟 URL 설정
  if (pathname.includes('/api/weather')) { // 초단기실황
    targetUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
    serviceKey = WEATHER_KEY;
  } else if (pathname.includes('/api/forecast')) { // 단기예보
    targetUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
    serviceKey = WEATHER_KEY;
  } else if (pathname.includes('/api/mid-land')) { // 중기육상
    targetUrl = 'https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst';
    serviceKey = WEATHER_KEY;
  } else if (pathname.includes('/api/mid-ta')) { // 중기기온
    targetUrl = 'https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa';
    serviceKey = WEATHER_KEY;
  } else if (pathname.includes('/api/dust')) { // 미세먼지
    targetUrl = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty';
    serviceKey = DUST_KEY;
  } else {
    return res.status(404).json({ error: 'Unknown Endpoint', path: pathname });
  }

  // 쿼리 스트링 구성
  const query = new URLSearchParams(searchParams);

  // serviceKey 파라미터 추가 (이미 있으면 덮어쓰거나 무시)
  // 공공데이터포털은 serviceKey가 query param으로 들어가야 함.
  // 주의: URLSearchParams는 자동으로 encoding하므로, 이미 인코딩된 키를 넣으면 이중 인코딩 될 수 있음.
  // VERCEL 환경변수에는 보통 'Decoding Key'를 넣고 여기서 인코딩하게 하거나,
  // 'Encoding Key'를 넣고 URLSearchParams가 인코딩하지 않도록 쿼리 스트링을 수동 조립해야 함.

  // 가장 안전한 방법: 쿼리 스트링 문자열 직접 조립
  query.delete('serviceKey'); // 기존 키 제거 (보안)

  // 기본 포맷 JSON 강제 (XML이 디폴트인 경우 방지)
  if (!query.has('dataType')) query.set('dataType', 'JSON');
  // 미세먼지는 returnType=json
  if (pathname.includes('/api/dust')) {
    query.delete('dataType');
    if (!query.has('returnType')) query.set('returnType', 'json');
  }

  const queryString = query.toString();
  const finalUrl = `${targetUrl}?serviceKey=${serviceKey}&${queryString}`;

  console.log(`[Proxy] Fetching: ${targetUrl}`);

  try {
    const apiRes = await fetch(finalUrl);

    if (!apiRes.ok) {
      throw new Error(`API responded with status ${apiRes.status}`);
    }

    const data = await apiRes.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('[Proxy Error]', error);
    return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
}
