import { getRecommendedItems } from '../utils/itemUtils';
import type { WeatherItem } from '../api/weather';
import type { DustItem } from '../api/dust';

interface Props {
  weatherData: WeatherItem[] | null;
  dustData: DustItem | null;
  forecastData: WeatherItem[] | null; // [NEW]
}

export default function ItemCard({ weatherData, dustData, forecastData }: Props) {
  const items = getRecommendedItems(weatherData, dustData, forecastData);

  const requiredItems = items.filter(item => item.type === 'required');
  const optionalItems = items.filter(item => item.type === 'optional');

  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 ml-1 flex items-center gap-2">
        <span>🎒</span> 챙겨야 할 준비물
      </h3>

      {/* 필수 아이템 섹션 */}
      {requiredItems.length > 0 ? (
        <div className="mb-6 bg-red-50 p-4 rounded-2xl border border-red-100">
          <h4 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-1.5">
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-extrabold tracking-wide">MUST</span>
            꼭 챙기세요!
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {requiredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl flex flex-col items-start justify-center gap-1 bg-white border-2 border-red-200 shadow-sm transition-all hover:scale-[1.02]`}
              >
                <div className="flex justify-between w-full">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <span className="text-[10px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded h-fit">필수</span>
                </div>
                <span className="font-bold text-gray-800">{item.name}</span>
                <span className="text-xs text-red-600 font-medium leading-tight">
                  {item.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-sm text-lg">✅</div>
          <div>
            <h4 className="text-sm font-bold text-green-700">필수 준비물이 없어요</h4>
            <p className="text-xs text-green-600">날씨가 너무 좋아요! 편하게 외출하세요.</p>
          </div>
        </div>
      )}

      {/* 추천 아이템 섹션 (부드러운 스타일) */}
      {optionalItems.length > 0 && (
        <div className="px-1">
          <h4 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-1.5 px-2">
            <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-md font-bold">OPTION</span>
            있으면 좋아요
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {optionalItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl flex flex-col items-start justify-center gap-1 ${item.bgColor} transition-all hover:scale-[1.02]`}
              >
                <div className="text-2xl mb-1">{item.icon}</div>
                <span className="font-bold text-gray-800">{item.name}</span>
                <span className="text-xs opacity-80 font-medium leading-tight">
                  {item.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
