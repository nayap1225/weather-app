export interface PrepareItem {
  id: string;
  name: string;
  icon: string; // Emoji
  reason: string;
  type: "required" | "optional";
  bgColor?: string; // Optional for custom styling hints
}

export interface ItemConditions {
  ptyCode: number; // 0~4, ...
  rainAmount: number; // RN1
  temp: number; // T1H
  feelsLike: number; // 체감온도
  diffTemp: number; // 일교차 (max - min)
  windSpeed: number; // WSD
  pm10Grade: number; // 1~4
  uvIndex: number; // 자외선 (없으면 0)
  pop: number; // 강수확률 (Max of near future)
  isNight: boolean; // 밤 여부
}

/**
 * 준비물 추천 로직 (User Strict Guidelines)
 * - Required: 필수 (경고성)
 * - Optional: 옵셔널 (편의성)
 * - 옷차림 카드와 중복 배제 (의류 제외, 소지품 위주)
 */
export const getRecommendedItems = (cond: ItemConditions): PrepareItem[] => {
  const items: PrepareItem[] = [];
  const { ptyCode, temp, feelsLike, diffTemp, windSpeed, pm10Grade, uvIndex, pop, isNight } = cond;

  // =========================================================
  // 1️⃣ 필수 준비물 (Required) - 조건 충족 시 무조건 노출
  // =========================================================

  // ☔ 비 (강수형태 1,4 OR 강수확률 >= 60%?)
  // User Guide: "비, 소나기, 강수 확률 높음" -> 우산
  // PTY 1(비), 2(비/눈), 4(소나기) OR POP >= 60 (임의 기준)
  // PTY가 0인데 POP만 높은 경우도 "비 예보"로 칠 수 있음.
  // 여기서는 PTY가 있으면 확실히 넣고, PTY 없는데 POP 높으면 넣음.
  const isRaining = ptyCode === 1 || ptyCode === 2 || ptyCode === 4;
  const isRainForecast = !isRaining && pop >= 60; // 강수확률 높음

  if (isRaining || isRainForecast) {
    items.push({
      id: "umbrella",
      name: "우산",
      icon: "☔",
      reason: isRaining ? "비가 오고 있어요" : "비 올 확률이 높아요",
      type: "required",
    });
  }

  // ❄️ 눈 / 폭설
  // PTY 3(눈), 2(비/눈)
  if (ptyCode === 3 || ptyCode === 2) {
    // 2번은 위에서 우산 챙겼으니, 방한화만? 2번은 우산도 필요하고 미끄럼방지도 필요. 중복 허용? 우산은 위에서 챙김.
    // User Guide: "눈, 눈날림, 적설" -> 미끄럼 방지 신발, 우산 또는 방수 용품
    // if Umbrella already added (Code 2), add Non-slip shoes.
    // Code 3 (Snow) -> Umbrella needed? Yes snow umbrella.
    // Let's check duplicate.
    const hasUmbrella = items.some((i) => i.id === "umbrella");

    if (!hasUmbrella) {
      items.push({
        id: "snow_umbrella",
        name: "우산",
        icon: "🌂",
        reason: "눈이 오고 있어요",
        type: "required",
      });
    }

    items.push({
      id: "nonslip_shoes",
      name: "미끄럼 방지 신발",
      icon: "🥾",
      reason: "길이 미끄러워요",
      type: "required",
    });
  }

  // ❄️ 한파 (영하 10도 이하)
  // User Guide: 장갑, 목도리
  if (temp <= -10 || feelsLike <= -12) {
    items.push({
      id: "warm_gear",
      name: "장갑/목도리",
      icon: "🧣",
      reason: "한파주의! 살이 트지 않게 감싸세요",
      type: "required",
    });
  }

  // 🔥 폭염 (33도 이상)
  // User Guide: 물병, 양산 또는 모자
  if (temp >= 33) {
    items.push({
      id: "water",
      name: "물병",
      icon: "💧",
      reason: "수분 보충이 필수예요",
      type: "required",
    });
    items.push({
      id: "sun_shade",
      name: "양산/모자",
      icon: "🧢",
      reason: "직사광선을 피하세요",
      type: "required",
    });
  }

  // 🌫️ 미세먼지 나쁨 이상 (3, 4)
  // User Guide: 마스크
  if (pm10Grade >= 3) {
    items.push({
      id: "mask",
      name: "마스크",
      icon: "😷",
      reason: pm10Grade === 4 ? "미세먼지 매우 나쁨!" : "미세먼지가 나빠요",
      type: "required",
    });
  }

  // =========================================================
  // 2️⃣ 옵셔널 준비물 (Optional) - 있으면 좋음
  // =========================================================

  // ☀️ 자외선 높음 (지수 데이터 없으면 임시로 여름 낮)
  // UV 데이터가 있으면 쓰고, 없으면 5~8월 낮시간 맑음(SKY 1)일 때 추정? 데이터 넘겨받는다고 가정.
  if (uvIndex >= 6) {
    // 높음 기준
    items.push({
      id: "uv_care",
      name: "선글라스/선크림",
      icon: "🕶️",
      reason: "자외선 지수가 높아요",
      type: "optional",
    });
  }

  // 🌡️ 일교차 큼 (>= 10)
  // User Guide: 여벌 겉옷, 가디건
  if (diffTemp >= 10) {
    items.push({
      id: "cardigan",
      name: "여벌 겉옷",
      icon: "🧥",
      reason: "일교차가 커서 체온 조절이 필요해요",
      type: "optional",
    });
  }

  // 🌬️ 바람 강함 (>= 9ms)
  // User Guide: 얇은 스카프, 바람막이
  // 바람막이는 옷차림에서 추천했으므로 "얇은 스카프" or "휴대용 바람막이"
  if (windSpeed >= 9) {
    items.push({
      id: "wind_scarf",
      name: "스카프/바람막이",
      icon: "🧣",
      reason: "바람이 차갑게 느껴질 수 있어요",
      type: "optional",
    });
  }

  // ☔ 약한 비 예보 (POP 30~59 OR 코드 5 빗방울)
  const isWeakRain = !isRaining && !isRainForecast && (pop >= 30 || ptyCode === 5);
  if (isWeakRain) {
    items.push({
      id: "folding_umbrella",
      name: "접이식 우산",
      icon: "🌂",
      reason: "혹시 모르니 챙기면 좋아요",
      type: "optional",
    });
  }

  // ❄️ 약한 눈 예보
  // 눈날림(7) or 빗방울눈날림(6)
  if (ptyCode === 6 || ptyCode === 7) {
    items.push({
      id: "hotpack",
      name: "핫팩",
      icon: "🔥",
      reason: "눈발이 날려요. 손 시려울 수 있어요",
      type: "optional",
    });
  }

  // 🌙 밤 외출
  if (isNight && items.length < 4) {
    // 너무 많으면 생략
    // 얇은 겉옷 (일교차랑 겹칠 수 있음 checking)
    const hasOuter = items.some((i) => i.id === "cardigan");
    if (!hasOuter && temp < 20) {
      items.push({
        id: "night_outer",
        name: "가벼운 외투",
        icon: "🧥",
        reason: "밤에는 쌀쌀할 수 있어요",
        type: "optional",
      });
    }
  }

  return items;
};
