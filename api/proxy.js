export default async function handler(req, res) {
  // pathname 추출 (Vercel에서는 req.url이 경로임)
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // API Key 가져오기
  const WEATHER_KEY = process.env.VITE_WEATHER_API_KEY;
  const DUST_KEY = process.env.VITE_DUST_API_KEY;
  const KAKAO_KEY = process.env.VITE_KAKAO_API_KEY;

  if (!WEATHER_KEY || !DUST_KEY) {
    return res.status(500).json({ error: 'Missing API Keys in Environment Variables' });
  }

  let targetBaseUrl = '';
  let serviceKey = '';
  let headers = {};
  let isKakao = false;

  // 경로에 따른 타겟 URL 설정
  if (pathname.includes('/api/weather')) {
    targetBaseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
    serviceKey = WEATHER_KEY;
  } else if (pathname.includes('/api/kakao-address')) {
    targetBaseUrl = 'https://dapi.kakao.com/v2/local/geo/coord2address.json';
    isKakao = true;
    headers = { 'Authorization': `KakaoAK ${KAKAO_KEY}` };
  } else if (pathname.includes('/api/forecast')) {
    targetBaseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
    serviceKey = WEATHER_KEY;
  } else if (pathname.includes('/api/mid-land')) { // 중기육상
    targetBaseUrl = 'https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst';
    serviceKey = WEATHER_KEY;
  } else if (pathname.includes('/api/mid-ta')) { // 중기기온
    targetBaseUrl = 'https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa';
    serviceKey = WEATHER_KEY;
  } else if (pathname.includes('/api/tm-coord')) { // [개선] 미세먼지 사각지대 해소를 위한 TM 좌표 변환
    targetBaseUrl = 'https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getTMStdrCrdnt';
    serviceKey = DUST_KEY;
  } else if (pathname.includes('/api/nearby-station')) { // [개선] 좌표 기반 근처 측정소 목록 조회
    targetBaseUrl = 'https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getNearbyMsrstnList';
    serviceKey = DUST_KEY;
  } else if (pathname.includes('/api/sido-dust')) { // 시도별 실시간 측정정보 조회
    targetBaseUrl = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty';
    serviceKey = DUST_KEY;
  } else if (pathname.includes('/api/dust')) { // 측정소별 실시간 측정정보 조회
    targetBaseUrl = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty';
    serviceKey = DUST_KEY;
  } else {
    return res.status(404).json({ error: 'Endpoint Not Supported', path: pathname });
  }

  // 나머지 쿼리 파라미터 복사 (serviceKey 제외)
  const params = new URLSearchParams(url.search);
  params.delete('serviceKey');

  // [중요] 기본 파라미터 보강 (Vite Proxy 설정과 동일하게)
  if (!params.has('pageNo')) params.set('pageNo', '1');

  if (pathname.includes('/api/weather') || pathname.includes('/api/forecast')) {
    if (!params.has('numOfRows')) params.set('numOfRows', '1000');
    if (!params.has('dataType')) params.set('dataType', 'JSON');
  } else if (pathname.includes('/api/mid-')) {
    if (!params.has('numOfRows')) params.set('numOfRows', '10');
    if (!params.has('dataType')) params.set('dataType', 'JSON');
  } else if (pathname.includes('/api/dust') || pathname.includes('/api/sido-dust') || pathname.includes('/api/tm-coord') || pathname.includes('/api/nearby-station')) {
    if (!params.has('numOfRows')) params.set('numOfRows', '10'); // 측정소는 여러개 올 수 있게 10개로 설정
    if (!params.has('returnType')) params.set('returnType', 'json');
  }

  // URL 조립 (serviceKey는 인코딩 이슈 방지를 위해 encodeURIComponent 적용)
  const finalUrl = isKakao
    ? `${targetBaseUrl}?${params.toString()}`
    : `${targetBaseUrl}?serviceKey=${encodeURIComponent(serviceKey)}&${params.toString()}`;

  console.log(`[Proxy] Forwarding to: ${isKakao ? 'KakaoAPI' : targetBaseUrl}`);

  try {
    const apiRes = await fetch(finalUrl, { headers });
    const contentType = apiRes.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await apiRes.json();
      return res.status(apiRes.status).json(data);
    } else {
      // JSON이 아닌 경우(XML, HTML 등) 텍스트로 읽어서 에러와 함께 반환
      const text = await apiRes.text();
      console.warn('[Proxy] Received non-JSON response:', text.slice(0, 100));
      return res.status(apiRes.status).json({
        error: 'Non-JSON Response from API',
        status: apiRes.status,
        preview: text.slice(0, 200)
      });
    }
  } catch (error) {
    console.error('[Proxy Error]', error);
    return res.status(500).json({ error: 'Proxy Request Failed', message: error.message });
  }
}
