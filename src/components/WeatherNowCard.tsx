import type { WeatherItem } from "../api/weather";
import type { DustItem } from "../api/dust";
import { calculateFeelsLike, getTempComparisonInfo, getMoodMessage } from "../utils/weatherUtils";
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
  isForecast?: boolean;
}

export default function WeatherNowCard({ data, dustData, yesterdayData, forecastData, locationName, onOpenModal, onCurrentLocation, gpsLoading, isForecast = false }: Props) {
  const getValue = (items: WeatherItem[], category: string) => items.find((item) => item.category === category)?.obsrValue || items.find((item) => item.category === category)?.fcstValue || "-";
  console.log(isForecast);
  const temperature = getValue(data, "T1H");
  const pty = getValue(data, "PTY"); // 강수형태 code
  const sky = getValue(data, "SKY"); // 하늘상태 code
  const windSpeed = getValue(data, "WSD");

  // const windDirection = getWindDirection(getValue(data, "VEC"));

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

  // 강수/하늘 상태에 따른 이모지 반환
  const getWeatherEmoji = (code: string, skyCode: string) => {
    switch (code) {
      case "1":
        return "🌧️"; // 비
      case "2":
        return "🌧️❄️"; // 비/눈
      case "3":
        return "☃️"; // 눈
      case "4":
        return "🌦️"; // 소나기
      case "5":
        return "💧"; // 빗방울
      case "6":
        return "💧❄️"; // 빗방울/눈날림
      case "7":
        return "🌬️❄️"; // 눈날림
      default:
        // PTY가 0일 때 하늘 상태에 따른 이모지
        return skyCode === "1" ? "☀️" : skyCode === "3" ? "⛅" : "☁️";
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
          <div className="flex flex-col justify-start items-start text-[11px] leading-relaxed text-blue-50/90 font-medium">
            <span>오늘은 어제보다 </span>
            <span className={getColorClass(tInfo.type)}>
              {tInfo.diff}° {tInfo.status},
            </span>
            <span>체감온도는</span>
            <span>
              <span className={getColorClass(fInfo.type)}>
                {fInfo.diff}° {fInfo.suffix}
              </span>
            </span>
          </div>
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

    const tItems = forecastData.filter((item) => item.fcstDate === tomorrowDate && item.fcstTime === currentHourStr);
    const tTemp = parseFloat(tItems.find((i) => i.category === "TMP" || i.category === "T1H")?.fcstValue || "");
    const tWind = parseFloat(tItems.find((i) => i.category === "WSD")?.fcstValue || "");

    if (!isNaN(tTemp) && !isNaN(tWind)) {
      const tFeels = calculateFeelsLike(tTemp, tWind);
      const tInfo = getTempComparisonInfo(tTemp, tempVal);
      const fInfo = getTempComparisonInfo(tFeels, feelsLike);

      const getColorClass = (type: string) => {
        if (type === "up") return "text-red-200 font-semibold";
        if (type === "down") return "text-blue-200 font-semibold";
        return "text-white/90 font-bold";
      };

      tomorrowUI = (
        <div className="flex items-center gap-2">
          <div className="flex flex-col justify-start items-start text-[11px] leading-relaxed text-blue-50/90 font-medium">
            <span>내일은 오늘보다 </span>
            <span className={getColorClass(tInfo.type)}>
              {tInfo.diff}도 {tInfo.status},
            </span>
            <span>체감온도는</span>
            <span>
              <span className={getColorClass(fInfo.type)}>
                {fInfo.diff}도 {fInfo.suffix}
              </span>
            </span>
          </div>
        </div>
      );
    }
  }

  // [고도화] 감성 문구 산출 (우선순위 및 랜덤 적용)
  const moodyText = getMoodMessage(Number(temperature) || 0, Number(feelsLike) || 0, pty, sky, dustData, data[0]?.baseTime || "1200");

  // 미세먼지 상태 텍스트 & 색상 (이제 상세 카드로 이동)

  return (
    <div className="bg-gradient-to-br from-blue-500/80 to-blue-600/80 p-5 rounded-[1rem] shadow-2xl backdrop-blur-md border border-white/20 text-white w-full max-w-md mx-auto mb-2">
      {/* Location Bar (Inline Style) */}

      <div className="flex gap-2 mb-5 justify-between">
        <strong className="text-lg font-semibold break-keep tracking-tight drop-shadow-sm">{locationName}</strong>

        <div className="flex items-center gap-1.5 self-start">
          <button
            onClick={onCurrentLocation}
            disabled={gpsLoading}
            className={`bg-white/20 p-1.5 rounded-full backdrop-blur-md transition-all active:scale-90
              ${gpsLoading ? "animate-pulse ring-2 ring-white/50 shadow-lg" : "hover:bg-white/30 shadow-sm"}`}
            title="현재위치로 설정"
          >
            <span className={`text-xs block ${gpsLoading ? "animate-spin" : ""}`}>
              <LocateFixed size={16} />
            </span>
          </button>
          <button onClick={onOpenModal} className="bg-white/20 p-1.5 rounded-full backdrop-blur-md  transition-all active:scale-90">
            <span className="text-xs block">
              <MapPin size={16} />
            </span>
          </button>
        </div>
      </div>

      <div className="flex justify-between items-start mb-2">
        <div className="w-full">
          <h2 className="flex gap-2 items-center text-3xl font-black tracking-tighter drop-shadow-sm w-full mb-2">
            {getPtyText(pty)}
            <span className="text-3xl filter drop-shadow-md">{getWeatherEmoji(pty, sky)}</span>
          </h2>
          <p className="text-sm leading-relaxed opacity-90 break-keep">{moodyText}</p>
        </div>
      </div>

      <div className="flex items-end gap-2 mb-1.5 p-4 rounded-[.8rem] bg-black/30 border border-white/5 backdrop-blur-sm shadow-inner justify-center relative">
        <span className="text-5xl font-bold tracking-tighter drop-shadow-lg">{temperature}°</span>
        <span className="flex flex-col items-center text-sm text-blue-100 mb-2 font-medium opacity-90">(체감 {feelsLike}°)</span>
        {/* {isForecast && <span className="absolute top-2 right-2 text-[10px] bg-red-500/80 px-1.5 py-0.5 rounded text-white font-bold tracking-tighter shadow-sm animate-pulse">예보값</span>} */}
      </div>

      {/* [개선] 기온 비교 메시지 영역 (색상 강조 적용) */}
      {(yesterdayUI || tomorrowUI) && (
        <div className="flex gap-1.5 mb-0">
          <div className="bg-black/30 backdrop-blur-sm p-3 rounded-[.8rem] flex-1">{yesterdayUI}</div>
          <div className="bg-black/30 backdrop-blur-sm p-3 rounded-[.8rem] flex-1">{tomorrowUI}</div>
        </div>
      )}
    </div>
  );
}
