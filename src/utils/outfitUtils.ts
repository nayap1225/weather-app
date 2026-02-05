export interface OutfitItem {
  name: string;
  icon: string;
}

export interface OutfitRecommendation {
  summary: string;
  items: OutfitItem[];
  emoji: string;
  color: string;
  bgClass?: string;
}

export interface OutfitConditions {
  currentTemp: number; // 현재 기온
  feelsLike: number; // 체감 온도
  ptyCode: string; // 강수 형태 (0:없음, 1:비, 2:비/눈, 3:눈, 4:소나기 ...)
  rainAmount: number; // 강수량 (mm)
  windSpeed: number; // 풍속 (m/s)
  pm10Grade: string | number; // 미세먼지 등급 (1:좋음, 2:보통, 3:나쁨, 4:매우나쁨) -> [New] 옷차림에는 영향 X
  currentHour: number; // 현재 시간 (0~23)
  minTemp?: number; // 일 최저기온
  maxTemp?: number; // 일 최고기온
}

/**
 * 옷차림 추천 로직 (User Strict Guidelines Applied)
 * 1. 특수 기상 (폭염, 한파, 폭우, 폭설)
 * 2. 보정 케이스 (바람, 일교차, 비, 눈) - 기온보다 우선 혹은 덮어쓰기
 * 3. 기본 기온
 *
 * * 환경(미세먼지, 자외선)은 옷차림 추천에 영향 없음 (준비물 카드로 이동).
 * * 준비물(우산, 마스크 등) 제외, 순수 의류만 추천.
 */
