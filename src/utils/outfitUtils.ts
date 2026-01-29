export interface OutfitRecommendation {
  summary: string;
  items: string[];
  emoji: string;
  color: string; // Tailwind color class suggestion
}

export const getOutfitByTemperature = (temp: number): OutfitRecommendation => {
  if (temp >= 28) {
    return {
      summary: "한여름이니 최대한 시원하게 입으세요!",
      items: ["민소매", "반바지", "린넨 옷", "원피스"],
      emoji: "🥵",
      color: "bg-red-100 text-red-700 border-red-200"
    };
  } else if (temp >= 23) {
    return {
      summary: "조금 덥지만 얇은 옷이면 괜찮아요.",
      items: ["반팔", "얇은 셔츠", "반바지", "면바지"],
      emoji: "😎",
      color: "bg-orange-100 text-orange-700 border-orange-200"
    };
  } else if (temp >= 20) {
    return {
      summary: "활동하기 딱 좋은 따뜻한 날씨예요.",
      items: ["얇은 가디건", "긴팔 티셔츠", "면바지", "청바지"],
      emoji: "😊",
      color: "bg-yellow-100 text-yellow-700 border-yellow-200"
    };
  } else if (temp >= 17) {
    return {
      summary: "살짝 서늘할 수 있으니 겉옷을 챙기세요.",
      items: ["얇은 니트", "맨투맨", "후드", "가디건", "청바지"],
      emoji: "🍂",
      color: "bg-green-100 text-green-700 border-green-200"
    };
  } else if (temp >= 12) {
    return {
      summary: "쌀쌀해요. 자켓이나 가디건이 필수입니다.",
      items: ["자켓", "가디건", "야상", "스타킹", "청바지"],
      emoji: "🌬️",
      color: "bg-teal-100 text-teal-700 border-teal-200"
    };
  } else if (temp >= 9) {
    return {
      summary: "꽤 춥습니다. 트렌치코트나 점퍼를 입으세요.",
      items: ["트렌치코트", "야상", "점퍼", "니트", "스타킹"],
      emoji: "🧥",
      color: "bg-blue-100 text-blue-700 border-blue-200"
    };
  } else if (temp >= 5) {
    return {
      summary: "겨울이 시작되었어요. 따뜻하게 입으세요.",
      items: ["코트", "가죽자켓", "히트텍", "니트", "레깅스"],
      emoji: "🧣",
      color: "bg-indigo-100 text-indigo-700 border-indigo-200"
    };
  } else {
    return {
      summary: "너무 추워요! 패딩과 목도리로 무장하세요.",
      items: ["패딩", "두꺼운 코트", "목도리", "장갑", "기모바지"],
      emoji: "🥶",
      color: "bg-slate-200 text-slate-700 border-slate-300"
    };
  }
};
