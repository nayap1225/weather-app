import type { WeatherItem } from "../api/weather";
import type { DustItem } from "../api/dust";

interface Props {
  data: WeatherItem[];
  dustData: DustItem | null;
}

export default function WeatherNowCard({ data, dustData }: Props) {
  const getValue = (category: string) =>
    data.find((item) => item.category === category)?.obsrValue || "-";

  const temperature = getValue("T1H");
  const humidity = getValue("REH");
  const pty = getValue("PTY"); // 강수형태 code
  const sky = getValue("SKY"); // 하늘상태 code
  const windSpeed = getValue("WSD");

  // 풍향 변환
  const getWindDirection = (vecstr: string) => {
    const vec = parseFloat(vecstr);
    if (isNaN(vec)) return "";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.floor((vec + 22.5) / 45) % 8;
    return directions[index];
  };

  const windDirection = getWindDirection(getValue("VEC"));

  // 강수 상태 텍스트 변환
  const getPtyText = (code: string) => {
    switch (code) {
      case "1":
        return "비";
      case "2":
        return "비/눈";
      case "3":
        return "눈";
      case "4":
        return "소나기";
      case "5":
        return "빗방울";
      case "6":
        return "빗방울/눈날림";
      case "7":
        return "눈날림";
      default:
        return sky === "1" ? "맑음" : sky === "3" ? "구름많음" : "흐림";
    }
  };

  // 감성 메시지
  const getMoodText = () => {
    if (pty === "1" || pty === "4" || pty === "5")
      return "토닥토닥 빗소리에 마음까지 차분해지네요 🌧️☕";
    if (pty === "2" || pty === "3" || pty === "6" || pty === "7")
      return "하얀 눈처럼 설레는 일이 생길 것 같아요 ❄️✨";

    if (dustData) {
      const pm10Grade = parseInt(dustData.pm10Grade);
      if (pm10Grade >= 3) return "마음만은 누구보다 맑고 화창한 하루 되세요 🌿";
    }

    const tempVal = parseFloat(temperature);
    if (!isNaN(tempVal)) {
      if (tempVal >= 30) return "시원한 바람 같은 기분 좋은 소식을 기대해요 🌊";
      if (tempVal <= -5)
        return "소중한 사람들과 온기를 나누는 하루 되세요 🔥🧣";
    }

    if (sky === "1") return "눈부신 햇살만큼 당신의 오늘이 반짝이길 ✨🌞";
    return "포근한 구름 아래 잠시 쉬어가기 좋은 날이에요 ☁️💪";
  };

  const tempVal = parseFloat(temperature);
  const windVal = parseFloat(windSpeed);

  let feelsLike = temperature;

  // 체감온도 계산
  if (!isNaN(tempVal) && !isNaN(windVal)) {
    if (tempVal <= 10 && windVal >= 1.3) {
      const v = windVal * 3.6;
      const chill =
        13.12 +
        0.6215 * tempVal -
        11.37 * Math.pow(v, 0.16) +
        0.3965 * tempVal * Math.pow(v, 0.16);
      feelsLike = chill.toFixed(1);
    }
  }

  // 미세먼지 상태 텍스트 & 색상
  const getDustState = (grade: string) => {
    switch (grade) {
      case "1":
        return { text: "좋음", color: "text-blue-200" };
      case "2":
        return { text: "보통", color: "text-green-200" };
      case "3":
        return { text: "나쁨", color: "text-yellow-200" };
      case "4":
        return { text: "매우나쁨", color: "text-red-200" };
      default:
        return { text: "-", color: "text-gray-300" };
    }
  };

  const pm10Stat = dustData
    ? getDustState(dustData.pm10Grade)
    : { text: "-", color: "" };
  const pm25Stat = dustData
    ? getDustState(dustData.pm25Grade)
    : { text: "-", color: "" };

  return (
    <div className="bg-gradient-to-br from-blue-500/80 to-blue-600/80 p-6 rounded-3xl shadow-2xl backdrop-blur-sm border border-white/10 text-white w-full max-w-md mx-auto mb-6 transform transition hover:scale-[1.02]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-blue-100 font-medium text-xs opacity-80 uppercase tracking-wider">
            Current Weather
          </p>
          <h2 className="text-3xl font-bold mt-1">{getPtyText(pty)}</h2>
          <p className="text-blue-100/90 text-sm mt-2 font-medium break-keep leading-relaxed">
            {getMoodText()}
          </p>
        </div>
        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner">
          <span className="text-3xl filter drop-shadow-md">
            {pty !== "0"
              ? pty === "3"
                ? "❄️"
                : "☔"
              : sky === "1"
                ? "☀️"
                : "☁️"}
          </span>
        </div>
      </div>

      <div className="flex items-end gap-2 mb-6">
        <span className="text-6xl font-bold tracking-tighter drop-shadow-lg">
          {temperature}°
        </span>
        <span className="text-xl text-blue-100 mb-2 font-medium opacity-90">
          체감 {feelsLike}°
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Humidity */}
        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-white/20 transition">
          <p className="text-[10px] text-blue-200 mb-1 uppercase font-bold tracking-tighter opacity-70">
            Humidity
          </p>
          <p className="text-lg font-bold">
            {humidity}
            <span className="text-sm font-normal">%</span>
          </p>
        </div>

        {/* Wind */}
        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-white/20 transition">
          <p className="text-[10px] text-blue-200 mb-1 uppercase font-bold tracking-tighter opacity-70">
            Wind
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-lg font-bold">{windSpeed}</p>
            <span className="text-xs text-blue-100">{windDirection}</span>
            <span className="text-[10px] text-blue-200">m/s</span>
          </div>
        </div>

        {/* PM10 */}
        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-white/20 transition">
          <p className="text-[10px] text-blue-200 mb-1 uppercase font-bold tracking-tighter opacity-70">
            Fine Dust (PM10)
          </p>
          <div className="flex justify-between items-end">
            <p className="text-lg font-bold">{dustData?.pm10Value || "-"}</p>
            <span className={`text-xs font-bold ${pm10Stat.color}`}>
              {pm10Stat.text}
            </span>
          </div>
        </div>

        {/* PM2.5 */}
        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/5 hover:bg-white/20 transition">
          <p className="text-[10px] text-blue-200 mb-1 uppercase font-bold tracking-tighter opacity-70">
            Ultra Fine (PM2.5)
          </p>
          <div className="flex justify-between items-end">
            <p className="text-lg font-bold">{dustData?.pm25Value || "-"}</p>
            <span className={`text-xs font-bold ${pm25Stat.color}`}>
              {pm25Stat.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