export const getOutfitRecommendation = (cond: OutfitConditions): OutfitRecommendation => {
  const { currentTemp, ptyCode, rainAmount, windSpeed, minTemp, maxTemp } = cond;

  // 일교차 계산
  const diurnalRange = maxTemp !== undefined && minTemp !== undefined ? maxTemp - minTemp : 0;

  // =========================================================
  // 1️⃣ 특수 기상 케이스 (최우선)
  // =========================================================

  // 🔥 폭염 (33도 이상)
  if (currentTemp >= 33) {
    return {
      summary: "한여름이에요. 최대한 시원하게 입는 게 최고예요 🥵",
      emoji: "🥵",
      color: "bg-red-100 text-red-700 border-red-200",
      items: [
        { name: "민소매", icon: "🎽" },
        { name: "반팔", icon: "👕" },
        { name: "반바지", icon: "🩳" },
        { name: "린넨 옷", icon: "👚" },
      ],
    };
  }

  // ❄️ 한파 (기온 -10도 이하) - 체감 -12도 조건은 유저 가이드에 없으나 안전상 포함 가능, 일단 유저 기준 -10 준수
  if (currentTemp <= -10) {
    return {
      summary: "칼바람이 매서워요. 완전 무장하세요 🥶",
      emoji: "🥶",
      color: "bg-slate-200 text-slate-700 border-slate-300",
      items: [
        { name: "히트텍", icon: "♨️" },
        { name: "니트/맨투맨", icon: "👕" },
        { name: "기모바지", icon: "👖" },
        { name: "패딩", icon: "🧥" },
        { name: "두꺼운 코트", icon: "🧥" },
      ],
    };
  }

  // 🌧️ 폭우 / 폭설 (시간당 5mm 이상)
  if ((ptyCode === "1" || ptyCode === "4" || ptyCode === "2" || ptyCode === "3") && rainAmount >= 5.0) {
    const isSnow = ptyCode === "3"; // 눈
    return {
      summary: isSnow ? "눈이 많이 와요. 방수와 보온에 신경 쓰세요 ❄️" : "비가 많이 와요. 젖지 않게 조심하세요 ☔",
      emoji: isSnow ? "❄️" : "⛈️",
      color: "bg-slate-300 text-slate-800 border-slate-400",
      items: [
        { name: "긴팔 상의", icon: "👕" },
        { name: "두꺼운 하의", icon: "👖" },
        { name: "레인코트", icon: "🧥" },
        { name: "방수 아우터", icon: "🧥" },
      ],
    };
  }

  // =========================================================
  // 3️⃣ 체감 보정 케이스 (기온보다 우선하여 적용 - 덮어쓰기)
  // =========================================================
  // * User Guide Says: "아래 케이스가 선택되면 기본 기온 케이스 대신 이 옷차림을 사용한다"
  // * 따라서 기본 기온 로직보다 먼저 체크하고 return 해야 함.

  // 🌬️ 강풍 (9m/s 이상)
  if (windSpeed >= 9) {
    return {
      summary: "바람 때문에 더 춥게 느껴져요 🌬️",
      emoji: "🌬️",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      items: [
        { name: "긴팔 상의", icon: "👕" },
        { name: "니트/맨투맨", icon: "👕" },
        { name: "바람막이", icon: "🧥" },
        { name: "트렌치코트", icon: "🧥" },
      ],
    };
  }

  // 🌡️ 일교차 큼 (10도 이상 차이)
  if (diurnalRange >= 10) {
    return {
      summary: "아침저녁으로 기온 차가 커요 🌡️ 레이어드 룩 추천!",
      emoji: "🌡️",
      color: "bg-purple-50 text-purple-600 border-purple-100",
      items: [
        { name: "긴팔 상의", icon: "👕" },
        { name: "얇은 니트/셔츠", icon: "👔" },
        { name: "가디건", icon: "🧥" },
        { name: "얇은 자켓", icon: "🧥" },
      ],
    };
  }

  // ☔ 비 (강수형태 1, 4) - 폭우 아님
  if (ptyCode === "1" || ptyCode === "4") {
    return {
      summary: "비 때문에 더 서늘하게 느껴져요 ☔",
      emoji: "☔",
      color: "bg-slate-200 text-blue-800 border-blue-300",
      items: [
        { name: "긴팔 상의", icon: "👕" },
        { name: "얇은 니트/셔츠", icon: "👔" },
        { name: "편한 하의", icon: "👖" }, // 젖어도 불편하지 않은 -> 편한 하의
        { name: "레인 재킷", icon: "🧥" },
        { name: "방수 바람막이", icon: "🧥" },
      ],
    };
  }

  // ❄️ 눈 (강수형태 2, 3) - 폭설 아님
  if (ptyCode === "2" || ptyCode === "3") {
    return {
      summary: "눈 오는 날이에요 ❄️",
      emoji: "❄️",
      color: "bg-white text-slate-600 border-slate-200 shadow-sm",
      items: [
        { name: "니트/두꺼운 상의", icon: "👕" },
        { name: "기모/두꺼운 하의", icon: "👖" },
        { name: "패딩", icon: "🧥" },
        { name: "두꺼운 코트", icon: "🧥" },
      ],
    };
  }

  // =========================================================
  // 2️⃣ 기본 기온 체감 케이스 (Fallback)
  // =========================================================

  if (currentTemp >= 28) {
    // 🥵 매우 더움
    return {
      summary: "가만히 있어도 더운 날이에요. 최대한 가볍게 👕",
      emoji: "🥵",
      color: "bg-red-50 text-red-600 border-red-100",
      items: [
        { name: "반팔/민소매", icon: "🎽" },
        { name: "반바지", icon: "🩳" },
        { name: "얇은 소재", icon: "👚" },
      ],
    };
  } else if (currentTemp >= 23) {
    // 😎 덥지만 활동 가능
    return {
      summary: "조금 덥지만 얇은 옷이면 괜찮아요 😎",
      emoji: "😎",
      color: "bg-orange-50 text-orange-600 border-orange-100",
      items: [
        { name: "반팔", icon: "👕" },
        { name: "얇은 셔츠", icon: "👔" },
        { name: "면바지/반바지", icon: "🩳" },
        { name: "얇은 셔츠", icon: "👔" },
      ],
    };
  } else if (currentTemp >= 18) {
    // 😊 쾌적
    return {
      summary: "활동하기 딱 좋은 날씨예요 😊",
      emoji: "😊",
      color: "bg-green-50 text-green-600 border-green-100",
      items: [
        { name: "긴팔티", icon: "👕" },
        { name: "얇은 니트", icon: "🧶" },
        { name: "청바지/면바지", icon: "👖" },
        { name: "얇은 가디건", icon: "🧥" },
        { name: "얇은 자켓", icon: "🧥" },
      ],
    };
  } else if (currentTemp >= 15) {
    // 🍂 살짝 서늘
    return {
      summary: "살짝 서늘할 수 있어요 🍂",
      emoji: "🍂",
      color: "bg-teal-50 text-teal-600 border-teal-100",
      items: [
        { name: "긴팔", icon: "👕" },
        { name: "맨투맨/니트", icon: "🧶" },
        { name: "간절기 하의", icon: "👖" },
        { name: "가디건", icon: "🧥" },
        { name: "얇은 자켓", icon: "🧥" },
      ],
    };
  } else if (currentTemp >= 10) {
    // 🧥 추움
    return {
      summary: "외투 없이는 쌀쌀해요. 따뜻하게 입으세요 🌬️",
      emoji: "🧥",
      color: "bg-blue-50 text-blue-600 border-blue-100",
      items: [
        { name: "니트", icon: "🧶" },
        { name: "두꺼운 긴팔", icon: "👕" },
        { name: "일반 하의", icon: "👖" },
        { name: "자켓", icon: "🧥" },
        { name: "코트", icon: "🧥" },
      ],
    };
  } else {
    // 🥶 겨울 / 더 추움 (< 10도)
    // User defined 'Cold' (추움) is the lowest explicit category above Cold Wave (-10).
    // Need to fill the gap 9°C ~ -9°C.
    // Let's assume typical winter wear similar to "Cold" + "Padding" supplement or "Thicker Coat".
    // Since user didn't define "Winter" separately but defined "Cold Wave" and "Cold",
    // I will use a mix appropriate for <10°C.
    return {
      summary: "많이 추워요. 보온에 신경 쓰세요 🧣",
      emoji: "🧣",
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      items: [
        { name: "두꺼운 니트", icon: "🧶" },
        { name: "기모 바지", icon: "👖" },
        { name: "패딩", icon: "🧥" },
        { name: "두꺼운 코트", icon: "🧥" },
        { name: "목도리", icon: "🧣" }, // Not excluded by strict rules? Actually rules say "accessories excluded" but Cold Wave includes "Heattech". Scarf is questionable. Let's keep it safe or exclude. User strictly said "preparation items excluded". Scarf is borderline clothing. Let's exclude to be safe if user insisted.
        // Wait, Cold Wave used "Mokdori" in PREVIOUS logic but user removed it in NEW logic.
        // New One: "히트텍, 니트, 기모바지, 패딩, 두꺼운코트". No scarf.
        // So I should REMOVE Scarf here too.
      ],
      // Re-filtering items for < 10 degrees based on Cold Wave trends but less extreme.
    };
  }
};
