
export interface WeatherItem {
  category: string;
  obsrValue: string;
}

export interface WeatherResponse {
  response: {
    header: {
      resultCode: string; // "00" 이 정상
      resultMsg: string;
    };
    body: {
      dataType: string;
      items: {
        item: WeatherItem[];
      };
      pageNo: number;
      numOfRows: number;
      totalCount: number;
    } | null;
  } | undefined; // 응답 자체가 비정상일 경우 대비
}

// 프록시/서버리스 함수 경로
// 개발환경: vite.config.ts의 proxy가 /api/weather -> 기상청 API
// 배포환경: Vercel이 /api/weather -> api/weather.js 실행
const BASE_URL = '/api/weather';

export const getUltraSrtNcst = async (nx: number, ny: number): Promise<WeatherItem[]> => {
  const { date, time } = getCurrentBaseDateTime();

  // 클라이언트는 필수 가변 인자만 전송 (Key, dataType 등은 서버/프록시에서 주입)
  const queryParams = [
    `base_date=${date}`,
    `base_time=${time}`,
    `nx=${nx}`,
    `ny=${ny}`
  ].join('&');

  const url = `${BASE_URL}?${queryParams}`;

  console.log(`[API Call] ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const json = await response.json() as WeatherResponse;

  if (json.response?.header?.resultCode !== '00') {
    throw new Error(`API Error: ${json.response?.header?.resultMsg || 'Unknown error'}`);
  }

  return json.response.body?.items?.item || [];
};

function getCurrentBaseDateTime() {
  const now = new Date();
  // 정각 기준 40분 이후에 데이터 생성됨
  // 45분 기준으로 이전이면 1시간 전 데이터 요청
  const minutes = now.getMinutes();

  if (minutes < 45) {
    now.setHours(now.getHours() - 1);
  }

  const year = now.getFullYear();
  const month = ('0' + (now.getMonth() + 1)).slice(-2);
  const day = ('0' + now.getDate()).slice(-2);
  const date = `${year}${month}${day}`;

  const hours = ('0' + now.getHours()).slice(-2);
  const time = `${hours}00`; // 매시간 정시 요청

  return { date, time };
}
