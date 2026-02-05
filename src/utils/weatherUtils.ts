import type { WeatherItem } from "../api/weather";
import type { DustItem } from "../api/dust";

/**
 * 체감 온도를 계산합니다. (기상청 공식 사용)
 */
export const calculateFeelsLike = (temp: number, windSpeed: number): number => {
  if (temp <= 10 && windSpeed >= 1.3) {
    const v = windSpeed * 3.6; // m/s -> km/h
    const chill = 13.12 + 0.6215 * temp - 11.37 * Math.pow(v, 0.16) + 0.3965 * temp * Math.pow(v, 0.16);
    return Math.round(chill * 10) / 10;
  }
  return temp;
};

/**
 * 기온 비교 상세 정보를 생성합니다.
 */
export const getTempComparisonInfo = (current: number, target: number) => {
  const diff = current - target;
  const absDiff = Math.abs(diff);
  const status = diff > 0 ? "높고" : diff < 0 ? "낮고" : "같고";
  const suffix = diff === 0 ? "같아요" : diff > 0 ? "높아요" : "낮아요";
  const type = diff > 0 ? "up" : diff < 0 ? "down" : "same";

  const formatDiff = (v: number) => (v % 1 === 0 ? v.toString() : v.toFixed(1));

  return {
    diff: formatDiff(absDiff),
    status,
    suffix,
    type,
  };
};

/**
 * 기온 비교 메시지를 생성합니다.
 */
export const getTempComparisonMessage = (currentTemp: number, targetTemp: number, currentFeels: number, targetFeels: number, isTomorrow: boolean = false): string => {
  const t = getTempComparisonInfo(currentTemp, targetTemp);
  const f = getTempComparisonInfo(currentFeels, targetFeels);
  const subject = isTomorrow ? "내일은 오늘보다" : "어제보다";

  return `${subject} 기온은 ${t.diff}도 ${t.status}, 체감온도는 ${f.diff}도 ${f.suffix}`;
};

/**
 * 기상 상태 아이콘을 반환합니다.
 */
export const getWeatherIcon = (sky: string, pty: string, time: string): string => {
  const hour = parseInt(time.slice(0, 2));
  const isNight = hour < 6 || hour >= 19;

  if (pty === "1" || pty === "4" || pty === "5") return "🌧️";
  if (pty === "2" || pty === "6") return "🌨️";
  if (pty === "3" || pty === "7") return "❄️";

  if (sky === "1") return isNight ? "🌙" : "☀️";
  if (sky === "3") return isNight ? "☁️" : "⛅";
  if (sky === "4") return "☁️";

  return "❓";
};

/**
 * 날씨 데이터를 시간별로 그룹화합니다.
 */
export const groupForecastItems = (items: WeatherItem[]) => {
  const grouped: {
    date: string;
    time: string;
    temp: string;
    sky: string;
    pty: string;
    pop: string;
    wsd: string;
  }[] = [];
  const map = new Map<
    string,
    {
      date: string;
      time: string;
      temp: string;
      sky: string;
      pty: string;
      pop: string;
      wsd: string;
    }
  >();

  items.forEach((item) => {
    const key = `${item.fcstDate}_${item.fcstTime}`;
    if (!map.has(key)) {
      map.set(key, {
        date: item.fcstDate || "",
        time: item.fcstTime || "",
        temp: "",
        sky: "",
        pty: "",
        pop: "",
        wsd: "",
      });
    }
    const g = map.get(key);
    if (!g) return;

    switch (item.category) {
      case "TMP":
      case "T1H":
        g.temp = item.fcstValue || "";
        break;
      case "SKY":
        g.sky = item.fcstValue || "";
        break;
      case "PTY":
        g.pty = item.fcstValue || "";
        break;
      case "POP":
        g.pop = item.fcstValue || "";
        break;
      case "WSD":
        g.wsd = item.fcstValue || "";
        break;
    }
  });

  map.forEach((val) => grouped.push(val));
  return grouped.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
};

/**
 * 일출/일몰 시간을 계산합니다. (단순화된 알고리즘)
 */
