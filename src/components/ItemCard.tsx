import { getRecommendedItems } from "../utils/itemUtils";
import type { WeatherItem } from "../api/weather";
import type { DustItem } from "../api/dust";

interface Props {
  weatherData: WeatherItem[] | null;
  dustData: DustItem | null;
  forecastData: WeatherItem[] | null; // [NEW]
}

export default function ItemCard({ weatherData, dustData, forecastData }: Props) {
  const items = getRecommendedItems(weatherData, dustData, forecastData);

  const requiredItems = items.filter((item) => item.type === "required");
  const optionalItems = items.filter((item) => item.type === "optional");

  if (items.length === 0) return null;

  return (
    <div className="mt-2">
      {/* <h3 className="text-lg font-bold mb-4 ml-1 flex items-center gap-2">
        <span>🎒</span> 챙겨야 할 준비물
      </h3> */}

      {/* 필수 아이템 섹션 */}
      {requiredItems.length > 0 ? (
        <div className="mb-2 bg-red-50 p-4 rounded-[1rem]">
          <h4 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-1.5">
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-extrabold tracking-wide">MUST</span>꼭 챙기세요!
          </h4>
          <div className="grid grid-cols-2 gap-1">
            {requiredItems.map((item) => (
              <div key={item.id} className={`p-2 rounded-[.8rem] flex flex-col items-start justify-center gap-1 bg-white border-2 border-red-200 shadow-sm`}>
                <div className="flex gap-1 items-center w-full">
                  <div className="text-xl">{item.icon}</div>
                  <span className="text-sm font-bold text-gray-800">{item.name}</span>
                </div>
                <span className="text-xs text-red-600 font-medium leading-tight break-keep">{item.reason}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-2 p-4 rounded-[1rem] bg-green-50 border border-black/5 flex items-center gap-2 transition-colors duration-300">
          <div className="flex-1">
            <p className="text-[11px] font-bold text-green-600 tracking-tight flex items-center gap-1 leading-5">
              <i className="block rounded-full flex items-center justify-center not-italic text-[12px]">✅</i>필수 준비물이 없어요
            </p>
            <p className="text-sm font-semibold text-green-600 break-keep leading-5 ml-4">날씨가 너무 좋아요! 편하게 외출하세요.</p>
          </div>
        </div>
      )}

      {/* 추천 아이템 섹션 (부드러운 스타일) */}
      {optionalItems.length > 0 && (
        <div className="mb-2 bg-gray-300/70 p-4 rounded-[1rem]">
          <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-1.5">
            <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-md font-extrabold tracking-wide">OPTION</span>있으면 좋아요
          </h4>

          <div className="grid grid-cols-2 gap-1">
            {optionalItems.map((item) => (
              <div key={item.id} className={`p-2 rounded-[.8rem] flex flex-col items-start justify-center gap-1 ${item.bgColor}`}>
                <div className="flex gap-1 items-center w-full">
                  <div className="text-xl">{item.icon}</div>
                  <span className="text-sm font-bold text-gray-800">{item.name}</span>
                </div>
                <span className="text-xs opacity-90 font-medium leading-tight break-keep">{item.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
