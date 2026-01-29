import type { WeatherItem } from '../api/weather';

interface Props {
  data: WeatherItem[];
}

export default function WeatherNowCard({ data }: Props) {
  // PTY: 강수형태 (0:없음, 1:비, 2:비/눈, 3:눈, 5:빗방울, 6:빗방울눈날림, 7:눈날림)
  // T1H: 기온
  // REH: 습도
  // RN1: 1시간 강수량
  // UUU: 동서바람성분, VVV: 남북바람성분, VEC: 풍향, WSD: 풍속

  const getValue = (category: string) =>
    data.find(item => item.category === category)?.obsrValue || '-';

  const temperature = getValue('T1H');
  const humidity = getValue('REH');
  const pty = getValue('PTY'); // 강수형태 code
  const windSpeed = getValue('WSD');

  // 강수 상태 텍스트 변환
  const getPtyText = (code: string) => {
    switch (code) {
      case '0': return '맑음/흐림';
      case '1': return '비';
      case '2': return '비/눈';
      case '3': return '눈';
      case '5': return '빗방울';
      case '6': return '빗방울/눈날림';
      case '7': return '눈날림';
      default: return '-';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl shadow-xl text-white w-full max-w-sm mx-auto mb-6 transform transition hover:scale-105">
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-blue-100 font-medium text-sm">현재 날씨</p>
          <h2 className="text-3xl font-bold mt-1">{getPtyText(pty)}</h2>
        </div>
        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
          <span className="text-2xl">🌡️</span>
        </div>
      </div>

      <div className="flex items-end gap-2 mb-6">
        <span className="text-6xl font-bold tracking-tighter">{temperature}°</span>
        <span className="text-xl text-blue-100 mb-2">체감 {temperature}°</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
          <p className="text-xs text-blue-200 mb-1">습도</p>
          <p className="text-lg font-semibold">{humidity}%</p>
        </div>
        <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
          <p className="text-xs text-blue-200 mb-1">풍속</p>
          <p className="text-lg font-semibold">{windSpeed} m/s</p>
        </div>
      </div>
    </div>
  );
}
