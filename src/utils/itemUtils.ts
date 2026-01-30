import type { WeatherItem } from '../api/weather';
import type { DustItem } from '../api/dust';

export interface RecommendItem {
  id: string;
  name: string;
  icon: string; // Emoji
  reason: string;
  bgColor: string;
  type: 'required' | 'optional'; // [NEW] 필수(required) vs 추천(optional) 구분
}

export const getRecommendedItems = (
  weatherData: WeatherItem[] | null,
  dustData: DustItem | null,
  forecastData: WeatherItem[] | null
): RecommendItem[] => {
  const items: RecommendItem[] = [];
  if (!weatherData) return items;

  // 1. 데이터 추출
  // 강수형태(PTY): 0없음 1비 2비/눈 3눈 4소나기
  const ptyItem = weatherData.find(d => d.category === 'PTY');
  let pty = ptyItem ? Number(ptyItem.obsrValue) : 0;

  // 습도(REH)
  const rehItem = weatherData.find(d => d.category === 'REH');
  const humidity = rehItem ? Number(rehItem.obsrValue) : 50;

  // 1시간 강수량(RN1) - "1.0mm" 같은 문자열일 수 있음
  const rn1Item = weatherData.find(d => d.category === 'RN1');
  const rainAmount = rn1Item ? parseFloat(rn1Item.obsrValue || '0') : 0;

  // [NEW] 예보 데이터 확인 (앞으로 12시간 이내 비/눈 예보 및 일교차)
  let rainInForecast = false;
  let snowInForecast = false;
  let maxTemp = -999;
  let minTemp = 999;

  if (forecastData) {
    // PTY 예보 확인
    const ptyForecasts = forecastData
      .filter(item => item.category === 'PTY')
      .slice(0, 12);

    rainInForecast = ptyForecasts.some(item => {
      const val = Number(item.fcstValue);
      return val === 1 || val === 2 || val === 4;
    });

    snowInForecast = ptyForecasts.some(item => {
      const val = Number(item.fcstValue);
      return val === 3;
    });

    // 일교차 계산을 위한 TMX, TMN 찾기 (오늘 날짜 기준)
    // forecastData에는 여러 날짜가 있을 수 있으므로, 가장 먼저 나오는 TMX/TMN을 사용하거나
    // 전체 데이터를 훑어서 최대/최소를 구함 (여기서는 단순화하여 전체 중 Max/Min)
    // 단, TMX/TMN은 0200, 1100 등 특정 시간에만 나오므로 없을 수도 있음 -> T1H(3시간 기온)로 추정 가능
    // 여기서는 간단히 T3H(단기예보 기온) 전체를 훑어서 차이를 계산
    const temps = forecastData
      .filter(item => item.category === 'TMP' || item.category === 'T1H' || item.category === 'T3H') // API 버전에 따라 다름(VilageFcst는 TMP)
      .map(item => Number(item.fcstValue));

    if (temps.length > 0) {
      maxTemp = Math.max(...temps);
      minTemp = Math.min(...temps);
    }
  }

  // 기온(T1H) - 현재 기온
  const tempItem = weatherData.find(d => d.category === 'T1H');
  const temp = tempItem ? Number(tempItem.obsrValue) : 20;

  // 미세먼지 등급 (1좋음 2보통 3나쁨 4매우나쁨)
  const dustGrade = dustData ? Number(dustData.pm10Grade) : 0;
  const fineDustGrade = dustData ? Number(dustData.pm25Grade) : 0;

  // 2. 조건 확인

  // [필수] 우산: 현재 비가 오거나(pty), 예보에 비가 있거나(rainInForecast)
  if (pty === 1 || pty === 2 || pty === 4 || rainInForecast) {
    items.push({
      id: 'umbrella',
      name: '우산',
      icon: '☔',
      reason: rainInForecast && pty === 0 ? '오후에 비 예보가 있어요' : '비가 내리고 있어요',
      bgColor: 'bg-blue-100 text-blue-700',
      type: 'required'
    });
  }

  // [필수] 눈 관련 장비
  if (pty === 3 || snowInForecast) {
    items.push({
      id: 'snow_gear',
      name: '우산/방한화',
      icon: '🌨️',
      reason: snowInForecast && pty !== 3 ? '눈 예보가 있어요' : '눈이 오고 있어요',
      bgColor: 'bg-slate-100 text-slate-700',
      type: 'required'
    });
  }

  // [필수] 마스크: 미세먼지 혹은 초미세먼지가 나쁨(3) 이상
  if (dustGrade >= 3 || fineDustGrade >= 3) {
    items.push({
      id: 'mask',
      name: '마스크',
      icon: '😷',
      reason: '미세먼지가 나쁨 수준이에요',
      bgColor: 'bg-orange-100 text-orange-700',
      type: 'required'
    });
  }

  // [추천] 레인부츠: 비가 오면서 시간당 5mm 이상
  if ((pty === 1 || pty === 2 || pty === 4) && rainAmount >= 5) {
    items.push({
      id: 'rain_boots',
      name: '레인부츠',
      icon: '👢',
      reason: '비가 꽤 많이 오네요',
      bgColor: 'bg-teal-100 text-teal-700',
      type: 'optional'
    });
  }

  // [추천] 미스트/립밤: 습도 30% 미만
  if (humidity < 30) {
    items.push({
      id: 'mist',
      name: '미스트/립밤',
      icon: '🧴',
      reason: '공기가 매우 건조해요',
      bgColor: 'bg-cyan-100 text-cyan-700',
      type: 'optional'
    });
  }

  // [추천] 가디건/겉옷: 일교차 10도 이상
  if (maxTemp !== -999 && minTemp !== 999 && (maxTemp - minTemp >= 10)) {
    items.push({
      id: 'cardigan',
      name: '가디건/겉옷',
      icon: '🧥',
      reason: `일교차가 커요 (${(maxTemp - minTemp).toFixed(0)}℃ 차이)`,
      bgColor: 'bg-violet-100 text-violet-700',
      type: 'optional'
    });
  }

  // 날씨 기반 (기온/계절성)
  if (temp >= 28) {
    items.push({
      id: 'hand_fan',
      name: '손선풍기',
      icon: '🌪️',
      reason: '폭염입니다. 더위 조심하세요!',
      bgColor: 'bg-red-100 text-red-700',
      type: 'optional'
    });
    items.push({
      id: 'sun_care',
      name: '양산/모자',
      icon: '🧢',
      reason: '자외선이 강해요',
      bgColor: 'bg-yellow-100 text-yellow-700',
      type: 'optional'
    });
  } else if (temp <= 0) {
    items.push({
      id: 'hotpack',
      name: '핫팩',
      icon: '🔥',
      reason: '영하권 추위입니다!',
      bgColor: 'bg-rose-100 text-rose-700',
      type: 'optional'
    });
    items.push({
      id: 'gloves',
      name: '장갑',
      icon: '🧤',
      reason: '손 시려움을 방지하세요',
      bgColor: 'bg-indigo-100 text-indigo-700',
      type: 'optional'
    });
  } else if (temp <= 5) {
    items.push({
      id: 'scarf',
      name: '목도리',
      icon: '🧣',
      reason: '체온 유지에 좋아요',
      bgColor: 'bg-stone-100 text-stone-700',
      type: 'optional'
    });
  }

  // 기본값 (특별한 게 없으면 '준비물 없음' 대신 긍정 메시지 -> 추천템으로 취급)
  if (items.length === 0) {
    items.push({
      id: 'smile',
      name: '가벼운 마음',
      icon: '😊',
      reason: '날씨가 좋아요! 가볍게 외출하세요',
      bgColor: 'bg-green-100 text-green-700',
      type: 'optional'
    });
  }

  return items;
};
