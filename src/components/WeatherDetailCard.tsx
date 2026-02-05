import { Droplets, Sunrise, Sunset, Sun, Shirt, Car, CloudRain, Snowflake, Wind, type LucideIcon } from "lucide-react";
import { getSunTimes, getUVIndex, getLaundryIndex, getCarWashIndex, groupForecastItems, getWindDirection } from "../utils/weatherUtils";
import { dfs_grid_to_latlng } from "../utils/coordinateConverter";
import type { WeatherItem } from "../api/weather";

interface Props {
  weatherData: WeatherItem[];
  forecastData: WeatherItem[] | null;
  nx: number;
  ny: number;
}

interface DetailItemProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  iconColor?: string;
  colorClass?: string;
  subColorClass?: string;
}

const DetailItem = ({ icon: Icon, label, value, subValue, iconColor = "text-blue-300", colorClass = "text-white", subColorClass = "text-blue-300" }: DetailItemProps) => (
  <div className="bg-black/60 p-3 rounded-[1rem] backdrop-blur-md flex flex-col gap-1 shadow-sm outline-none flex-[0_0_110px] snap-start">
    <div className="flex items-center gap-1 mb-1">
      <Icon size={16} className={iconColor} />
      <span className="text-[12px] font-medium text-white uppercase tracking-tighter">{label}</span>
    </div>
    <div className="flex flex-col justify-center text-center gap-1.5 flex-1">
      <span className={`text-lg font-black ${colorClass}`}>{value}</span>
      {subValue && <span className={`text-[12px] font-medium ${subColorClass}`}>{subValue}</span>}
    </div>
  </div>
);

export default function WeatherDetailCard({ weatherData, forecastData, nx, ny }: Props) {
  const getValue = (category: string) => weatherData.find((item) => item.category === category)?.obsrValue || "-";

  const temperature = parseFloat(getValue("T1H"));
  const humidity = parseFloat(getValue("REH"));
  const windVal = getValue("WSD");
  const pty = getValue("PTY");
  const sky = getValue("SKY");
  const vec = getValue("VEC");
  const time = weatherData[0]?.baseTime || "1200";

  // 좌표 변환 (Grid -> Lat/Lng)
  const { lat, lng } = dfs_grid_to_latlng(nx, ny);

  // 신규 데이터 계산
  const sunTimes = getSunTimes(lat, lng);
  const uv = getUVIndex(sky, time);
  const laundry = getLaundryIndex(isNaN(temperature) ? 0 : temperature, isNaN(humidity) ? 0 : humidity, pty);
  const windDirection = getWindDirection(vec);

  const hourlyForecast = forecastData ? groupForecastItems(forecastData) : [];
  const carWash = getCarWashIndex(pty, hourlyForecast);

  // 강수확률 (가장 가까운 예보 기준)
  const pop = hourlyForecast[0]?.pop || "-";

  // 강수량/적설량 (실황 기준)
  const rn1 = getValue("RN1"); // 1시간 강수량

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex gap-1.5 overflow-x-scroll pb-4 snap-x pr-4 scrollbar-hide">
        {/* 강수확률 */}
        <DetailItem icon={Droplets} label="강수확률" value={`${pop}%`} subValue={pty !== "0" ? "현재 강수 중" : "맑음"} />

        {/* 강수량 / 적설량 */}
        {(parseFloat(rn1) > 0 || (pty !== "0" && pty !== "1" && pty !== "4" && pty !== "5")) && (
          <div className="bg-black/60 p-3 rounded-[1rem] backdrop-blur-md flex flex-col justify-between shadow-lg ring-1 ring-white/10 flex-[0_0_110px] snap-start">
            <div className="flex items-center gap-1 mb-1">
              {pty === "3" || pty === "7" ? <Snowflake size={16} className="text-white" /> : <CloudRain size={16} className="text-blue-300" />}
              <span className="text-[12px] font-medium text-white uppercase tracking-tighter">실시간 강수</span>
            </div>
            <div className="flex flex-col gap-2 justify-center flex-1">
              <span className="text-xs font-medium text-white">현재 {pty === "3" || pty === "7" ? "눈이" : "비가"} 오고 있어요!</span>
              <span className="self-start text-xs font-medium text-white px-1.5 py-0.5 bg-blue-500/40 rounded-md text-xs font-black">{rn1}mm/h</span>
            </div>
          </div>
        )}

        {/* 습도 */}
        <DetailItem icon={Droplets} label="습도" value={isNaN(humidity) ? "-" : `${humidity}%`} />

        {/* 풍속 */}
        <DetailItem icon={Wind} label="풍속" value={`${windVal}m/s`} subValue={windDirection} />

        {/* 자외선 지수 */}
        <DetailItem icon={Sun} label="자외선" value={uv.label} subValue={`지수 ${uv.value}`} colorClass={uv.color} subColorClass={uv.color} iconColor="text-orange-300" />

        {/* 일출 / 일몰 */}
        <div className="bg-black/60 p-3 rounded-[1rem] backdrop-blur-md flex flex-col justify-between shadow-sm col-span-1 flex-[0_0_110px] snap-start">
          <div className="flex items-center gap-1 mb-1">
            <Sun size={16} className="text-orange-300" />
            <span className="text-[12px] font-medium text-white uppercase tracking-tighter">일출/일몰</span>
          </div>
          <div className="flex flex-col gap-2 justify-center flex-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Sunrise size={14} className="text-orange-300" />
              </div>
              <span className="text-xs font-semibold text-white">{sunTimes.sunrise}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Sunset size={14} className="text-orange-300" />
              </div>
              <span className="text-xs font-semibold text-white">{sunTimes.sunset}</span>
            </div>
          </div>
        </div>

        {/* 생활 지수 (빨래) */}
        <DetailItem icon={Shirt} label="빨래지수" value={laundry.label} subValue={laundry.tip.split(".")[0]} />

        {/* 생활 지수 (세차) */}
        <DetailItem icon={Car} label="세차지수" value={carWash.label} subValue={carWash.tip} />
      </div>
    </div>
  );
}
