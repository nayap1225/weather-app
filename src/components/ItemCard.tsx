import type { ItemConditions } from "../utils/itemUtils";
import { getRecommendedItems } from "../utils/itemUtils";

interface Props {
  conditions: ItemConditions | null;
}

export default function ItemCard({ conditions }: Props) {
  if (!conditions) return null;

  const items = getRecommendedItems(conditions);
  const requiredItems = items.filter((item) => item.type === "required");
  const optionalItems = items.filter((item) => item.type === "optional");

  if (items.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* 🚨 필수 준비물 */}
      {requiredItems.length > 0 && (
        <div className="bg-red-50 p-4 rounded-[1rem] border border-red-100 shadow-sm">
          <h4 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold tracking-wide shadow-sm animate-pulse">MUST</span>꼭 챙기세요!
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {requiredItems.map((item) => (
              <div key={item.id} className="p-3 rounded-[.8rem] flex flex-col items-start justify-center gap-1 bg-white border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-2 items-center w-full">
                  <span className="text-2xl filter drop-shadow-sm">{item.icon}</span>
                  <span className="text-sm font-bold text-gray-800 tracking-tight">{item.name}</span>
                </div>
                <span className="text-xs text-red-500 font-semibold leading-tight break-keep mt-1">{item.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 💡 옵셔널 준비물 */}
      {optionalItems.length > 0 && (
        <div className="bg-slate-50 p-4 rounded-[1rem] border border-slate-200/60 shadow-sm">
          <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
            <span className="bg-slate-400 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold tracking-wide">OPTION</span>
            있으면 좋아요
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {optionalItems.map((item) => (
              <div key={item.id} className="p-2.5 rounded-[.8rem] flex flex-col items-start justify-center gap-1 bg-white border border-slate-100 shadow-sm">
                <div className="flex gap-1.5 items-center w-full">
                  <span className="text-xl opacity-90">{item.icon}</span>
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium leading-tight break-keep">{item.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
