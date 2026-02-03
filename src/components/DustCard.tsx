import type { DustItem } from "../api/dust";

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

  const getGradeInfo = (grade: string) => {
    switch (grade) {
      case "1":
        return { label: "좋음", color: "text-blue-500", bg: "bg-blue-50" };
      case "2":
        return { label: "보통", color: "text-green-500", bg: "bg-green-50" };
      case "3":
        return { label: "나쁨", color: "text-orange-500", bg: "bg-orange-50" };
      case "4":
        return { label: "매우나쁨", color: "text-red-500", bg: "bg-red-50" };
      default:
        return { label: "정보없음", color: "text-gray-400", bg: "bg-gray-50" };
    }
  };

  const pm10Key = getGradeInfo(dust.pm10Grade);
  const pm25Key = getGradeInfo(dust.pm25Grade);

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <div
        className={`p-4 rounded-2xl ${pm10Key.bg} flex flex-col items-center justify-center`}
      >
        <span className="text-xs text-gray-500 mb-1">미세먼지 (PM10)</span>
        <span className={`text-lg font-bold ${pm10Key.color}`}>
          {dust.pm10Value} ㎍/㎥
        </span>
        <span className={`text-sm font-medium ${pm10Key.color}`}>
          {pm10Key.label}
        </span>
      </div>

      <div
        className={`p-4 rounded-2xl ${pm25Key.bg} flex flex-col items-center justify-center`}
      >
        <span className="text-xs text-gray-500 mb-1">초미세먼지 (PM2.5)</span>
        <span className={`text-lg font-bold ${pm25Key.color}`}>
          {dust.pm25Value} ㎍/㎥
        </span>
        <span className={`text-sm font-medium ${pm25Key.color}`}>
          {pm25Key.label}
        </span>
      </div>

      <div className="col-span-2 text-right mt-1 px-1">
        <span className="text-[10px]">
          {dust.stationName ? `${dust.stationName} 측정소` : "측정소 불명"} |{" "}
          {dust.dataTime} 기준
        </span>
      </div>
    </div>
  );
}
