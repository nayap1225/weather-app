import { groupForecastItems, getWeatherIcon } from "../utils/weatherUtils";
import type { WeatherItem } from "../api/weather";

interface Props {
  data: WeatherItem[] | null;
}

export default function ForecastList({ data }: Props) {
  if (!data || data.length === 0) {
    return null; // 데이터 없으면 렌더링 안 함

    // 개발 중 빈 화면 보려면 아래 주석 해제
    /*
    return (
      <div className="mt-6 w-full p-4 bg-white rounded-2xl shadow-sm text-center text-gray-400">
        예보 데이터 준비 중...
      </div>
    );
    */
  }

  const grouped = groupForecastItems(data);

  // 현재 시간 이후 24시간 정도만 보여주기 (최대 8~10개)
  // 이미 API에서 필터링되지 않았다면 여기서 slice
  const displayList = grouped.slice(0, 12);

  return (
    <div className="mt-8 w-full">
      <h3 className="text-lg font-bold mb-3 ml-1">🕒 시간별 예보</h3>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x pr-4 scrollbar-hide">
        {displayList.map((item, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 snap-start bg-white p-4 rounded-2xl shadow-sm min-w-[5rem] flex flex-col items-center border border-gray-50"
          >
            <span className="text-xs text-gray-500 font-medium">
              {item.time.slice(0, 2)}시
            </span>
            <span className="text-3xl my-2">
              {getWeatherIcon(item.sky, item.pty, item.time)}
            </span>
            <span className="text-lg font-bold text-gray-800">
              {item.temp}°
            </span>
            <span className="text-[10px] text-blue-500 mt-1 font-medium">
              {Number(item.pop) > 0 ? `${item.pop}%` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
