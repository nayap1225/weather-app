import type { DailyForecast } from "../utils/dailyForecastUtils";

interface Props {
  dailyData: DailyForecast[];
}

export default function WeeklyForecast({ dailyData }: Props) {
  if (!dailyData || dailyData.length === 0) return null;

  return (
    <div className="mt-8 w-full mb-10">
      <h3 className="text-lg font-bold mb-3 ml-1">📅 10일 예보</h3>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 flex flex-col divide-y divide-gray-100 max-h-[320px] overflow-y-auto">
        {dailyData.map((item, idx) => (
          <div
            key={item.date}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors shrink-0"
          >
            {/* 요일/날짜 */}
            <div className="w-16 flex flex-col items-center">
              <span
                className={`font-bold text-lg ${item.dayOfWeek === "일" ? "text-red-500" : item.dayOfWeek === "토" ? "text-blue-500" : "text-gray-700"}`}
              >
                {idx === 0 ? "오늘" : item.dayOfWeek}
              </span>
              <span className="text-xs text-gray-400">
                {item.date.slice(4, 6)}.{item.date.slice(6, 8)}
              </span>
            </div>

            {/* 아이콘 (오전/오후) */}
            <div className="flex-1 flex justify-center gap-6 items-center">
              <div className="flex flex-col items-center">
                <span className="text-2xl">{item.amIcon}</span>
                <span className="text-[10px] text-gray-400 mt-1">
                  오전 {item.amPop}%
                </span>
              </div>
              <div className="w-[1px] h-8 bg-gray-100"></div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">{item.pmIcon}</span>
                <span className="text-[10px] text-gray-400 mt-1">
                  오후 {item.pmPop}%
                </span>
              </div>
            </div>

            {/* 기온 (최저/최고) */}
            <div className="w-20 text-right">
              <span className="text-blue-500 font-medium">
                {Math.round(item.minTemp)}°
              </span>
              <span className="text-gray-300 mx-1">/</span>
              <span className="text-red-500 font-bold">
                {Math.round(item.maxTemp)}°
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
