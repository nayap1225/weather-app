import {
  getCachedData,
  setCachedData,
  generateCacheKey,
} from "../utils/apiCache";

// 공공데이터포털 날씨 API 응답 구조
export interface WeatherItem {
  baseDate: string;
  baseTime: string;
  category: string;
  nx: number;
  ny: number;
  // 초단기실황 (getUltraSrtNcst)
  obsrValue?: string;
  // 단기예보 (getVilageFcst)
  fcstDate?: string;
  fcstTime?: string;
  fcstValue?: string;
}

export interface WeatherResponse {
  response:
    | {
        header: {
          resultCode: string;
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
      }
    | undefined; // 응답 자체가 비정상일 경우 대비
}

// 프록시/서버리스 함수 경로
const BASE_URL = "/api/weather";

export const getUltraSrtNcst = async (
  nx: number,
  ny: number,
): Promise<WeatherItem[]> => {
  console.log(`[API] getUltraSrtNcst - nx: ${nx}, ny: ${ny}`);
  const { base_date, base_time } = getBaseDateTime();

  // 캐시 키 생성 (좌표 + 기준시간)
  const cacheKey = generateCacheKey(
    "weather_ncst",
    nx,
    ny,
    base_date,
    base_time,
  );
  const cached = getCachedData<WeatherItem[]>(cacheKey);
  if (cached) return cached;

  // 클라이언트는 필수 가변 인자만 전송 (Key, dataType 등은 서버/프록시에서 주입)
  const queryParams = [
    `base_date=${base_date}`,
    `base_time=${base_time}`,
    `nx=${nx}`,
    `ny=${ny}`,
  ].join("&");

  const url = `${BASE_URL}?${queryParams}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const json = (await response.json()) as WeatherResponse;

  if (json.response?.header?.resultCode !== "00") {
    throw new Error(
      `API Error: ${json.response?.header?.resultMsg || "Unknown error"}`,
    );
  }

  const items = json.response?.body?.items?.item || [];

  // 정상 응답 시 캐시 저장 (30분)
  if (items.length > 0) {
    setCachedData(cacheKey, items);
  }

  return items;
};

/**
 * (초단기실황용) 가장 가까운 Base_time (정시) 구하기
 */
const getBaseDateTime = () => {
  const now = new Date();

  // 40분 이전이면 이전 시간 사용 (API 제공 딜레이 고려)
  if (now.getMinutes() < 45) {
    now.setHours(now.getHours() - 1);
  }

  const year = now.getFullYear();
  const month = ("0" + (now.getMonth() + 1)).slice(-2);
  const day = ("0" + now.getDate()).slice(-2);
  const hour = ("0" + now.getHours()).slice(-2);

  return {
    base_date: `${year}${month}${day}`,
    base_time: `${hour}00`,
  };
};

/**
 * (단기예보용) 가장 가까운 Base_time (3시간 단위: 02, 05, 08, 11, 14, 17, 20, 23)
 * API 제공 시간은 보통 해당 시간 + 10분 뒤 (예: 02시 예보는 02:10 이후 조회 가능)
 */
const getForecastBaseTime = () => {
  const now = new Date();

  // 현재 시간이 02:15 이전이라면 전날 23시 데이터를 써야 함.
  // 안전하게 현재 시간에서 1시간을 빼고 계산하거나 정교하게 비교.
  // 여기서는 단순히 시(hour)를 기준으로 내림 처리.

  // 1. 현재 시각 구하기
  const outputDate = new Date(now);

  // 발표 시간: 2, 5, 8, 11, 14, 17, 20, 23
  // API 제공: 발표시간 + 10분 (약 15분 안전마진)
  // 예: 14:15 이전이면 11시 발표 데이터를 써야 함.
  if (now.getMinutes() < 15) {
    outputDate.setHours(outputDate.getHours() - 1);
  }

  const hour = outputDate.getHours();

  // 시간대를 3시간 단위로 맞춤 (02, 05...)
  // hour보다 작거나 같은 가장 큰 3n+2 찾기?
  // [2, 5, 8, 11, 14, 17, 20, 23]
  const times = [2, 5, 8, 11, 14, 17, 20, 23];
  let baseHour = 23; // 기본값 (전날)

  // 역순으로 돌면서 현재 시간보다 작거나 같은 것 찾기
  for (let i = times.length - 1; i >= 0; i--) {
    if (hour >= times[i]) {
      baseHour = times[i];
      break;
    }
  }

  // 만약 현재 시간이 02시보다 작으면(00시, 01시 등) -> 전날 23시로 설정해야 함
  if (hour < 2) {
    baseHour = 23;
    outputDate.setDate(outputDate.getDate() - 1); // 전날로 이동
  }

  const year = outputDate.getFullYear();
  const month = ("0" + (outputDate.getMonth() + 1)).slice(-2);
  const day = ("0" + outputDate.getDate()).slice(-2);
  const hourStr = ("0" + baseHour).slice(-2);

  return {
    base_date: `${year}${month}${day}`,
    base_time: `${hourStr}00`,
  };
};

export const getVilageFcst = async (
  nx: number,
  ny: number,
): Promise<WeatherItem[]> => {
  console.log(`[API] getVilageFcst - nx: ${nx}, ny: ${ny}`);
  const { base_date, base_time } = getForecastBaseTime();

  // 캐시 키 생성
  const cacheKey = generateCacheKey(
    "weather_fcst",
    nx,
    ny,
    base_date,
    base_time,
  );
  const cached = getCachedData<WeatherItem[]>(cacheKey);
  if (cached) return cached;

  // 단기예보는 /api/forecast 프록시 사용
  const url = `/api/forecast?base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Forecast API Error");

  const json = (await response.json()) as WeatherResponse;
  const items = json.response?.body?.items?.item;

  console.log(`[Forecast API] ${url}`);

  if (json.response?.header?.resultCode !== "00") {
    throw new Error(
      `API Error: ${json.response?.header?.resultMsg || "Unknown error"}`,
    );
  }
  if (!items) throw new Error("No Forecast Data");

  setCachedData(cacheKey, items);
  return items;
};

// --- 중기예보 (10일) 관련 ---

/**
 * 중기예보 Base Time 구하기 (1일 2회: 06:00, 18:00)
 * 06:00 이전 -> 전날 18:00
 * 06:00 ~ 18:00 이전 -> 당일 06:00
 * 18:00 이후 -> 당일 18:00
 * (API는 tmFc 파라미터로 YYYYMMDDHHMM 형식 사용)
 */
const getMidTermBaseTime = () => {
  const now = new Date();

  // 1. 현재 시각
  const year = now.getFullYear();
  const month = ("0" + (now.getMonth() + 1)).slice(-2);
  const day = ("0" + now.getDate()).slice(-2);
  const hour = now.getHours();

  let targetDate = `${year}${month}${day}`;
  let targetTime = "0600";

  if (hour < 6) {
    // 06시 이전: 전날 18시
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yMonth = ("0" + (yesterday.getMonth() + 1)).slice(-2);
    const yDay = ("0" + yesterday.getDate()).slice(-2);
    targetDate = `${yesterday.getFullYear()}${yMonth}${yDay}`;
    targetTime = "1800";
  } else if (hour < 18) {
    // 06시 ~ 18시 미만: 당일 06시
    targetTime = "0600";
  } else {
    // 18시 이후: 당일 18시
    targetTime = "1800";
  }

  return `${targetDate}${targetTime}`;
};

export interface MidLandItem {
  regId: string;
  // 3일후~10일후 예보 (rnSt:강수확률, wf:날씨예보)
  rnSt3Am: number;
  rnSt3Pm: number;
  rnSt4Am: number;
  rnSt4Pm: number;
  rnSt5Am: number;
  rnSt5Pm: number;
  rnSt6Am: number;
  rnSt6Pm: number;
  rnSt7Am: number;
  rnSt7Pm: number;
  rnSt8: number;
  rnSt9: number;
  rnSt10: number;

