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

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-3 ml-1 flex items-center gap-2">
        <span>🎒</span> 챙겨야 할 준비물
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl flex flex-col items-start justify-center gap-1 ${item.bgColor} transition-all hover:scale-[1.02]`}
          >
            <div className="text-2xl mb-1">{item.icon}</div>
            <span className="font-bold">{item.name}</span>
            <span className="text-xs opacity-80 font-medium leading-tight">
              {item.reason}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
