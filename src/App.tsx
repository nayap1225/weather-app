import { useState } from "react";
import LocationPicker from "./components/LocationPicker";
import WeatherNowCard from "./components/WeatherNowCard";
import OutfitCard from "./components/OutfitCard";
import DustCard from "./components/DustCard";
import ItemCard from "./components/ItemCard";
import ForecastList from "./components/ForecastList";
import WeeklyForecast from "./components/WeeklyForecast";
import InstallPrompt from "./components/InstallPrompt";
import GoogleAd from "./components/GoogleAd";
import WeatherBackground from "./components/WeatherBackground";
import {
  getUltraSrtNcst,
  getVilageFcst,
  getMidLandFcst,
  getMidTa,
} from "./api/weather";
import {
  getDustInfo,
  getNearbyStationWithDust,
  getDustInfoBySgg,
} from "./api/dust";
import { findAllRegionsByNxNy, getRegionsInSgg } from "./utils/regionUtils";
import { getMidTermCode } from "./data/midTermCodes";
import { mergeForecastData } from "./utils/dailyForecastUtils";
import type { WeatherItem, MidLandItem, MidTaItem } from "./api/weather";
import type { DustItem } from "./api/dust";
import type { Region } from "./types/region";

function App() {
  // 초기값: 서울 종로구 (기본)
  const [nx, setNx] = useState<number>(60);
  const [ny, setNy] = useState<number>(127);
  // [Fix] 좌표 역추적 한계를 극복하기 위해 사용자가 선택한 지역 정보를 명시적으로 저장
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const [weatherData, setWeatherData] = useState<WeatherItem[] | null>(null);
  const [forecastData, setForecastData] = useState<WeatherItem[] | null>(null);
  const [midLandData, setMidLandData] = useState<MidLandItem | null>(null);
  const [midTaData, setMidTaData] = useState<MidTaItem | null>(null);
  const [dustData, setDustData] = useState<DustItem | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [dustLoading, setDustLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (
    targetNx?: number,
    targetNy?: number,
    explicitRegion?: Region,
  ) => {
    setLoading(true);
    setDustLoading(true);
    setError(null);

    const searchNx = targetNx ?? nx;
    const searchNy = targetNy ?? ny;

    if (targetNx !== undefined && targetNy !== undefined) {
      setNx(targetNx);
      setNy(targetNy);
    }

    // [Fix] 검색 시 전달받은 지역 정보가 있으면 state 업데이트 및 즉시 사용
    if (explicitRegion) {
      setSelectedRegion(explicitRegion);
    }

    try {
      // 1. 단기 예보
      const wData = await getUltraSrtNcst(searchNx, searchNy);
      setWeatherData(wData);

      let fData: WeatherItem[] | null = null;
      try {
        fData = await getVilageFcst(searchNx, searchNy);
        setForecastData(fData);
      } catch (e) {
        console.error("Forecast API failed", e);
      }

      // 2. 지역 정보 찾기
      // [Fix] 사용자가 직접 선택한 지역(selectedRegion)이 있고 좌표가 일치하면 그것을 우선 사용
      let targetRegion: Region | undefined;

      // 인자로 전달된 explicitRegion이 가장 최신이므로 최우선 사용
      if (explicitRegion) {
        targetRegion = explicitRegion;
      }
      // 그 다음 state에 저장된 selectedRegion 확인 (좌표 일치 시)
      else if (
        selectedRegion &&
        selectedRegion.nx === searchNx &&
        selectedRegion.ny === searchNy
      ) {
        targetRegion = selectedRegion;
      }
      // 둘 다 없으면 좌표 기반 역추적
      else {
        const regions = findAllRegionsByNxNy(searchNx, searchNy);
        targetRegion = regions.find((r) => r.s2 && r.s2.trim() !== "");
      }

      const cityRegion = findAllRegionsByNxNy(searchNx, searchNy).find(
        (r) => r.s1 && r.s1.trim() !== "",
      );

      console.log(`[App] Search Limit: nx=${searchNx}, ny=${searchNy}`);
      console.log("[App] Target Region (Dust Lookup):", targetRegion);

      // 3. 미세먼지 정보
      let dustInfo: DustItem | null = null;

      if (targetRegion) {
        console.log(
          `[App] Trying coordinate-based nearby station search for ${targetRegion.s3 || targetRegion.s2}`,
        );
        try {
          dustInfo = await getNearbyStationWithDust(
            targetRegion.s3 || "",
            targetRegion.s1 || "",
            targetRegion.s2 || "",
          );
        } catch (e) {
          console.error("[App] Nearby station dust tracking failed:", e);
        }
      }

      // 4. 좌표 기반 검색 실패 시, 이름 기반(구/동) 검색으로 폴백 (기존 로직)
      if (!dustInfo && targetRegion) {
        console.log(
          "[App] Nearest lookup failed, falling back to name-based lookup",
        );
        const stationCandidates: string[] = [];

        // 1. 읍면동명 (최우선순위)
        if (targetRegion.s3) stationCandidates.push(targetRegion.s3);

        // 2. 시/군/구 명칭 처리 (복합 지명 대응)
        if (targetRegion.s2) {
          stationCandidates.push(targetRegion.s2); // 전체 이름 (예: 안산시상록구)

          // "안산시상록구" -> ["안산시", "상록구"] 또는 "포항시북구" -> ["포항시", "북구"]
          const complexMatch = targetRegion.s2.match(
            /^([가-힣]+시)([가-힣]+[구군])$/,
          );
          if (complexMatch) {
            const city = complexMatch[1];
            const gu = complexMatch[2];
            stationCandidates.push(gu); // 상록구
            stationCandidates.push(city); // 안산시
            stationCandidates.push(gu.replace(/[구군]$/, "")); // 상록
            stationCandidates.push(city.replace(/시$/, "")); // 안산
          } else {
            // "진해구" -> "진해"
            const shortName = targetRegion.s2.replace(/(시|군|구)$/, "");
            if (shortName !== targetRegion.s2)
              stationCandidates.push(shortName);
          }
        }

        // 3. 시 단위 명칭 추가 (예: "안산시상록구" -> "안산시", "안산")
        if (targetRegion.s2) {
          const cityOnly = targetRegion.s2.replace(/([가-힣]+시).*/, "$1"); // "안산시"
          if (cityOnly && cityOnly !== targetRegion.s2) {
            stationCandidates.push(cityOnly);
            stationCandidates.push(cityOnly.replace(/시$/, "")); // "안산"
          }
        }

        // 특수 케이스 및 중복 제거
        if (targetRegion.s2?.includes("울릉")) stationCandidates.push("울릉읍");
        const finalCandidates = Array.from(
          new Set(stationCandidates.filter(Boolean)),
        );

        for (const name of finalCandidates) {
          if (!name) continue;
          try {
            const result = await getDustInfo(name);
            if (
              result &&
              result.pm10Value &&
              result.pm10Value !== "-" &&
              result.pm10Value !== ""
            ) {
              dustInfo = result;
              break;
            }
          } catch (e) {
            console.error(`Dust name fetch failed for ${name}:`, e);
          }
        }

        // [2단계] 여전히 데이터가 없다면 읍면동명 기준으로 근처 측정소 자동 추적
        if (!dustInfo) {
          console.log(
            "[App] No data by name, trying coordinate-based tracking via UMD name...",
          );
          try {
            const umdName = targetRegion.s3 || targetRegion.s2 || "";
            if (umdName) {
              const nearbyResult = await getNearbyStationWithDust(
                umdName,
                targetRegion.s1,
                targetRegion.s2,
              );
              if (nearbyResult) {
                dustInfo = nearbyResult; // [Fix] dData -> dustInfo
              }
            }
          } catch (e) {
            console.error("[App] UMD-based dust tracking failed:", e);
          }
        }

        // [3단계] 여전히 데이터가 없다면 해당 시군구(SGG) 전체 측정소 리스트에서 검색 (최종 폴백)
        if (!dustInfo) {
          // [Fix] dData -> dustInfo
          console.log(
            "[App] No data by UMD tracking, trying SGG-wide search...",
          );
          try {
            const neighbors = getRegionsInSgg(targetRegion.s1, targetRegion.s2);
            const neighborNames = Array.from(
              new Set(neighbors.map((r: Region) => r.s3).filter(Boolean)),
            );

            console.log(
              "[App] SGG Search Candidates:",
              targetRegion.s1,
              targetRegion.s2,
              neighborNames.length,
            );

            const sggResult = await getDustInfoBySgg(
              targetRegion.s1,
              targetRegion.s2,
              neighborNames,
            );
            if (sggResult) {
              dustInfo = sggResult;
            }
          } catch (e) {
            console.error("[App] SGG-wide dust tracking failed:", e);
          }
        }
      }

      // 5. 최종 데이터 설정
      if (dustInfo) {
        setDustData(dustInfo);
        console.log(
          `[App] Dust data set from station: ${dustInfo.stationName}`,
        );
      } else {
        console.warn("[App] All dust lookups failed.");
        setDustData(null);
      }

      // 4. 중기 예보
      if (cityRegion) {
        const codes = getMidTermCode(cityRegion.s1);
        try {
          const [landRes, taRes] = await Promise.all([
            getMidLandFcst(codes.landCode),
            getMidTa(codes.tempCode),
          ]);
          setMidLandData(landRes);
          setMidTaData(taRes);
        } catch (e) {
          console.error("MidTerm API failed", e);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
      setDustLoading(false);
    }
  };

  const handleLocationChange = (
    newNx: number,
    newNy: number,
    region?: Region,
  ) => {
    setNx(newNx);
    setNy(newNy);
    if (region) {
      setSelectedRegion(region);
    }
  };

  const [textColor, setTextColor] = useState<"light" | "dark">("light");

  // 10일 예보 데이터 통합
  const weeklyData = mergeForecastData(forecastData, midLandData, midTaData);

  const textClass = textColor === "light" ? "text-white" : "text-slate-900";

  return (
    <div
      className={`min-h-screen flex flex-col items-center p-4 transition-colors duration-500 ${textClass}`}
    >
      {/* Dynamic Background */}
      <WeatherBackground
        weatherData={weatherData || []}
        dustData={dustData}
        nx={nx}
        ny={ny}
        onThemeChange={setTextColor}
      />

      <div
        className={`flex flex-col flex-auto items-center w-full max-w-md mx-auto px-4 py-8 rounded-2xl backdrop-blur-sm transition-colors duration-500 bg-white/10 border border-black/5`}
        // className={`flex flex-col flex-auto items-center w-full max-w-md mx-auto px-4 py-8 rounded-2xl backdrop-blur-sm transition-colors duration-500 ${textColor === "light" ? "bg-black/10" : "bg-white/10 border border-black/5"}`}
      >
        <header className="mb-8 text-center text-white/90 drop-shadow-md">
          <h1 className="text-3xl font-extrabold tracking-tight">
            🌤️ 날씨 어때?
          </h1>
          <p className="text-gray-100 text-sm mt-2 font-medium opacity-80">
            오늘의 날씨와 옷차림을 확인하세요
          </p>
        </header>

        <main className="w-full max-w-md">
          <LocationPicker
            nx={nx}
            ny={ny}
            onLocationChange={handleLocationChange}
            onSearch={handleSearch}
            loading={loading}
          />

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100">
              <span>🚨</span>
              {error}
            </div>
          )}

          {weatherData && (
            <>
              <WeatherNowCard data={weatherData} dustData={dustData} />

              <DustCard dust={dustData} loading={dustLoading} />

              {(() => {
                const tempItem = weatherData.find(
                  (item) => item.category === "T1H",
                );
                const temp = tempItem ? Number(tempItem.obsrValue) : 0;
                return <OutfitCard temperature={temp} />;
              })()}

              <ItemCard
                weatherData={weatherData}
                dustData={dustData}
                forecastData={forecastData}
              />

              <ForecastList data={forecastData} />

              <WeeklyForecast dailyData={weeklyData} />
              <InstallPrompt />
              <GoogleAd />
            </>
          )}

          {/* 로딩 중일 때 표시할 UI */}
          {loading && !weatherData && (
            <div className="text-center text-gray-200 py-12">
              <span className="animate-spin inline-block text-2xl mb-2">↻</span>
              <p>위치 정보를 확인하고 있어요...</p>
            </div>
          )}

          {!weatherData && !loading && !error && (
            <div className="text-center text-gray-500 py-12 bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm">
              <p>
                위치를 확인하고
                <br />
                <span className="font-bold text-blue-500">날씨 조회</span>{" "}
                버튼을 눌러주세요 👆
              </p>
            </div>
          )}
        </main>

        <footer className="mt-auto py-8 text-gray-300 text-xs text-center">
          &copy; {new Date().getFullYear()} Weather App
        </footer>
      </div>
    </div>
  );
}

export default App;
