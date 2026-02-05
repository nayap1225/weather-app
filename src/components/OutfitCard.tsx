import { getOutfitByTemperature } from "../utils/outfitUtils";

interface Props {
  temperature: number;
}

export default function OutfitCard({ temperature }: Props) {
  const outfit = getOutfitByTemperature(temperature);

  return (
    <div className={`mt-2 p-4 rounded-[1rem] shadow-sm border ${outfit.color}`}>
      <div className="flex items-start gap-2">
        <div className="w-9 h-9 flex items-center justify-center text-[20px] bg-white p-1 rounded-full shadow-sm flex-none">{outfit.emoji}</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            오늘의 뭐입지?
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 font-normal">{temperature}°C</span>
          </h3>
          <p className="text-sm font-medium opacity-90 mb-3">{outfit.summary}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {outfit.items.map((item, idx) => (
          <span key={idx} className="bg-white/70 px-2 py-1.5 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-1">
            <span className="text-base">{item.icon}</span>
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}
