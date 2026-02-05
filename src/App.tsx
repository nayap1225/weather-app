import { useState, useCallback, useEffect } from "react";
import LocationPicker from "./components/LocationPicker";
import WeatherNowCard from "./components/WeatherNowCard";
import WeatherDetailCard from "./components/WeatherDetailCard";
import OutfitCard from "./components/OutfitCard";
import DustCard from "./components/DustCard";
import ItemCard from "./components/ItemCard";
import ForecastList from "./components/ForecastList";
import WeeklyForecast from "./components/WeeklyForecast";
import InstallPrompt from "./components/InstallPrompt";
import GoogleAd from "./components/GoogleAd";
import WeatherBackground from "./components/WeatherBackground";
import HeaderLayout from "./components/layout/Header";
import { dfs_xy_conv } from "./utils/coordinateConverter";
import { getAddressFromCoords } from "./api/kakao";
import { getUltraSrtNcst, getVilageFcst, getMidLandFcst, getMidTa, getYesterdayNcst, getUltraSrtFcst } from "./api/weather";
import { getDustInfo, getNearbyStationWithDust, getDustInfoBySgg } from "./api/dust";
import { findAllRegionsByNxNy, getRegionsInSgg, searchRegions } from "./utils/regionUtils";
import { getMidTermCode } from "./data/midTermCodes";
import { mergeForecastData } from "./utils/dailyForecastUtils";
import { calculateFeelsLike } from "./utils/weatherUtils"; // [New]
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
  const [yesterdayData, setYesterdayData] = useState<WeatherItem[] | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [dustLoading, setDustLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [isForecastMode, setIsForecastMode] = useState<boolean>(false);

  const handleSearch = useCallback(
    async (targetNx?: number, targetNy?: number, explicitRegion?: Region) => {
      // 위치 선택 시 모달이 열려있다면 닫기
      setShowModal(false);

      setLoading(true);
      setDustLoading(true);
      setError(null);
      setIsForecastMode(false);

      const searchNx = targetNx ?? nx;
      const searchNy = targetNy ?? ny;

      if (targetNx !== undefined && targetNy !== undefined) {
        setNx(targetNx);
        setNy(targetNy);
      }

      if (explicitRegion) {
        setSelectedRegion(explicitRegion);
        console.log(`[Weather App] Searching weather for: ${explicitRegion.name}`);
      }

      try {
        const [wData, fData, yData, ufData] = await Promise.all([
          getUltraSrtNcst(searchNx, searchNy).catch((e) => {
            console.error("Current API failed", e);
            return [] as WeatherItem[];
          }),
          getVilageFcst(searchNx, searchNy).catch((e) => {
            console.error("Forecast API failed", e);
            return null;
          }),
          getYesterdayNcst(searchNx, searchNy),
          // [New] 초단기예보 추가 조회
          getUltraSrtFcst(searchNx, searchNy).catch((e) => {
            console.error("Ultra Forecast API failed", e);
            return [];
          }),
        ]);

        // [Logic] 실황 데이터(wData)를 초단기예보(ufData)로 보정
        // 실황은 40분 지연되므로, 현재 시각의 예보 데이터가 있다면 그걸 우선시함.
        let isForecastUsed = false;

        if (ufData && ufData.length > 0) {
          const now = new Date();
          const curDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
          const curHour = String(now.getHours()).padStart(2, "0") + "00";

          // 실황 데이터의 기준 시간 확인
          const obsBaseTime = wData?.[0]?.baseTime;

          // 실황 데이터가 이미 최신(현재 시간)이라면, 예보로 덮어쓰지 않음 (실측값 우선)
          // 실황이 구버전(1시간 전)일 때만 초단기예보로 보정
          if (obsBaseTime !== curHour) {
            // 현재 시각에 해당하는 초단기예보 찾기
            const currentForecasts = ufData.filter((item) => item.fcstDate === curDate && item.fcstTime === curHour);

            if (currentForecasts.length > 0) {
              console.log(`[App] Correcting weather data with forecast for ${curHour}`);
              isForecastUsed = true;

              currentForecasts.forEach((fcst) => {
                // 보정할 카테고리: 기온(T1H), 하늘(SKY), 강수(PTY), 습도(REH)
                if (!["T1H", "SKY", "PTY", "REH", "RN1"].includes(fcst.category)) return;

                const targetIndex = wData.findIndex((w) => w.category === fcst.category);
                const newValue = fcst.fcstValue || "";

                if (targetIndex !== -1) {
                  // 기존 실황 데이터 업데이트
                  wData[targetIndex].obsrValue = newValue;
                } else {
                  // 실황에 없는 데이터라면 추가 (예: SKY는 실황에 없음)
                  wData.push({
                    baseDate: fcst.baseDate,
                    baseTime: fcst.baseTime,
                    category: fcst.category,
                    nx: fcst.nx,
                    ny: fcst.ny,
                    obsrValue: newValue,
                  });
                }
              });
            }
          }
        }

        setIsForecastMode(isForecastUsed);

        setWeatherData(wData);
        setForecastData(fData);
        setYesterdayData(yData);

        let targetRegion: Region | undefined;
        if (explicitRegion) {
          targetRegion = explicitRegion;
        } else if (selectedRegion && selectedRegion.nx === searchNx && selectedRegion.ny === searchNy) {
          targetRegion = selectedRegion;
        } else {
          const regions = findAllRegionsByNxNy(searchNx, searchNy);
          targetRegion = regions.find((r) => r.s2 && r.s2.trim() !== "");
        }

        const cityRegion = findAllRegionsByNxNy(searchNx, searchNy).find((r) => r.s1 && r.s1.trim() !== "");

        let dustInfo: DustItem | null = null;
        if (targetRegion) {
          try {
            dustInfo = await getNearbyStationWithDust(targetRegion.s3 || "", targetRegion.s1 || "", targetRegion.s2 || "");
          } catch (e) {
            console.error("[App] Nearby station dust tracking failed:", e);
          }
        }

        if (!dustInfo && targetRegion) {
          const stationCandidates: string[] = [];
          if (targetRegion.s3) stationCandidates.push(targetRegion.s3);
          if (targetRegion.s2) {
            stationCandidates.push(targetRegion.s2);
            const complexMatch = targetRegion.s2.match(/^([가-힣]+시)([가-힣]+[구군])$/);
            if (complexMatch) {
              stationCandidates.push(complexMatch[2]);
              stationCandidates.push(complexMatch[1]);
            } else {
              const shortName = targetRegion.s2.replace(/(시|군|구)$/, "");
              if (shortName !== targetRegion.s2) stationCandidates.push(shortName);
            }
          }
          if (targetRegion.s2) {
            const cityOnly = targetRegion.s2.replace(/([가-힣]+시).*/, "$1");
            if (cityOnly && cityOnly !== targetRegion.s2) {
              stationCandidates.push(cityOnly);
              stationCandidates.push(cityOnly.replace(/시$/, ""));
            }
          }
          if (targetRegion.s2?.includes("울릉")) stationCandidates.push("울릉읍");
          const finalCandidates = Array.from(new Set(stationCandidates.filter(Boolean)));

          for (const name of finalCandidates) {
            try {
              const result = await getDustInfo(name);
              if (result && result.pm10Value && result.pm10Value !== "-" && result.pm10Value !== "") {
                dustInfo = result;
                break;
              }
            } catch (e) {
              console.error(`Dust name fetch failed for ${name}:`, e);
            }
          }

          if (!dustInfo) {
            try {
              const umdName = targetRegion.s3 || targetRegion.s2 || "";
              if (umdName) {
                const nearbyResult = await getNearbyStationWithDust(umdName, targetRegion.s1, targetRegion.s2);
                if (nearbyResult) {
                  dustInfo = nearbyResult;
                }
              }
            } catch (e) {
              console.error("[App] UMD-based dust tracking failed:", e);
            }
          }

          if (!dustInfo) {
            try {
              const neighbors = getRegionsInSgg(targetRegion.s1, targetRegion.s2);
              const neighborNames = Array.from(new Set(neighbors.map((r: Region) => r.s3).filter(Boolean)));
              const sggResult = await getDustInfoBySgg(targetRegion.s1, targetRegion.s2, neighborNames);
              if (sggResult) {
                dustInfo = sggResult;
              }
            } catch (e) {
              console.error("[App] SGG-wide dust tracking failed:", e);
            }
          }
        }

        if (dustInfo) {
          setDustData(dustInfo);
        } else {
          setDustData(null);
        }

        if (cityRegion) {
          const codes = getMidTermCode(cityRegion.s1);
          try {
            const [landRes, taRes] = await Promise.all([getMidLandFcst(codes.landCode), getMidTa(codes.tempCode)]);
            setMidLandData(landRes);
            setMidTaData(taRes);
          } catch (e) {
            console.error("MidTerm API failed", e);
          }
        }

        // 검색 성공 시 처리
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : "정보를 불러오는데 실패했습니다.";
        setError(errorMessage);
      } finally {
        setLoading(false);
        setDustLoading(false);
      }
    },
    [nx, ny, selectedRegion],
  );

  const handleLocationChange = useCallback((newNx: number, newNy: number, region?: Region) => {
    setNx(newNx);
    setNy(newNy);
    if (region) {
      setSelectedRegion(region);
    }
  }, []);

  const detectCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("브라우저가 위치 정보를 지원하지 않습니다.");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const { nx: currentNx, ny: currentNy } = dfs_xy_conv(latitude, longitude);

        try {
          const kakaoAddr = await getAddressFromCoords(latitude, longitude);

          if (kakaoAddr) {
            const parts = kakaoAddr.split(" ");
            const dongName = parts[parts.length - 1];
            const searchResults = searchRegions(dongName, 10);

            const matched = searchResults.find((r: Region) => kakaoAddr.includes(r.s1.slice(0, 2)) && kakaoAddr.includes(r.s2)) || searchResults[0];

            if (matched) {
              handleLocationChange(matched.nx, matched.ny, matched);
              handleSearch(matched.nx, matched.ny, matched);
            } else {
              const virtualRegion: Region = {
                nx: currentNx,
                ny: currentNy,
                name: `${kakaoAddr} (현재위치)`,
                s1: parts[0] || "",
                s2: parts[1] || "",
                s3: parts[2] || "",
                code: "GPS_VIRTUAL",
              };
              handleLocationChange(currentNx, currentNy, virtualRegion);
              handleSearch(currentNx, currentNy, virtualRegion);
            }
          } else {
            const matchedRegions = findAllRegionsByNxNy(currentNx, currentNy);
            const bestMatch = matchedRegions.find((r) => r.s3 && r.s2) || matchedRegions[0];

            if (bestMatch) {
              const gpsRegion = {
                ...bestMatch,
                name: `${bestMatch.name} (현재위치)`,
              };
              handleLocationChange(currentNx, currentNy, gpsRegion);
              handleSearch(currentNx, currentNy, gpsRegion);
            } else {
              handleLocationChange(currentNx, currentNy);
              handleSearch(currentNx, currentNy);
            }
          }
        } catch (err) {
          console.error("[App] GPS Resolution Error:", err);
          handleSearch(currentNx, currentNy);
        }
        setGpsLoading(false);
      },
      (error) => {
        console.error("[GPS] Error:", error);
        alert(`위치 정보를 가져오지 못했습니다: ${error.message}`);
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }, [handleLocationChange, handleSearch]);

  useEffect(() => {
    // [개선] 앱 초기 진입 시 자동 위치 감지
    // 빈 배열을 사용하여 마운트 시 한 번만 실행되도록 보장 (무한 루프 방지)
    detectCurrentLocation();
  }, []); // 의존성에서 detectCurrentLocation 제거

  useEffect(() => {
    // [중요] 사용자가 이미 선택한 정보가 있고, 그 정보의 좌표가 현재 상태(nx, ny)와 일치한다면
    // 굳이 격자 기반 동네 목록으로 다시 덮어쓰지 않음 (검색 결과 유지)
    if (selectedRegion && selectedRegion.nx === nx && selectedRegion.ny === ny) {
      return;
    }

    // GPS 결과이거나 '(현재위치)' 표기가 있는 경우도 보호
    if (selectedRegion && (selectedRegion.code === "GPS_VIRTUAL" || selectedRegion.name.includes("(현재위치)"))) {
      return;
    }

    // 그 외에 좌표는 바뀌었는데 selectedRegion이 매칭되지 않을 때만 보정
    const regions = findAllRegionsByNxNy(nx, ny);
    if (regions.length > 0) {
      const target = regions.find((r) => r.s3 && r.s2) || regions[0];
      setSelectedRegion(target);
    }
  }, [nx, ny, selectedRegion]);

  const [textColor, setTextColor] = useState<"light" | "dark">("light");

  const weeklyData = mergeForecastData(forecastData, midLandData, midTaData);
  const textClass = textColor === "light" ? "text-white" : "text-slate-900";

  return (
    <div className={`min-h-screen flex flex-col items-center p-4 transition-colors duration-500 ${textClass}`}>
      <WeatherBackground weatherData={weatherData || []} dustData={dustData} nx={nx} ny={ny} onThemeChange={setTextColor} />

      <div className="flex flex-col flex-auto items-center w-full max-w-md mx-auto px-4 py-8 rounded-[1rem] backdrop-blur-[3px] transition-colors duration-500 bg-white/10 border border-white/5">
        <HeaderLayout />

        <main className="w-full max-w-md">
          {/* 인라인 검색창 제거 (이제 팝업으로 통합) */}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100 shadow-sm">
              <span>🚨</span>
              {error}
            </div>
          )}

          {weatherData && (
            <>
              <WeatherNowCard
                data={weatherData}
                dustData={dustData}
                yesterdayData={yesterdayData}
                forecastData={forecastData}
                locationName={selectedRegion?.name || "현재위치"}
                onOpenModal={() => setShowModal(true)}
                onCurrentLocation={detectCurrentLocation}
                gpsLoading={gpsLoading}
                isForecast={isForecastMode}
              />
              <ForecastList data={forecastData} />

              <DustCard dust={dustData} loading={dustLoading} />

              <WeatherDetailCard weatherData={weatherData} forecastData={forecastData} nx={nx} ny={ny} />

              {(() => {
                // 옷차림 추천을 위한 데이터 구성
                const getValue = (cat: string) => {
                  const item = weatherData.find((i) => i.category === cat);
                  if (!item) return 0;
                  return parseFloat(item.obsrValue || item.fcstValue || "0");
                };

                const currentTemp = getValue("T1H");
                const windSpeed = getValue("WSD");
                // 간단한 체감온도 계산 (윈드칠) - utils 재사용 권장되지만 여기선 약식 혹은 import
                // weatherUtils에서 import 해오는게 좋음.
                // 상단 import가 되어있는지 확인. 안되어있다면 추가해야함.
                // 우선 상단에 import 추가했다고 가정하고 작성.

                // 만약 import 못했다면 여기서 간단식 사용:
                // 체감 = 13.12 + 0.6215*T - 11.37*V^0.16 + 0.3965*T*V^0.16
                // 하지만 import 하는게 맞음.

                // 일단 여기서는 import 가정하고 변수만 준비

                // 강수형태 (코드값 문자열)
                const ptyItem = weatherData.find((i) => i.category === "PTY");
                const ptyCode = ptyItem ? ptyItem.obsrValue || ptyItem.fcstValue || "0" : "0";

                const conditions = {
                  currentTemp,
                  feelsLike: calculateFeelsLike(currentTemp, windSpeed),
                  ptyCode,
                  rainAmount: getValue("RN1"),
                  windSpeed,
                  pm10Grade: dustData?.pm10Grade || "2", // 기본 보통
                  currentHour: new Date().getHours(),
                  minTemp: weeklyData?.[0]?.minTemp,
                  maxTemp: weeklyData?.[0]?.maxTemp,
                };

                return <OutfitCard conditions={conditions} />;
              })()}

              {(() => {
                // 준비물 카드 데이터 구성
                const getValue = (cat: string) => {
                  const item = weatherData.find((i) => i.category === cat);
                  if (!item) return 0;
                  return parseFloat(item.obsrValue || item.fcstValue || "0");
                };

                const currentTemp = getValue("T1H");
                const windSpeed = getValue("WSD");
                const feelsLike = calculateFeelsLike(currentTemp, windSpeed);
                const ptyItem = weatherData.find((i) => i.category === "PTY");
                const ptyCode = ptyItem ? Number(ptyItem.obsrValue || ptyItem.fcstValue || "0") : 0;

                const minTemp = weeklyData?.[0]?.minTemp;
                const maxTemp = weeklyData?.[0]?.maxTemp;
                const diffTemp = minTemp !== undefined && maxTemp !== undefined ? maxTemp - minTemp : 0;
                const currentHour = new Date().getHours();

                // 강수확률(POP) 최대값 추출 (향후 6~12시간?)
                let maxPop = 0;
                if (forecastData) {
                  const pops = forecastData.filter((i) => i.category === "POP").map((i) => Number(i.fcstValue));
                  if (pops.length > 0) maxPop = Math.max(...pops);
                }

                const itemConditions = {
                  ptyCode,
                  rainAmount: getValue("RN1"),
                  temp: currentTemp,
                  feelsLike,
                  diffTemp,
                  windSpeed,
                  pm10Grade: Number(dustData?.pm10Grade || "1"),
                  uvIndex: 0, // API 부재로 0 처리
                  pop: maxPop,
                  isNight: currentHour >= 20 || currentHour <= 6,
                };

                return <ItemCard conditions={itemConditions} />;
              })()}

              <WeeklyForecast dailyData={weeklyData} />
              <InstallPrompt />
              <GoogleAd />
            </>
          )}

          {/* [통합 로딩 UI] 위치 탐색 또는 날씨 데이터 조회 중 */}
          {!weatherData && (loading || gpsLoading) && (
            <div className="w-full flex flex-col items-center justify-center py-5 animate-in fade-in duration-700">
              <div className="bg-white/40 backdrop-blur-[3px] rounded-[1rem] py-12 px-4 text-center shadow-2xl relative overflow-hidden group w-full mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50"></div>
                <div className="relative z-10">
                  <div className="w-28 h-28 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[1rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/30 animate-bounce">
                    <i className="block w-22 h-22 bg-[url(/src/assets/gurumi.svg)] bg-no-repeat bg-center bg-cover"></i>
                  </div>
                  <h2 className="font-semibold text-[18px] text-gray-800 mb-3 tracking-tighter">{gpsLoading ? "위치 정보를 받아오고 있어요" : "기상 정보를 가져오고 있어요"}</h2>
                  <p className="text-gray-500 text-[14px] font-bold leading-relaxed px-4">
                    {gpsLoading ? (
                      <>
                        현재 사용자님의 위치와 가장 가까운 <br />
                        날씨 관측소를 매칭하고 있습니다.
                      </>
                    ) : (
                      <>
                        잠시만 기다려주세요, <br />
                        최신 날씨 데이터를 불러오는 중입니다.
                      </>
                    )}
                  </p>
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-blue-700 rounded-full animate-ping"></span>
                    <span className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em]">{gpsLoading ? "Locating..." : "Loading..."}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!weatherData && !loading && !error && null}
        </main>

        <footer className="mt-4 opacity-40 text-[10px] text-center uppercase tracking-widest font-bold">&copy; {new Date().getFullYear()} Weatherleaf</footer>
      </div>

      {/* 위치 검색 팝업 (모달) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-200">
            <LocationPicker
              nx={nx}
              ny={ny}
              selectedRegion={selectedRegion}
              onLocationChange={handleLocationChange}
              onSearch={handleSearch}
              loading={loading}
              onClose={() => setShowModal(false)}
              // autoDetect={false}
              onCurrentLocation={detectCurrentLocation}
              gpsLoading={gpsLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
