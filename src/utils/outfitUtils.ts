export interface OutfitItem {
  name: string;
  icon: string;
}

export interface OutfitRecommendation {
  summary: string;
  items: OutfitItem[];
  emoji: string;
  color: string;
}

export const getOutfitByTemperature = (temp: number): OutfitRecommendation => {
  if (temp >= 28) {
    return {
      summary: "한여름이니 최대한 시원하게 입으세요!",
      items: [
        { name: "민소매", icon: "🎽" },
        { name: "반바지", icon: "🩳" },
        { name: "린넨 옷", icon: "👕" },
        { name: "원피스", icon: "👗" },
      ],
      emoji: "🥵",
      color: "bg-red-100 text-red-700 border-red-200",
    };
  } else if (temp >= 23) {
    return {
      summary: "조금 덥지만 얇은 옷이면 괜찮아요.",
      items: [
        { name: "반팔", icon: "👕" },
        { name: "얇은 셔츠", icon: "👔" },
        { name: "반바지", icon: "🩳" },
        { name: "면바지", icon: "👖" },
      ],
      emoji: "😎",
      color: "bg-orange-100 text-orange-700 border-orange-200",
    };
  } else if (temp >= 20) {
    return {
      summary: "활동하기 딱 좋은 따뜻한 날씨예요.",
      items: [
        { name: "얇은 가디건", icon: "🧥" },
        { name: "긴팔 티셔츠", icon: "👕" },
        { name: "면바지", icon: "👖" },
        { name: "청바지", icon: "👖" },
      ],
      emoji: "😊",
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
  } else if (temp >= 17) {
    return {
      summary: "살짝 서늘할 수 있으니 겉옷을 챙기세요.",
      items: [
        { name: "얇은 니트", icon: "🧶" },
        { name: "맨투맨", icon: "👕" },
        { name: "후드", icon: "🧥" },
        { name: "가디건", icon: "🧥" },
        { name: "청바지", icon: "👖" },
      ],
      emoji: "🍂",
      color: "bg-green-100 text-green-700 border-green-200",
    };
  } else if (temp >= 12) {
    return {
      summary: "쌀쌀해요. 자켓이나 가디건이 필수입니다.",
      items: [
        { name: "자켓", icon: "🧥" },
        { name: "가디건", icon: "🧥" },
        { name: "야상", icon: "🧥" },
        { name: "스타킹", icon: "🧦" },
        { name: "청바지", icon: "👖" },
      ],
      emoji: "🌬️",
      color: "bg-teal-100 text-teal-700 border-teal-200",
    };
  } else if (temp >= 9) {
    return {
      summary: "꽤 춥습니다. 트렌치코트나 점퍼를 입으세요.",
      items: [
        { name: "트렌치코트", icon: "🧥" },
        { name: "야상", icon: "🧥" },
        { name: "점퍼", icon: "🧥" },
        { name: "니트", icon: "🧶" },
        { name: "스타킹", icon: "🧦" },
      ],
      emoji: "🧥",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    };
  } else if (temp >= 5) {
    return {
      summary: "많이 추워요. 따뜻하게 입으세요.",
      items: [
        { name: "코트", icon: "🧥" },
        { name: "가죽자켓", icon: "🧥" },
        { name: "히트텍", icon: "♨️" },
        { name: "니트", icon: "🧶" },
        { name: "레깅스", icon: "👖" },
      ],
      emoji: "🧣",
      color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
  } else {
    return {
      summary: "너무 추워요! 패딩과 목도리로 무장하세요.",
      items: [
        { name: "패딩", icon: "🧥" },
        { name: "두꺼운 코트", icon: "🧥" },
        { name: "목도리", icon: "🧣" },
        { name: "장갑", icon: "🧤" },
        { name: "기모바지", icon: "👖" },
      ],
      emoji: "🥶",
      color: "bg-slate-200 text-slate-700 border-slate-300",
    };
  }
};
