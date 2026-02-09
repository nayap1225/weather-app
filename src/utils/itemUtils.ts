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

  // 중복 방지를 위한 Helper
  const addedIds = new Set<string>();
  const addOptional = (id: string, name: string, icon: string, reason: string) => {
    if (addedIds.has(id)) return;

    // 필수 준비물에 이미 있는지도 확인 (선택 사항)
    // 여기서는 옵셔널끼리의 중복만 방지하거나, 전체 id 중복 방지
    // 상단 items(필수)에 있는 ID와 겹치는지 확인
    if (items.some((i) => i.id === id)) return;

    items.push({ id, name, icon, reason, type: "optional" });
    addedIds.add(id);
  };

  // ☔ 비 (Rain, Shower, High POP)
  if (isRaining || isRainForecast) {
    addOptional("folding_umbrella", "접이식 우산", "🌂", "혹시 모를 상황에 대비하세요");
    addOptional("extra_socks", "여분 양말", "🧦", "비에 젖을 수 있어요");
    addOptional("waterproof_pouch", "방수 파우치", "💧", "소지품을 보호하세요");
  }

  // ☔ 약한 비 (POP 50~59) - '비' 조건(60% 이상)에 안 걸린 경우
  if (!isRaining && !isRainForecast && (pop >= 50 || ptyCode === 5)) {
    addOptional("folding_umbrella", "접이식 우산", "🌂", "혹시 모르니 챙기면 좋아요");
  }

  // ❄️ 눈 / 폭설
  if (ptyCode === 3 || ptyCode === 2) {
    addOptional("hotpack", "핫팩", "🔥", "손이 시려울 수 있어요");
    addOptional("extra_socks", "여분 양말", "🧦", "눈에 젖을 수 있어요");
  }

  // ❄️ 한파 (영하 10도 이하)
  if (temp <= -10 || feelsLike <= -12) {
    addOptional("earmuffs", "귀마개", "🎧", "귀가 시려울 수 있어요");
    addOptional("beanie", "비니", "🧢", "머리 체온을 지켜주세요");
    addOptional("hotpack", "핫팩", "🔥", "한파엔 핫팩이 필수예요");
  }

  // 🔥 폭염 (33도 이상)
  if (temp >= 33) {
    addOptional("cool_towel", "쿨타월", "🧣", "더위를 식혀줄 아이템이에요");
    addOptional("portable_fan", "휴대용 선풍기", "🌬️", "야외 활동 시 유용해요");
    addOptional("handkerchief", "여분 손수건", "🟦", "땀을 닦을 때 필요해요");
  }

  // 🌫️ 미세먼지 나쁨 이상 (3, 4)
  if (pm10Grade >= 3) {
    addOptional("eye_drops", "인공눈물", "💧", "눈이 뻑뻑할 수 있어요");
    addOptional("lip_balm", "립밤", "💄", "입술 보호가 필요해요");
  }

  // ☀️ 자외선 높음 (6 이상)
  if (uvIndex >= 6) {
    addOptional("sun_cream", "선크림", "🧴", "자외선 차단이 중요해요");
    addOptional("sunglasses", "선글라스", "🕶️", "눈을 보호하세요");
    addOptional("hat_brim", "챙 있는 모자", "👒", "햇볕을 가려주세요");
  }

  // 🌡️ 일교차 큼 (10도 이상)
  if (diffTemp >= 10) {
    addOptional("outer", "여벌 겉옷", "🧥", "일교차가 커요");
    addOptional("cardigan", "가디건", "🧶", "입고 벗기 편한 옷이 좋아요");
    addOptional("shawl", "숄/스카프", "🧣", "가볍게 걸치기 좋아요");
  }

  // 🌬️ 바람 강함 (9m/s 이상)
  if (windSpeed >= 9) {
    addOptional("thin_scarf", "얇은 스카프", "🧣", "목을 보호하세요");
    addOptional("windbreaker", "휴대용 바람막이", "🧥", "바람을 막아주세요");
  }

  // 🌙 밤 외출 (저녁/야간)
  // 여름밤(25도 이상) 등 너무 더울 땐 제외하는 센스
  if (isNight) {
    if (temp < 25) {
      addOptional("night_outer", "얇은 겉옷", "🧥", "밤공기가 쌀쌀할 수 있어요");
    }
    if (temp < 15) {
      addOptional("warm_item", "보온 소품", "🧣", "체온 유지에 신경 쓰세요");
    }
  }

  // =========================================================
  // 3️⃣ 월별/계절별 상시 추천 (Conditions are mild)
  // =========================================================
  const month = new Date().getMonth() + 1;

  // 1월 (한겨울)
  if (month === 1) {
    addOptional("lip_balm", "립밤", "💄", "입술이 트기 쉬워요");
    addOptional("hand_cream", "핸드크림", "🙌", "손 보습을 챙기세요");
  }
  // 2월 (늦겨울)
  else if (month === 2) {
    addOptional("lip_balm", "립밤", "💄", "여전히 건조한 날씨예요");
    addOptional("hand_cream", "핸드크림", "🙌", "손이 거칠어질 수 있어요");
  }
  // 3월 (환절기/황사)
  else if (month === 3) {
    addOptional("hand_cream", "핸드크림", "🙌", "환절기라 건조해요");
    addOptional("mask", "마스크", "😷", "황사와 먼지를 조심하세요");
  }
  // 4월 (봄/꽃가루)
  else if (month === 4) {
    addOptional("allergy_med", "알러지 약", "💊", "꽃가루 알러지 대비하세요");
    addOptional("mask", "마스크", "😷", "꽃가루와 먼지 차단!");
    addOptional("wet_wipes", "물티슈", "🧻", "야외 활동 시 유용해요");
  }
  // 5월 (나들이)
  else if (month === 5) {
    addOptional("water", "가벼운 물병", "💧", "산책하며 수분 보충하세요");
    addOptional("wet_wipes", "물티슈", "🧻", "나들이 필수템이에요");
  }
  // 6월 (초여름)
  else if (month === 6) {
    addOptional("deodorant", "데오드란트", "✨", "땀 냄새 걱정 뚝!");
    addOptional("powder_sheet", "파우더 시트", "📄", "끈적임 없이 상쾌하게");
  }
  // 7월 (장마/무더위)
  else if (month === 7) {
    addOptional("tumbler", "텀블러(얼음)", "🧊", "시원한 물을 챙기세요");
    addOptional("handy_fan", "부채/선풍기", "🌬️", "더위를 날려보세요");
  }
  // 8월 (한여름)
  else if (month === 8) {
    addOptional("tumbler", "텀블러(얼음)", "🧊", "수분 보충이 중요해요");
    addOptional("cooling_spray", "쿨링 스프레이", "❄️", "즉각적인 시원함을 느껴보세요");
  }
  // 9월 (초가을)
  else if (month === 9) {
    addOptional("mist", "미스트", "💦", "피부가 당길 수 있어요");
    addOptional("thin_cardigan", "얇은 가디건", "🧶", "아침저녁으로 쌀쌀해요");
  }
  // 10월 (가을)
  else if (month === 10) {
    addOptional("hand_cream", "핸드크림", "🙌", "보습이 필요한 계절이에요");
    addOptional("lip_balm", "립밤", "💄", "입술을 촉촉하게");
  }
  // 11월 (늦가을)
  else if (month === 11) {
    addOptional("hand_cream", "핸드크림", "🙌", "손이 시리고 건조해요");
    addOptional("warm_eyemask", "온열 안대", "😴", "눈의 피로를 풀어주세요");
  }
  // 12월 (겨울)
  else if (month === 12) {
    addOptional("lip_balm", "립밤", "💄", "겨울철 필수템!");
    addOptional("hotpack", "핫팩", "🔥", "주머니 속 따뜻함");
  }

  return items;
};
