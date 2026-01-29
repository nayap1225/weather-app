import type { WeatherItem } from '../api/weather';

export interface ForecastGroup {
  date: string; // YYYYMMDD
  time: string; // HHMM
  temp: string; // TMP (1시간 기온)
  sky: string; // SKY (하늘상태: 1맑음 3구름많음 4흐림)
  pty: string; // PTY (강수형태)
  pop: string; // POP (강수확률)
}

/**
 * 단기예보 데이터(WeatherItem[])를 시간별(fcstDate + fcstTime)로 그룹화하여 정리
 */
export const groupForecastItems = (items: WeatherItem[]): ForecastGroup[] => {
  // key: "YYYYMMDDHHMM"
  const map = new Map<string, Partial<ForecastGroup>>();

  items.forEach(item => {
    const key = `${item.fcstDate}${item.fcstTime}`;

    if (!map.has(key)) {
      map.set(key, {
        date: item.fcstDate,
        time: item.fcstTime
      });
    }

    const group = map.get(key)!;

    // 카테고리별 매핑
    switch (item.category) {
      case 'TMP': group.temp = item.fcstValue; break;
      case 'SKY': group.sky = item.fcstValue; break;
      case 'PTY': group.pty = item.fcstValue; break;
      case 'POP': group.pop = item.fcstValue; break;
    }
  });

  // 배열로 변환 후 시간순 정렬
  const result = Array.from(map.values()) as ForecastGroup[];
  result.sort((a, b) => {
    return Number(a.date + a.time) - Number(b.date + b.time);
  });

  return result;
};

/**
 * 하늘 상태와 강수 형태 코드를 이모지로 변환
 */
export const getWeatherIcon = (sky: string, pty: string, time?: string) => {
  const ptyCode = Number(pty);
  const skyCode = Number(sky);

  // 밤낮 구분 (간단히 06~18: 낮, 나머지: 밤)
  const hour = time ? Number(time.slice(0, 2)) : 12;
  const isNight = hour < 6 || hour >= 19;

  // 1. 강수 우선
  if (ptyCode === 1) return '🌧️'; // 비
  if (ptyCode === 2) return '🌨️'; // 비/눈
  if (ptyCode === 3) return '☃️'; // 눈
  if (ptyCode === 4) return '🌦️'; // 소나기

  // 2. 하늘 상태
  if (skyCode === 1) return isNight ? '🌙' : '☀️'; // 맑음
  if (skyCode === 3) return isNight ? '☁️' : '⛅'; // 구름많음
  if (skyCode === 4) return '☁️'; // 흐림

  return '❓';
};
