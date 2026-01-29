import { useState, useEffect } from 'react';
import LocationPicker from './components/LocationPicker';
import WeatherNowCard from './components/WeatherNowCard';
import OutfitCard from './components/OutfitCard';
import DustCard from './components/DustCard';
import ItemCard from './components/ItemCard';
import ForecastList from './components/ForecastList';
import WeeklyForecast from './components/WeeklyForecast';
import InstallPrompt from './components/InstallPrompt';
import { getUltraSrtNcst, getVilageFcst, getMidLandFcst, getMidTa } from './api/weather';
import { getDustInfo, getNearbyStationWithDust } from './api/dust';
import { findAllRegionsByNxNy } from './utils/regionUtils';
import { getMidTermCode } from './data/midTermCodes';
import { mergeForecastData } from './utils/dailyForecastUtils';
import { dfs_xy_conv } from './utils/coordinateConverter';
import type { WeatherItem, MidLandItem, MidTaItem } from './api/weather';
import type { DustItem } from './api/dust';

function App() {
  // 초기값: 서울 종로구 (기본)
  const [nx, setNx] = useState<number>(60);
  const [ny, setNy] = useState<number>(127);

  // ... (나머지 state들은 그대로 유지)
  const [weatherData, setWeatherData] = useState<WeatherItem[] | null>(null);
  const [forecastData, setForecastData] = useState<WeatherItem[] | null>(null);
  const [midLandData, setMidLandData] = useState<MidLandItem | null>(null);
  const [midTaData, setMidTaData] = useState<MidTaItem | null>(null);
  const [dustData, setDustData] = useState<DustItem | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [dustLoading, setDustLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // [변경] 초기 로딩 시 GPS 시도
  useEffect(() => {
    // 브라우저 위치 정보 요청
    if (navigator.geolocation) {
      setLoading(true); // 로딩 표시
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 허용 시: 현재 위치로 설정
          const { latitude, longitude } = position.coords;
          const { nx, ny } = dfs_xy_conv(latitude, longitude);

          console.log(`[GPS Init] Found location: ${latitude}, ${longitude} -> ${nx}, ${ny}`);
          setNx(nx);
          setNy(ny);
          handleSearch(nx, ny); // 찾은 위치로 바로 검색
        },
        (err) => {
          // 거부/에러 시: 기본값(종로구)으로 검색
          console.warn(`[GPS Init] Failed or denied: ${err.message}`);
          handleSearch(60, 127);
        },
        { timeout: 10000 } // [개선] GPS 응답 대기 시간을 10초로 늘려 안정성 확보
      );
    } else {
      // GPS 미지원 브라우저: 기본값 검색
      handleSearch(60, 127);
    }
  }, []); // 빈 배열: 최초 1회만 실행

  // localStorage 저장/로드 로직 중 '로드'는 삭제하고 '저장'은 선택사항 (여기서는 삭제하거나 유지해도 됨)
  // 사용자가 원한건 "리로드 했을 때 내 위치"이므로 저장된 값은 무시하는게 맞음.

  // ... handleSearch 및 기타 로직
  // (아래 전체 교체에서 상세 구현)

  const handleSearch = async (targetNx?: number, targetNy?: number) => {
    setLoading(true);
    setDustLoading(true);
    setError(null);

    const searchNx = targetNx ?? nx;
    const searchNy = targetNy ?? ny;

    if (targetNx !== undefined && targetNy !== undefined) {
      setNx(targetNx);
      setNy(targetNy);
    }

    try {
      // 1. 단기 예보
      const wData = await getUltraSrtNcst(searchNx, searchNy);
      setWeatherData(wData);

      let fData: WeatherItem[] | null = null;
      try {
        fData = await getVilageFcst(searchNx, searchNy);
        setForecastData(fData);
      } catch (e) { console.error("Forecast API failed", e); }

      // 2. 지역 정보 찾기
      const regions = findAllRegionsByNxNy(searchNx, searchNy);
      const targetRegion = regions.find(r => r.s2 && r.s2.trim() !== '');
      const cityRegion = regions.find(r => r.s1 && r.s1.trim() !== '');

      // 3. 미세먼지
      let dData: DustItem | null = null;
      if (targetRegion) {
        // [1단계] 이름 기반 후보군 시도 (행정구역 명칭 유연화)
        const stationCandidates: string[] = [];
        if (targetRegion.s3) stationCandidates.push(targetRegion.s3); // 예: 동이면
        if (targetRegion.s2) {
          stationCandidates.push(targetRegion.s2); // 예: 옥천군
          // [개선] '군'이나 '시'를 뗀 명칭도 후보에 추가 (에어코리아 측정소는 '옥천'처럼 지명만 쓰는 경우가 많음)
          const shortName = targetRegion.s2.replace(/(군|시)$/, '');
          if (shortName !== targetRegion.s2) stationCandidates.push(shortName); // 예: 옥천
        }

        if (targetRegion.s2 === '울릉군') {
          stationCandidates.push('울릉읍');
        }

        // 우선순위: 구(Gu) 단위면 s2 우선, 나머지는 s3 우선
        const preferS2 = targetRegion.s2?.endsWith('구');
        const finalCandidates = preferS2
          ? [...stationCandidates].reverse()
          : stationCandidates;

        for (const name of finalCandidates) {
          if (!name) continue;
          try {
            const result = await getDustInfo(name);
            if (result && result.pm10Value && result.pm10Value !== '-') {
              dData = result;
              break;
            }
          } catch (e) {
            console.error(`Dust name fetch failed for ${name}:`, e);
          }
        }

        // [2단계] 여전히 데이터가 없다면 읍면동명 기준으로 근처 측정소 자동 추적
        // [개선] 옥천군 동이면처럼 측정소가 없는 곳은 '동이면'의 TM 좌표를 구해 근처 측정소를 실시간 추적
        // 기존에는 TM 좌표를 위경도로 변환하여 근처 측정소를 찾았으나, 에어코리아 API는 행정구역명으로도 근처 측정소 추적이 가능함.
        // 따라서, 불필요한 좌표 변환 없이 행정구역명(읍면동명)을 직접 사용하여 더 정확하고 효율적으로 측정소를 찾도록 변경.
        if (!dData) {
          console.log("[App] No data by name, trying coordinate-based tracking via UMD name...");
          try {
            const umdName = targetRegion.s3 || targetRegion.s2 || "";
            if (umdName) {
              const nearbyResult = await getNearbyStationWithDust(umdName);
              if (nearbyResult) {
                dData = nearbyResult;
              }
            }
          } catch (e) {
            console.error("[App] UMD-based dust tracking failed:", e);
          }
        }

        setDustData(dData);
      } else {
        setDustData(null);
      }

      // 4. 중기 예보
      if (cityRegion) {
        const codes = getMidTermCode(cityRegion.s1);
        try {
          const [landRes, taRes] = await Promise.all([
            getMidLandFcst(codes.landCode),
            getMidTa(codes.tempCode)
          ]);
          setMidLandData(landRes);
          setMidTaData(taRes);
        } catch (e) { console.error("MidTerm API failed", e); }
      }

      // [선택] localStorage 저장은 유지하되, 초기 로딩 때 불러오지 않으므로 '히스토리' 용도로만 남음 (삭제해도 무방)
      // 여기서는 굳이 저장하지 않아도 됨.

    } catch (err: any) {
      console.error(err);
      setError(err.message || '정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setDustLoading(false);
    }
  };

  const handleLocationChange = (newNx: number, newNy: number) => {
    setNx(newNx);
    setNy(newNy);
  };

  // 10일 예보 데이터 통합
  const weeklyData = mergeForecastData(forecastData, midLandData, midTaData);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          🌤️ 날씨 어때?
        </h1>
        <p className="text-gray-500 text-sm mt-2">오늘의 날씨와 옷차림을 확인하세요</p>
      </header>

      <main className="w-full max-w-sm">
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
            <WeatherNowCard data={weatherData} />

            <DustCard dust={dustData} loading={dustLoading} />

            {(() => {
              const tempItem = weatherData.find(item => item.category === 'T1H');
              const temp = tempItem ? Number(tempItem.obsrValue) : 0;
              return <OutfitCard temperature={temp} />;
            })()}

            <ItemCard weatherData={weatherData} dustData={dustData} forecastData={forecastData} />

            <ForecastList data={forecastData} />

            <WeeklyForecast dailyData={weeklyData} />
            <InstallPrompt />
          </>
        )}

        {/* 로딩 중일 때 표시할 UI */}
        {loading && !weatherData && (
          <div className="text-center text-gray-400 py-12">
            <span className="animate-spin inline-block text-2xl mb-2">↻</span>
            <p>위치 정보를 확인하고 있어요...</p>
          </div>
        )}

        {!weatherData && !loading && !error && (
          <div className="text-center text-gray-400 py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p>위치를 확인하고<br /><span className="font-bold text-blue-500">날씨 조회</span> 버튼을 눌러주세요 👆</p>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 text-gray-400 text-xs text-center">
        &copy; {new Date().getFullYear()} Weather App
      </footer>
    </div>
  );
}

export default App;
