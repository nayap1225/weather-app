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

  // [Fix] 현재 시간 이전의 과거 데이터 필터링
  const now = new Date();
  const currentDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const currentHour = String(now.getHours()).padStart(2, "0") + "00";

  const filtered = grouped.filter((item) => {
    if (item.date > currentDate) return true; // 미래 날짜
    if (item.date < currentDate) return false; // 과거 날짜
    return item.time > currentHour; // [Mod] 현재 시간 포함(>=) -> 미포함(>)으로 변경 (사용자 요청: 이후 시간부터 표시)
  });

  // 현재 시간 이후 24시간 정도만 보여주기 (최대 12개)
  const displayList = filtered.slice(0, 12);

  return (
    <div className="mt-2 w-full">
      {/* <h3 className="text-lg font-bold mb-3 ml-1">🕒 시간별 예보</h3> */}
      <div className="flex gap-1.5 overflow-x-auto pb-4 snap-x scrollbar-hide">
        {displayList.map((item, idx) => (
          <div key={idx} className="bg-black/60 p-3 rounded-[.8rem] backdrop-blur-md flex-shrink-0 snap-start p-2.5 rounded-[.8rem] shadow-sm min-w-[6rem] flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs text-white font-medium">{item.time.slice(0, 2)}시</span>
              <span className="text-xl leading-none">{getWeatherIcon(item.sky, item.pty, item.time)}</span>
            </div>

            <div className="flex items-center justify-center gap-1">
              <span className="text-md font-bold text-white leading-none">{item.temp}°</span>
              {Number(item.pop) > 0 && <span className="text-md text-white leading-none">/</span>}
              {Number(item.pop) > 0 && <span className="text-[10px] text-blue-200 mt-1 font-medium">{`${item.pop}%`}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
