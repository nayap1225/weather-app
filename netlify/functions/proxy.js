const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { path, queryStringParameters } = event;

  // API Key 가져오기 (Netlify 환경 변수)
  const WEATHER_KEY = process.env.VITE_WEATHER_API_KEY;
  const DUST_KEY = process.env.VITE_DUST_API_KEY;
  const KAKAO_KEY = process.env.VITE_KAKAO_API_KEY;

  if (!WEATHER_KEY || !DUST_KEY || !KAKAO_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing API Keys in Netlify Environment Variables' })
    };
  }

  let targetBaseUrl = '';
  let serviceKey = '';
  let headers = {};
  let isKakao = false;

  // 경로에 따른 타겟 URL 설정 (Vercel proxy.js 로직 이식)
  if (path.includes('/api/weather')) {
    targetBaseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';
    serviceKey = WEATHER_KEY;
  } else if (path.includes('/api/kakao-address')) {
    targetBaseUrl = 'https://dapi.kakao.com/v2/local/geo/coord2address.json';
    isKakao = true;
    headers = { 'Authorization': `KakaoAK ${KAKAO_KEY}` };
  } else if (path.includes('/api/forecast')) {
    targetBaseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
    serviceKey = WEATHER_KEY;
  } else if (path.includes('/api/mid-land')) {
    targetBaseUrl = 'https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst';
    serviceKey = WEATHER_KEY;
  } else if (path.includes('/api/mid-ta')) {
    targetBaseUrl = 'https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa';
    serviceKey = WEATHER_KEY;
  } else if (path.includes('/api/tm-coord')) {
    targetBaseUrl = 'https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getTMStdrCrdnt';
    serviceKey = DUST_KEY;
  } else if (path.includes('/api/nearby-station')) {
    targetBaseUrl = 'https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getNearbyMsrstnList';
    serviceKey = DUST_KEY;
  } else if (path.includes('/api/sido-dust')) {
    targetBaseUrl = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty';
    serviceKey = DUST_KEY;
  } else if (path.includes('/api/dust')) {
    targetBaseUrl = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty';
    serviceKey = DUST_KEY;
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Endpoint Not Supported', path })
    };
  }

  // 쿼리 파라미터 조립 (serviceKey 제외)
  const params = new URLSearchParams(queryStringParameters);
  params.delete('serviceKey');

  // 기본 파라미터 보강
  if (!params.has('pageNo')) params.set('pageNo', '1');
  if (path.includes('/api/weather') || path.includes('/api/forecast')) {
    if (!params.has('numOfRows')) params.set('numOfRows', '1000');
    if (!params.has('dataType')) params.set('dataType', 'JSON');
  } else if (path.includes('/api/mid-')) {
    if (!params.has('numOfRows')) params.set('numOfRows', '10');
    if (!params.has('dataType')) params.set('dataType', 'JSON');
  } else if (path.includes('/api/dust') || path.includes('/api/sido-dust') || path.includes('/api/tm-coord') || path.includes('/api/nearby-station')) {
    if (!params.has('numOfRows')) {
      params.set('numOfRows', path.includes('sido-dust') ? '1000' : '10');
    }
    if (!params.has('returnType')) params.set('returnType', 'json');
  }

  const finalUrl = isKakao
    ? `${targetBaseUrl}?${params.toString()}`
    : `${targetBaseUrl}?serviceKey=${encodeURIComponent(serviceKey)}&${params.toString()}`;

  try {
    const apiRes = await fetch(finalUrl, { headers });
    const contentType = apiRes.headers.get('content-type');

    let body;
    if (contentType && contentType.includes('application/json')) {
      body = await apiRes.json();
    } else {
      const text = await apiRes.text();
      body = { error: 'Non-JSON Response', preview: text.slice(0, 200) };
    }

    return {
      statusCode: apiRes.status,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Netlify Proxy Request Failed', message: error.message })
    };
  }
};
