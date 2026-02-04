import type { WeatherItem } from "../api/weather";
import type { DustItem } from "../api/dust";
import { getPm10GradeInfo, getPm25GradeInfo } from "../utils/dustUtils";
import {
  calculateFeelsLike,
  getTempComparisonInfo,
} from "../utils/weatherUtils";
import { LocateFixed } from "lucide-react";
import { MapPin } from "lucide-react";

interface Props {
  data: WeatherItem[];
  dustData: DustItem | null;
  yesterdayData: WeatherItem[] | null;
  forecastData: WeatherItem[] | null;
  locationName: string;
  onOpenModal: () => void;
  onCurrentLocation: () => void;
  gpsLoading: boolean;
}

export default function WeatherNowCard({
  data,
  dustData,
  yesterdayData,
  forecastData,
  locationName,
  onOpenModal,
  onCurrentLocation,
  gpsLoading,
}: Props) {
  const getValue = (items: WeatherItem[], category: string) =>
    items.find((item) => item.category === category)?.obsrValue ||
    items.find((item) => item.category === category)?.fcstValue ||
    "-";

  const temperature = getValue(data, "T1H");
  const humidity = getValue(data, "REH");
  const pty = getValue(data, "PTY"); // 강수형태 code
  const sky = getValue(data, "SKY"); // 하늘상태 code
  const windSpeed = getValue(data, "WSD");

  // 풍향 변환
  const getWindDirection = (vecstr: string) => {
    const vec = parseFloat(vecstr);
    if (isNaN(vec)) return "";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.floor((vec + 22.5) / 45) % 8;
    return directions[index];
  };

  const windDirection = getWindDirection(getValue(data, "VEC"));

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

  const tempVal = parseFloat(temperature);
  const windVal = parseFloat(windSpeed);
  const feelsLike = calculateFeelsLike(tempVal, windVal);

  // --- 어제 날씨 비교 데이터 가공 ---
  let yesterdayUI = null;
  if (yesterdayData) {
    const yTemp = parseFloat(getValue(yesterdayData, "T1H"));
    const yWind = parseFloat(getValue(yesterdayData, "WSD"));
    if (!isNaN(yTemp) && !isNaN(yWind)) {
      const yFeels = calculateFeelsLike(yTemp, yWind);
      const tInfo = getTempComparisonInfo(tempVal, yTemp);
      const fInfo = getTempComparisonInfo(feelsLike, yFeels);

      const getColorClass = (type: string) => {
        if (type === "up") return "text-red-200 font-black";
        if (type === "down") return "text-blue-200 font-black";
        return "text-white/90 font-bold";
      };

      yesterdayUI = (
        <div className="flex items-center gap-2">
          <span className="text-sm">📅</span>
          <p className="text-[11px] leading-relaxed text-blue-50/90 font-medium">
            어제보다 기온은{" "}
            <span className={getColorClass(tInfo.type)}>
              {tInfo.diff}도 {tInfo.status}
            </span>
            , 체감은{" "}
            <span className={getColorClass(fInfo.type)}>
              {fInfo.diff}도 {fInfo.suffix}
            </span>
          </p>
        </div>
      );
    }
  }

  let tomorrowUI = null;
  if (forecastData) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = `${tomorrow.getFullYear()}${("0" + (tomorrow.getMonth() + 1)).slice(-2)}${("0" + tomorrow.getDate()).slice(-2)}`;
    const currentHourStr = ("0" + new Date().getHours()).slice(-2) + "00";

    const tItems = forecastData.filter(
      (item) =>
        item.fcstDate === tomorrowDate && item.fcstTime === currentHourStr,
    );
    const tTemp = parseFloat(
      tItems.find((i) => i.category === "TMP" || i.category === "T1H")
        ?.fcstValue || "",
    );
    const tWind = parseFloat(
      tItems.find((i) => i.category === "WSD")?.fcstValue || "",
    );

    if (!isNaN(tTemp) && !isNaN(tWind)) {
      const tFeels = calculateFeelsLike(tTemp, tWind);
      const tInfo = getTempComparisonInfo(tTemp, tempVal);
      const fInfo = getTempComparisonInfo(tFeels, feelsLike);

      const getColorClass = (type: string) => {
        if (type === "up") return "text-red-200 font-black";
        if (type === "down") return "text-blue-200 font-black";
        return "text-white/90 font-bold";
      };

      tomorrowUI = (
        <div className="flex items-center gap-2">
          <span className="text-sm">🔮</span>
          <p className="text-[11px] leading-relaxed text-blue-50/90 font-medium">
            내일은 오늘보다 기온은{" "}
            <span className={getColorClass(tInfo.type)}>
              {tInfo.diff}도 {tInfo.status}
            </span>
            , 체감은{" "}
            <span className={getColorClass(fInfo.type)}>
              {fInfo.diff}도 {fInfo.suffix}
            </span>
          </p>
        </div>
      );
    }
  }

  // 감성 메시지
  const getMoodText = () => {
    if (pty === "1" || pty === "4" || pty === "5")
      return "토닥토닥 빗소리에 마음까지 차분해지네요 🌧️☕";
    if (pty === "2" || pty === "3" || pty === "6" || pty === "7")
      return "하얀 눈처럼 설레는 일이 생길 것 같아요 ❄️✨";
    if (dustData && parseInt(dustData.pm10Grade) >= 3)
      return "마음만은 누구보다 맑고 화창한 하루 되세요 🌿";
    if (!isNaN(tempVal)) {
      if (tempVal >= 30) return "시원한 바람 같은 기분 좋은 소식을 기대해요 🌊";
      if (tempVal <= -5)
        return "소중한 사람들과 온기를 나누는 하루 되세요 🔥🧣";
    }
    if (sky === "1") return "눈부신 햇살만큼 당신의 오늘이 반짝이길 ✨🌞";
    return "포근한 구름 아래 잠시 쉬어가기 좋은 날이에요 ☁️💪";
  };

  // 미세먼지 상태 텍스트 & 색상
  const pm10Info = dustData ? getPm10GradeInfo(dustData.pm10Value) : null;
  const pm25Info = dustData ? getPm25GradeInfo(dustData.pm25Value) : null;

  return (
    <div className="bg-gradient-to-br from-blue-500/80 to-blue-600/80 p-6 rounded-[1rem] shadow-2xl backdrop-blur-md border border-white/20 text-white w-full max-w-md mx-auto mb-6 transform transition hover:scale-[1.01]">
      {/* Location Bar (Inline Style) */}

      <div className="flex gap-2 mb-6 justify-between">
        <strong className="text-lg font-black break-keep tracking-tight drop-shadow-sm group-hover:text-blue-100 transition-colors">
          {locationName}
        </strong>

        <div className="flex items-center gap-1.5 self-start">
          <button
            onClick={onCurrentLocation}
            disabled={gpsLoading}
            className={`bg-white/20 p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90
              ${gpsLoading ? "animate-pulse ring-2 ring-white/50 shadow-lg" : "hover:bg-white/30 shadow-sm"}`}
            title="현재 위치로 설정"
          >
            <span
              className={`text-xs block ${gpsLoading ? "animate-spin" : ""}`}
            >
              <LocateFixed size={16} />
            </span>
          </button>
          <button
            onClick={onOpenModal}
            className="bg-white/20 p-1.5 rounded-full backdrop-blur-md  transition-all active:scale-90"
          >
            <span className="text-xs block">
              <MapPin size={16} />
            </span>
          </button>
        </div>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div className="w-full">
          <h2 className="flex gap-2 items-center text-3xl font-black tracking-tighter drop-shadow-sm w-full">
            {getPtyText(pty)}

            <span className="text-3xl filter drop-shadow-md">
              {pty !== "0"
                ? pty === "3"
                  ? "❄️"
                  : "☔"
                : sky === "1"
                  ? "☀️"
                  : "☁️"}
            </span>
          </h2>
          <p className="w-full text-blue-50/90 text-sm mt-2 font-bold break-keep leading-relaxed text-left">
            {getMoodText()}
          </p>
        </div>

        {/* <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner">
          <span className="text-3xl filter drop-shadow-md">
            {pty !== "0"
              ? pty === "3"
                ? "❄️"
                : "☔"
              : sky === "1"
                ? "☀️"
                : "☁️"}
          </span>
        </div> */}
      </div>

      <div className="flex items-end gap-2 mb-4">
        <span className="text-6xl font-bold tracking-tighter drop-shadow-lg">
          {temperature}°
        </span>
        <span className="text-xl text-blue-100 mb-2 font-medium opacity-90">
          체감 {feelsLike}°
        </span>
      </div>

      {/* [개선] 기온 비교 메시지 영역 (색상 강조 적용) */}
      {(yesterdayUI || tomorrowUI) && (
        <div className="mb-6 space-y-2 p-4 rounded-2xl bg-black/10 border border-white/5 backdrop-blur-sm shadow-inner text-left">
          {yesterdayUI}
          {tomorrowUI}
        </div>
      )}

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
            <span
              className={`text-xs font-bold ${pm10Info?.grade && pm10Info.grade >= 3 ? "text-red-200" : "text-blue-100"}`}
            >
              {pm10Info?.label || "-"}
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
            <span
              className={`text-xs font-bold ${pm25Info?.grade && pm25Info.grade >= 3 ? "text-red-200" : "text-blue-100"}`}
            >
              {pm25Info?.label || "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
