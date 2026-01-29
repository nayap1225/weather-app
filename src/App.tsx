import { useState, useEffect } from 'react';
import LocationPicker from './components/LocationPicker';
import WeatherNowCard from './components/WeatherNowCard';
import ForecastList from './components/ForecastList';
import { getUltraSrtNcst } from './api/weather';
import type { WeatherItem } from './api/weather';

function App() {
  // 기본값: 서울 종로구 (60, 127)
  const [nx, setNx] = useState<number>(60);
  const [ny, setNy] = useState<number>(127);

  const [weatherData, setWeatherData] = useState<WeatherItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 앱 시작 시 로컬스토리지 복원
  useEffect(() => {
    const saved = localStorage.getItem('last_weather_data');
    if (saved) {
      try {
        const { nx, ny, data } = JSON.parse(saved);
        setNx(nx);
        setNy(ny);
        setWeatherData(data);
      } catch (e) {
        console.error('Failed to load saved weather data', e);
      }
    }
  }, []);

  const handleSearch = async (targetNx?: number, targetNy?: number) => {
    setLoading(true);
    setError(null);

    // 인자로 받은 좌표가 있으면 그것을 사용, 없으면 현재 state 사용
    const searchNx = targetNx ?? nx;
    const searchNy = targetNy ?? ny;

    // 만약 인자로 좌표가 들어왔다면 state도 업데이트 (UI 동기화)
    if (targetNx !== undefined && targetNy !== undefined) {
      setNx(targetNx);
      setNy(targetNy);
    }

    try {
      const data = await getUltraSrtNcst(searchNx, searchNy);
      setWeatherData(data);

      // 성공 데이터 저장
      localStorage.setItem('last_weather_data', JSON.stringify({
        nx: searchNx, ny: searchNy, data, timestamp: new Date().toISOString()
      }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || '날씨 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (newNx: number, newNy: number) => {
    setNx(newNx);
    setNy(newNy);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 sm:p-12">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">My Weather App</h1>
        <p className="text-gray-500 text-sm mt-1">MVP Version</p>
      </header>

      <main className="w-full max-w-lg">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 text-sm break-keep">
            ⚠️ {error}
          </div>
        )}

        <LocationPicker
          nx={nx}
          ny={ny}
          onLocationChange={handleLocationChange}
          onSearch={handleSearch}
          loading={loading}
        />

        {weatherData && (
          <>
            <WeatherNowCard data={weatherData} />
            <ForecastList />
          </>
        )}

        {!weatherData && !loading && !error && (
          <div className="text-center text-gray-400 py-12">
            위치를 확인하고 조회 버튼을 눌러주세요.
          </div>
        )}
      </main>

      <footer className="mt-auto py-6 text-gray-400 text-xs text-center">
        &copy; {new Date().getFullYear()} Weather App. Powered by KMA API.
      </footer>
    </div>
  );
}

export default App;
