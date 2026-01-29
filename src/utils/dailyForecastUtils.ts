import type { WeatherItem, MidLandItem, MidTaItem } from '../api/weather';
import { groupForecastItems, getWeatherIcon } from './weatherUtils';

export interface DailyForecast {
  date: string; // YYYYMMDD
  dayOfWeek: string; // 월, 화...
  minTemp: number;
  maxTemp: number;
  amWeather: string; // 오전 날씨 (맑음, 흐림...)
  pmWeather: string; // 오후 날씨
  amPop: number; // 오전 강수확률
  pmPop: number; // 오후 강수확률
  amIcon: string;
  pmIcon: string;
}

// 요일 구하기 유틸
const getDayOfWeek = (dateStr: string) => {
  const year = Number(dateStr.substring(0, 4));
  const month = Number(dateStr.substring(4, 6)) - 1;
  const day = Number(dateStr.substring(6, 8));
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(year, month, day).getDay()];
};

// 날짜 더하기 유틸
const addDays = (dateStr: string, days: number): string => {
  const year = Number(dateStr.substring(0, 4));
  const month = Number(dateStr.substring(4, 6)) - 1;
  const day = Number(dateStr.substring(6, 8));
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + days);

  const y = d.getFullYear();
  const m = ('0' + (d.getMonth() + 1)).slice(-2);
  const dd = ('0' + d.getDate()).slice(-2);
  return `${y}${m}${dd}`;
};

/**
 * 단기예보(3일) + 중기예보(7일) -> 통합 10일 일별 예보 생성
 */
export const mergeForecastData = (
  shortTerm: WeatherItem[] | null,
  midLand: MidLandItem | null,
  midTa: MidTaItem | null
): DailyForecast[] => {
  const result: DailyForecast[] = [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}${('0' + (today.getMonth() + 1)).slice(-2)}${('0' + today.getDate()).slice(-2)}`;

  // 1. 단기예보 처리 (오늘 ~ 모레, 약 3일치)
  if (shortTerm) {
    const grouped = groupForecastItems(shortTerm); // 시간별 데이터
    // 날짜별로 다시 그룹핑
    const dailyMap = new Map<string, any[]>();

    grouped.forEach(item => {
      if (!dailyMap.has(item.date)) dailyMap.set(item.date, []);
      dailyMap.get(item.date).push(item);
    });

    dailyMap.forEach((gItems, date) => {
      // 최저/최고 기온 찾기
      const temps = gItems.map(i => Number(i.temp)).filter(n => !isNaN(n));
      const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
      const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;

      // 오전/오후 대표 날씨 (00~11시, 12~23시)
      const amItems = gItems.filter(i => Number(i.time) < 1200);
      const pmItems = gItems.filter(i => Number(i.time) >= 1200);

      // 간단히 가장 많이 파악된 날씨나, 비오면 비로 설정
      // 여기서는 오후 비오면 오후 비, 아니면 마지막 상태
      // icon logic 재사용
      const getRep = (items: any[]) => {
        if (items.length === 0) return { icon: '', text: '', pop: 0 };
        // 강수확률 최대값
        const maxPop = Math.max(...items.map((i: any) => Number(i.pop) || 0));
        // 비/눈 등 PTY 있는 경우 우선
        const rainItem = items.find((i: any) => Number(i.pty) > 0);
        const target = rainItem || items[Math.floor(items.length / 2)];

        return {
          icon: getWeatherIcon(target.sky, target.pty, target.time),
          text: '', // 단기예보는 텍스트가 따로 없음, 아이콘으로 대체
          pop: maxPop
        };
      };

      const amRep = getRep(amItems);
      const pmRep = getRep(pmItems);

      result.push({
        date,
        dayOfWeek: getDayOfWeek(date),
        minTemp,
        maxTemp,
        amWeather: amRep.text,
        pmWeather: pmRep.text,
        amPop: amRep.pop,
        pmPop: pmRep.pop,
        amIcon: amRep.icon || '☁️',
        pmIcon: pmRep.icon || '☁️'
      });
    });
  }

  // 2. 중기예보 처리 (3일후 ~ 10일후)
  if (midLand && midTa) {
    console.log('[DailyForecast] MidLand Data:', midLand);
    console.log('[DailyForecast] MidTa Data:', midTa);

    for (let i = 3; i <= 10; i++) {
      const targetDate = addDays(todayStr, i);

      // 이미 단기예보로 커버된 날짜면 건너뜀
      if (result.some(r => r.date === targetDate)) continue;

      try {
        const keyMin = `taMin${i}` as keyof MidTaItem;
        const keyMax = `taMax${i}` as keyof MidTaItem;

        // 데이터 존재 여부 확인 (없으면 Nan 처리 방지)
        const minTemp = midTa[keyMin] !== undefined ? (midTa[keyMin] as number) : -999;
        const maxTemp = midTa[keyMax] !== undefined ? (midTa[keyMax] as number) : -999;

        if (minTemp === -999 || maxTemp === -999) {
          console.warn(`[DailyForecast] Missing temp data for day ${i} (${targetDate})`);
          // 기온 데이터가 없어도 날씨 정보가 있으면 표시할지 결정. 일단 진행.
        }

        let amWf = '', pmWf = '', amPop = 0, pmPop = 0;

        if (i <= 7) {
          const kAmWf = `wf${i}Am` as keyof MidLandItem;
          const kPmWf = `wf${i}Pm` as keyof MidLandItem;
          const kAmPop = `rnSt${i}Am` as keyof MidLandItem;
          const kPmPop = `rnSt${i}Pm` as keyof MidLandItem;

          amWf = (midLand[kAmWf] as string) || '';
          pmWf = (midLand[kPmWf] as string) || '';
          amPop = (midLand[kAmPop] as number) || 0;
          pmPop = (midLand[kPmPop] as number) || 0;
        } else {
          // 8, 9, 10일차
          const kWf = `wf${i}` as keyof MidLandItem;
          const kPop = `rnSt${i}` as keyof MidLandItem;

          const wf = (midLand[kWf] as string) || '';
          const pop = (midLand[kPop] as number) || 0;
          amWf = pmWf = wf;
          amPop = pmPop = pop;
        }

        // 데이터가 아예 없으면 스킵 (API에 따라 8~10일차가 없을 수도 있음)
        if (!amWf && !pmWf && minTemp === -999) {
          console.warn(`[DailyForecast] No data for day ${i}`);
          continue;
        }

        // 텍스트 -> 아이콘 변환 (간이)
        const getIconFromText = (text: string) => {
          if (!text) return '❓';
          if (text.includes('비')) return '🌧️';
          if (text.includes('눈')) return '☃️';
          if (text.includes('구름많음')) return '⛅';
          if (text.includes('흐림')) return '☁️';
          if (text.includes('맑음')) return '☀️';
          return '❓';
        };

        result.push({
          date: targetDate,
          dayOfWeek: getDayOfWeek(targetDate),
          minTemp: minTemp === -999 ? 0 : minTemp,
          maxTemp: maxTemp === -999 ? 0 : maxTemp,
          amWeather: amWf,
          pmWeather: pmWf,
          amPop,
          pmPop,
          amIcon: getIconFromText(amWf),
          pmIcon: getIconFromText(pmWf)
        });
      } catch (err) {
        console.error(`[DailyForecast] Error processing day ${i}`, err);
      }
    }
  }

  // 날짜순 정렬
  result.sort((a, b) => Number(a.date) - Number(b.date));

  return result;
};