export const getSunTimes = () => {
  const now = new Date();
  const times = {
    sunrise: "07:30",
    sunset: "18:00",
  };

  // 실제로는 정확한 계산이 필요하지만, 여기서는 좌표와 날짜를 기반으로 한 근사치 또는
  // 라이브러리 역할을 할 함수를 구현합니다.
  // 실제 상용 서비스라면 suncalc 같은 라이브러리를 쓰지만, 여기서는 구현을 단순화하거나
  // 표준 시간대를 고려한 근사 로직을 넣습니다.

  // 한국 기준 대략적인 보정 (겨울/여름 차이 반영)
  const month = now.getMonth() + 1;
  if (month >= 11 || month <= 2) {
    // 겨울
    times.sunrise = "07:40";
    times.sunset = "17:30";
  } else if (month >= 5 && month <= 8) {
    // 여름
    times.sunrise = "05:20";
    times.sunset = "19:40";
  } else {
    // 봄/가을
    times.sunrise = "06:30";
    times.sunset = "18:30";
  }

  return times;
};

/**
 * 자외선 지수를 추정합니다.
 */
export const getUVIndex = (sky: string, time: string): { value: number; label: string; color: string } => {
  const hour = parseInt(time.slice(0, 2));
  let baseUV = 0;

  // 시간대별 베이스 (정오에 가장 높음)
  if (hour >= 11 && hour <= 14) baseUV = 7;
  else if ((hour >= 9 && hour <= 10) || (hour >= 15 && hour <= 16)) baseUV = 4;
  else if ((hour >= 17 && hour <= 18) || (hour >= 7 && hour <= 8)) baseUV = 1;
  else baseUV = 0;

  // 하늘 상태에 따른 보정
  if (sky === "1")
    baseUV *= 1.0; // 맑음
  else if (sky === "3")
    baseUV *= 0.6; // 구름많음
  else baseUV *= 0.3; // 흐림

  const value = Math.round(baseUV);
  if (value >= 11) return { value, label: "위험", color: "text-purple-400" };
  if (value >= 8) return { value, label: "매우높음", color: "text-red-400" };
  if (value >= 6) return { value, label: "높음", color: "text-orange-400" };
  if (value >= 3) return { value, label: "보통", color: "text-yellow-400" };
  return { value, label: "낮음", color: "text-green-300" };
};

/**
 * 빨래 지수를 계산합니다.
 */
export const getLaundryIndex = (temp: number, humidity: number, pty: string): { value: number; label: string; tip: string } => {
  if (pty !== "0")
    return {
      value: 10,
      label: "불가",
      tip: "비나 눈이 와요. 실내 건조하세요!",
    };

  let score = 100;
  if (humidity > 80) score -= 40;
  else if (humidity > 60) score -= 20;

  if (temp < 5) score -= 30;
  else if (temp < 15) score -= 10;

  if (score >= 80) return { value: score, label: "최적", tip: "뽀송뽀송하게 잘 말라요!" };
  if (score >= 60) return { value: score, label: "좋음", tip: "야외 건조하기 좋은 날이에요." };
  if (score >= 40) return { value: score, label: "보통", tip: "마르는 데 시간이 좀 걸려요." };
  return { value: score, label: "나쁨", tip: "습도가 높아 잘 안 말라요." };
};

/**
 * 세차 지수를 계산합니다.
 */
export const getCarWashIndex = (pty: string, forecast: { pty: string; pop: string }[]): { value: number; label: string; tip: string } => {
  // 오늘 비 소식 확인
  if (pty !== "0") return { value: 10, label: "불가", tip: "지금 비/눈이 내려요." };

  // 향후 24시간 내 비 소식 확인
  const rainSoon = forecast.slice(0, 8).some((f) => f.pty !== "0" || parseInt(f.pop) > 50);

  if (rainSoon)
    return {
      value: 30,
      label: "글쎄요",
      tip: "곧 비 소식이 있어요. 미루는 걸 추천!",
    };

  return { value: 90, label: "추천", tip: "세차하기 완벽한 날씨예요!" };
};

