export default async function handler(request, response) {
  // CORS 설정 (필요 시 더 제한적으로 설정 가능)
  response.setHeader('Access-Control-Allow-Credentials', true)
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (request.method === 'OPTIONS') {
    response.status(200).end()
    return
  }

  // 환경변수에서 Service Key 가져오기
  // Vercel 배포 시 Settings > Environment Variables 에서 VITE_WEATHER_API_KEY 를 설정해야 함
  const SERVICE_KEY = process.env.VITE_WEATHER_API_KEY;

  if (!SERVICE_KEY) {
    return response.status(500).json({ error: 'Server Service Key is missing' });
  }

  const { nx, ny, base_date, base_time } = request.query;

  // 기상청 API 기본 URL
  const BASE_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';

  try {
    // URL 조립
    // 기상청 API는 디코딩된 키를 쿼리에 넣으면 자동으로 인코딩되어 처리되기도 하고,
    // 이미 인코딩된 키를 원할 수도 있음. 보통 openapi는 인코딩된 키를 요구하는 경우가 많으나,
    // Node.js 환경에서 fetch나 axios 사용 시 자동 인코딩 메커니즘 주의.
    // 여기서는 Vercel 환경이므로 process.env에서 가져온 키(보통 Decoding된 상태로 저장 권장)를 안전하게 파라미터로 넣음.

    // 만약 Encoding Key를 환경변수에 넣었다면 &serviceKey=${SERVICE_KEY} 그대로 사용
    // Decoding Key를 넣었다면 encodeURIComponent(SERVICE_KEY) 사용

    // 여기서는 사용자가 .env 에 어떤 키를 넣을지 모르지만, 보통 Decoding Key를 권장.

    const queryParams = new URLSearchParams({
      serviceKey: SERVICE_KEY, // URLSearchParams가 자동으로 인코딩 처리함 (Decoding Key 사용 시 적합)
      pageNo: '1',
      numOfRows: '1000',
      dataType: 'JSON',
      base_date,
      base_time,
      nx,
      ny
    });

    // *중요*: 기상청 공공데이터포털은 이미 인코딩된 ServiceKey(%)를 요구하는 경우가 많음.
    // URLSearchParams는 모든 값을 인코딩해버리기 때문에, 이미 인코딩된 키를 또 인코딩하면(%%) 에러남.
    // 따라서 쿼리 스트링을 수동 조립하는 것이 가장 안전함.

    const queryString = [
      `serviceKey=${SERVICE_KEY}`, // 이미 인코딩된 키라고 가정하고 그대로 넣음
      `pageNo=1`,
      `numOfRows=1000`,
      `dataType=JSON`,
      `base_date=${base_date}`,
      `base_time=${base_time}`,
      `nx=${nx}`,
      `ny=${ny}`
    ].join('&');

    const url = `${BASE_URL}?${queryString}`;

    console.log('Fetching Weather Data from:', url);

    const apiResponse = await fetch(url);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`KMA API Error: ${apiResponse.status} ${errorText}`);
    }

    const data = await apiResponse.json();

    return response.status(200).json(data);
  } catch (error) {
    console.error('Weather API Error:', error);
    return response.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
