import type { WeatherItem } from "../api/weather";

/**
 * 체감 온도를 계산합니다. (기상청 공식 사용)
 */
export const calculateFeelsLike = (temp: number, windSpeed: number): number => {
  if (temp <= 10 && windSpeed >= 1.3) {
    const v = windSpeed * 3.6; // m/s -> km/h
    const chill =
      13.12 +
      0.6215 * temp -
      11.37 * Math.pow(v, 0.16) +
      0.3965 * temp * Math.pow(v, 0.16);
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
export const getTempComparisonMessage = (
  currentTemp: number,
  targetTemp: number,
  currentFeels: number,
  targetFeels: number,
  isTomorrow: boolean = false,
): string => {
  const t = getTempComparisonInfo(currentTemp, targetTemp);
  const f = getTempComparisonInfo(currentFeels, targetFeels);
  const subject = isTomorrow ? "내일은 오늘보다" : "어제보다";

  return `${subject} 기온은 ${t.diff}도 ${t.status}, 체감온도는 ${f.diff}도 ${f.suffix}`;
};

/**
 * 기상 상태 아이콘을 반환합니다.
 */
export const getWeatherIcon = (
  sky: string,
  pty: string,
  time: string,
): string => {
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
  const grouped: any[] = [];
  const map = new Map<string, any>();

  items.forEach((item) => {
    const key = `${item.fcstDate}_${item.fcstTime}`;
    if (!map.has(key)) {
      map.set(key, {
        date: item.fcstDate,
        time: item.fcstTime,
        temp: "",
        sky: "",
        pty: "",
        pop: "",
        wsd: "",
      });
    }
    const g = map.get(key);
    switch (item.category) {
      case "TMP":
      case "T1H":
        g.temp = item.fcstValue;
        break;
      case "SKY":
        g.sky = item.fcstValue;
        break;
      case "PTY":
        g.pty = item.fcstValue;
        break;
      case "POP":
        g.pop = item.fcstValue;
        break;
      case "WSD":
        g.wsd = item.fcstValue;
        break;
    }
  });

  map.forEach((val) => grouped.push(val));
  return grouped.sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time),
  );
};