/**
 * 현재 날씨 상태와 환경 데이터를 기반으로 감성적인 문구를 생성합니다.
 * 우선순위: 특수 상황(폭염/한파) > 미세먼지 > 강수 > 체감 온도 > 하늘 상태 > 시간대
 */
export const getMoodMessage = (temp: number, feelsLike: number, pty: string, sky: string, dustData: DustItem | null, baseTime: string): string => {
  const currentHour = parseInt(baseTime.substring(0, 2));

  // 랜덤 선택 유틸리티
  const pickRandom = (messages: string[]) => messages[Math.floor(Math.random() * messages.length)];

  // 1. 특수 기상 상황 (폭염 / 한파)
  if (temp >= 30 || feelsLike >= 30) {
    return pickRandom(["시원한 바람 같은 기분 좋은 소식을 기대해요 🌊", "아무것도 안 해도 충분히 애쓴 하루예요 🫠", "오늘의 목표는 ‘버티기’도 성공이에요 ❄️"]);
  }
  if (temp <= -5 || feelsLike <= -5) {
    return pickRandom(["소중한 사람들과 온기를 나누는 하루 되세요 🔥🧣", "따뜻한 것 하나쯤은 꼭 챙겨도 되는 날이에요 ☕", "추운 날일수록 마음은 더 포근하게 ❄️"]);
  }

  // 2. 대기질 상태 (미세먼지 나쁨 이상)
  if (dustData && parseInt(dustData.pm10Grade) >= 3) {
    return pickRandom(["마음만은 누구보다 맑고 화창한 하루 되세요 🌿", "오늘은 밖보다 나를 먼저 챙기는 날이에요 😷", "천천히 숨 쉬고, 무리하지 마세요 🍃"]);
  }

  // 3. 강수 형태
  if (pty === "1" || pty === "4" || pty === "5") {
    // 비
    return pickRandom(["토닥토닥 빗소리에 마음까지 차분해지네요 🌧️☕", "우산 속 작은 쉼표 같은 하루예요 ☂️", "살짝 느려져도 괜찮은, 비 오는 하루예요 🌦️"]);
  }
  if (pty === "2" || pty === "3" || pty === "6" || pty === "7") {
    // 눈
    return pickRandom(["하얀 눈처럼 설레는 일이 생길 것 같아요 ❄️✨", "세상이 조용해지는 눈 오는 날의 마법 ⛄", "발자국 소리마저 부드러운 하루예요 ❄️"]);
  }

  // 4. 시간대 보정 (특수 상황이 아닐 때 확률적으로 인사말 제공)
  // 30% 확률로 시간대 인사말 우선 노출
  if (Math.random() < 0.3) {
    if (currentHour >= 6 && currentHour <= 9) return "하루의 공기가 첫인사를 건네요 🌤️";
    if (currentHour >= 18 && currentHour <= 21) return "오늘 하루도 여기까지, 수고했어요 🌙";
    if (currentHour >= 22 || currentHour <= 4) return "하늘도 조용해진 시간, 나에게 집중해요 🌌";
  }

  // 5. 아주 맑을 때
  if (sky === "1") {
    return pickRandom(["눈부신 햇살만큼 당신의 오늘이 반짝이길 ✨🌞", "하늘까지 응원해주는 하루예요 🌈", "괜히 기분 좋아지는 하늘이에요 ☀️"]);
  }

  // 6. 그 외 모든 경우 (흐림, 구름 많음 등)
  return pickRandom(["포근한 구름 아래 잠시 쉬어가기 좋은 날이에요 ☁️💪", "천천히 가도 괜찮은 하루예요 ☁️", "괜히 멍하니 하늘 보게 되는 날이에요 ☁️"]);
};

/**
 * 풍향 코드를 한글/영문 방향으로 변환합니다.
 */
export const getWindDirection = (vecstr: string): string => {
  const vec = parseFloat(vecstr);
  if (isNaN(vec)) return "";
  const directions = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  const index = Math.floor((vec + 22.5) / 45) % 8;
  return directions[index];
};
