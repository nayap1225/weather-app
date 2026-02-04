import type { DustItem } from "../api/dust";
import { getPm10GradeInfo, getPm25GradeInfo } from "../utils/dustUtils";

interface Props {
  dust: DustItem | null;
  loading: boolean;
}

export default function DustCard({ dust, loading }: Props) {
  console.log("[DustCard] Received Data:", dust);

  if (loading) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-gray-100 flex items-center justify-center h-20 animate-pulse">
        <span className="text-gray-400 text-sm">미세먼지 정보 로딩 중...</span>
      </div>
    );
  }

  if (!dust) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100 text-center text-sm text-gray-400">
        미세먼지 정보 없음
      </div>
    );
  }

  const pm10Info = getPm10GradeInfo(dust.pm10Value);
  const pm25Info = getPm25GradeInfo(dust.pm25Value);

  // 종합 행동 요령 (더 나쁜 등급 기준)
  const mainInfo = pm10Info.grade >= pm25Info.grade ? pm10Info : pm25Info;

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div
          className={`p-4 rounded-2xl ${pm10Info.bg} flex flex-col items-center justify-center border border-black/5 transition-colors duration-300`}
        >
          <span className="text-[10px] text-gray-500 mb-1 font-medium">
            미세먼지 (PM10)
          </span>
          <span className={`text-xl font-bold ${pm10Info.color}`}>
            {dust.pm10Value} <span className="text-xs font-normal">㎍/㎥</span>
          </span>
          <span className={`text-sm font-bold mt-1 ${pm10Info.color}`}>
            {pm10Info.label}
          </span>
        </div>

        <div
          className={`p-4 rounded-2xl ${pm25Info.bg} flex flex-col items-center justify-center border border-black/5 transition-colors duration-300`}
        >
          <span className="text-[10px] text-gray-500 mb-1 font-medium">
            초미세먼지 (PM2.5)
          </span>
          <span className={`text-xl font-bold ${pm25Info.color}`}>
            {dust.pm25Value} <span className="text-xs font-normal">㎍/㎥</span>
          </span>
          <span className={`text-sm font-bold mt-1 ${pm25Info.color}`}>
            {pm25Info.label}
          </span>
        </div>
      </div>

      {/* 행동 요령 가이드 */}
      <div
        className={`p-4 rounded-2xl ${mainInfo.bg} border border-black/5 flex items-center gap-3 transition-colors duration-300`}
      >
        <div
          className={`w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-xl`}
        >
          {mainInfo.grade === 1
            ? "🌿"
            : mainInfo.grade === 2
              ? "✅"
              : mainInfo.grade === 3
                ? "😷"
                : "🚨"}
        </div>
        <div className="flex-1">
          <p
            className={`text-[10px] font-bold ${mainInfo.color} opacity-70 uppercase tracking-tight`}
          >
            Action Guide
          </p>
          <p
            className={`text-sm font-bold ${mainInfo.color} break-keep leading-tight`}
          >
            {mainInfo.guide}
          </p>
        </div>
      </div>

      <div className="text-right px-1">
        <span className="text-[9px] text-gray-400 font-medium">
          {dust.stationName ? `${dust.stationName} 측정소` : "측정소 정보 없음"}{" "}
          | {dust.dataTime} 기준
        </span>
      </div>
    </div>
  );
}