  wf3Am: string;
  wf3Pm: string;
  wf4Am: string;
  wf4Pm: string;
  wf5Am: string;
  wf5Pm: string;
  wf6Am: string;
  wf6Pm: string;
  wf7Am: string;
  wf7Pm: string;
  wf8: string;
  wf9: string;
  wf10: string;
}

export interface MidTaItem {
  regId: string;
  // 3일후~10일후 기온 (taMin:최저, taMax:최고)
  taMin3: number;
  taMax3: number;
  taMin4: number;
  taMax4: number;
  taMin5: number;
  taMax5: number;
  taMin6: number;
  taMax6: number;
  taMin7: number;
  taMax7: number;
  taMin8: number;
  taMax8: number;
  taMin9: number;
  taMax9: number;
  taMin10: number;
  taMax10: number;
}

export const getMidLandFcst = async (
  regId: string,
): Promise<MidLandItem | null> => {
  const tmFc = getMidTermBaseTime();

  const cacheKey = generateCacheKey("mid_land", regId, tmFc);
  const cached = getCachedData<MidLandItem>(cacheKey);
  if (cached) return cached;

  const url = `/api/mid-land?regId=${regId}&tmFc=${tmFc}`;

  console.log(`[MidLand API Request] ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[MidLand API Error] Status: ${res.status}, Body: ${errText}`,
      );
      throw new Error(`MidLand API Status: ${res.status}`);
    }
    const json = await res.json();

    // 정상 응답인지 체크 (ResultCode)
    if (json.response?.header?.resultCode !== "00") {
      console.error(
        `[MidLand API Logic Error] ${JSON.stringify(json.response?.header)}`,
      );
      // 에러를 던지면 App.tsx에서 catch됨 -> 널 반환
    }

    const item = json.response?.body?.items?.item?.[0];
    if (item) setCachedData(cacheKey, item);
    return item as MidLandItem;
  } catch (e) {
    console.error("[MidLand API Exception]", e);
    return null;
  }
};

export const getMidTa = async (regId: string): Promise<MidTaItem | null> => {
  const tmFc = getMidTermBaseTime();

  const cacheKey = generateCacheKey("mid_ta", regId, tmFc);
  const cached = getCachedData<MidTaItem>(cacheKey);
  if (cached) return cached;

  const url = `/api/mid-ta?regId=${regId}&tmFc=${tmFc}`;

  console.log(`[MidTa API Request] ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[MidTa API Error] Status: ${res.status}, Body: ${errText}`,
      );
      throw new Error(`MidTa API Status: ${res.status}`);
    }
    const json = await res.json();

    if (json.response?.header?.resultCode !== "00") {
      console.error(
        `[MidTa API Logic Error] ${JSON.stringify(json.response?.header)}`,
      );
    }

    const item = json.response?.body?.items?.item?.[0];
    if (item) setCachedData(cacheKey, item);
    return item as MidTaItem;
  } catch (e) {
    console.error("[MidTa API Exception]", e);
    return null; // 에러 시 null 반환하여 전체 로직이 죽지 않게 함
  }
};
