import { usePWAInstall } from '../hooks/usePWAInstall';

export default function InstallPrompt() {
  const { isInstallable, installPWA } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-white border border-blue-100 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 animate-bounce-subtle z-50">
      <div className="flex items-center gap-3">
        <div className="text-3xl">📱</div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 text-sm">내 폰에 앱 설치하기</span>
          <span className="text-xs text-gray-500">홈 화면에서 바로 날씨를 확인하세요</span>
        </div>
      </div>
      <button
        onClick={installPWA}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform shrink-0"
      >
        설치
      </button>
    </div>
  );
}
