import type { OutfitConditions } from "../utils/outfitUtils";
import { getOutfitRecommendation } from "../utils/outfitUtils";

interface Props {
  conditions: OutfitConditions | null;
}

export default function OutfitCard({ conditions }: Props) {
  if (!conditions) return null;

  const outfit = getOutfitRecommendation(conditions);
  const { currentTemp } = conditions;

  return (
    <div className={`mt-2 p-4 rounded-[1rem] shadow-sm border ${outfit.color} transition-colors duration-300`}>
      <div className="flex items-start gap-2">
        <div className="w-9 h-9 flex items-center justify-center text-[20px] bg-white/80 p-1 rounded-full shadow-sm flex-none backdrop-blur-sm">{outfit.emoji}</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            오늘의 추천
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 font-normal shadow-sm">{Math.round(currentTemp)}°C</span>
          </h3>
          <p className="text-sm font-medium opacity-90 mb-3 break-keep leading-snug">{outfit.summary}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {outfit.items.map((item, idx) => (
          <span key={idx} className="bg-white/60 px-2.5 py-1.5 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-1.5 backdrop-blur-sm">
            <span className="text-base">{item.icon}</span>
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}
