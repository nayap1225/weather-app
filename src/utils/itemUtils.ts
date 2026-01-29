import type { WeatherItem } from '../api/weather';
import type { DustItem } from '../api/dust';

export interface RecommendItem {
  id: string;
  name: string;
  icon: string; // Emoji
  reason: string;
  bgColor: string;
}

export const getRecommendedItems = (
  weatherData: WeatherItem[] | null,
  dustData: DustItem | null,
  forecastData: WeatherItem[] | null // [NEW] 예보 데이터 추가
): RecommendItem[] => {
  const items: RecommendItem[] = [];
  if (!weatherData) return items;

  // 1. 데이터 추출
  // 강수형태(PTY): 0없음 1비 2비/눈 3눈 4소나기
  const ptyItem = weatherData.find(d => d.category === 'PTY');
  let pty = ptyItem ? Number(ptyItem.obsrValue) : 0;

  // [NEW] 예보 데이터 확인 (앞으로 12시간 이내 비 예보가 있는지)
  let rainInForecast = false;
  let snowInForecast = false;

  if (forecastData) {
    // 현재 시간 이후 12시간(대략 12~15개 항목, PTY는 1시간마다 있으므로 12개 체크)
    // forecastData는 이미 정렬되어 온다고 가정
    const ptyForecasts = forecastData
      .filter(item => item.category === 'PTY')
      .slice(0, 12); // 약 12시간

    rainInForecast = ptyForecasts.some(item => {
      const val = Number(item.fcstValue);
      return val === 1 || val === 2 || val === 4;
    });

    snowInForecast = ptyForecasts.some(item => {
      const val = Number(item.fcstValue);
      return val === 3;
    });
  }

  // 기온(T1H)
  const tempItem = weatherData.find(d => d.category === 'T1H');
  const temp = tempItem ? Number(tempItem.obsrValue) : 20;

  // 미세먼지 등급 (1좋음 2보통 3나쁨 4매우나쁨)
  const dustGrade = dustData ? Number(dustData.pm10Grade) : 0;
  const fineDustGrade = dustData ? Number(dustData.pm25Grade) : 0;

  // 2. 조건 확인

  // 우산: 현재 비가 오거나(pty), 예보에 비가 있거나(rainInForecast)
  if (pty === 1 || pty === 2 || pty === 4 || rainInForecast) {
    items.push({
      id: 'umbrella',
      name: '우산',
      icon: '☔',
      reason: rainInForecast && pty === 0 ? '오후에 비 예보가 있어요' : '비나 소나기가 내리고 있어요',
      bgColor: 'bg-blue-100 text-blue-700'
    });
  }
  // 눈(3) -> 방한부츠 or 우산
  if (pty === 3 || snowInForecast) {
    items.push({
      id: 'snow_gear',
      name: '방한화/우산',
      icon: '🌨️',
      reason: snowInForecast && pty !== 3 ? '눈 예보가 있어요' : '눈이 오고 있어요',
      bgColor: 'bg-slate-100 text-slate-700'
    });
  }
  // 눈(3) -> 방한부츠 or 우산
  if (pty === 3) {
    items.push({
      id: 'snow_gear',
      name: '방한화/우산',
      icon: '🌨️',
      reason: '눈이 올 수 있어요',
      bgColor: 'bg-slate-100 text-slate-700'
    });
  }

  // 마스크: 미세먼지 혹은 초미세먼지가 나쁨(3) 이상
  if (dustGrade >= 3 || fineDustGrade >= 3) {
    items.push({
      id: 'mask',
      name: '마스크',
      icon: '😷',
      reason: '미세먼지가 나쁨 수준이에요',
      bgColor: 'bg-orange-100 text-orange-700'
    });
  }

  // 날씨 기반 (기온/계절성)
  if (temp >= 28) {
    items.push({
      id: 'hand_fan',
      name: '손선풍기',
      icon: '🌪️',
      reason: '폭염입니다. 더위 조심하세요!',
      bgColor: 'bg-red-100 text-red-700'
    });
    items.push({
      id: 'sun_care',
      name: '양산/모자',
      icon: '🧢',
      reason: '자외선이 강해요',
      bgColor: 'bg-yellow-100 text-yellow-700'
    });
  } else if (temp <= 0) {
    items.push({
      id: 'hotpack',
      name: '핫팩',
      icon: '🔥',
      reason: '영하권 추위입니다!',
      bgColor: 'bg-rose-100 text-rose-700'
    });
    items.push({
      id: 'gloves',
      name: '장갑',
      icon: '🧤',
      reason: '손 시려움을 방지하세요',
      bgColor: 'bg-indigo-100 text-indigo-700'
    });
  } else if (temp <= 5) {
    items.push({
      id: 'scarf',
      name: '목도리',
      icon: '🧣',
      reason: '체온 유지에 좋아요',
      bgColor: 'bg-stone-100 text-stone-700'
    });
  }

  // 기본값 (특별한 게 없으면 '준비물 없음' 대신 긍정 메시지)
  if (items.length === 0) {
    items.push({
      id: 'smile',
      name: '가벼운 마음',
      icon: '😊',
      reason: '날씨가 좋아요! 가볍게 외출하세요',
      bgColor: 'bg-green-100 text-green-700'
    });
  }

  return items;
};
