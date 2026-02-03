import { getOutfitByTemperature } from "../utils/outfitUtils";

interface Props {
  temperature: number;
}

export default function OutfitCard({ temperature }: Props) {
  const outfit = getOutfitByTemperature(temperature);

  return (
    <div
      className={`mt-6 p-6 rounded-2xl shadow-sm border ${outfit.color} transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl bg-white p-3 rounded-full shadow-sm">
          {outfit.emoji}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            오늘의 옷차림
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 font-normal">
              현재 {temperature}°C
            </span>
          </h3>
          <p className="text-sm font-medium opacity-90 mb-3">
            {outfit.summary}
          </p>

          <div className="flex flex-wrap gap-2">
            {outfit.items.map((item, idx) => (
              <span
                key={idx}
                className="bg-white/70 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-1.5"
              >
                <span className="text-base">{item.icon}</span>
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
