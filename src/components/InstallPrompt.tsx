import { usePWAInstall } from '../hooks/usePWAInstall';

export default function InstallPrompt() {
  const { isInstallable, isStandalone, installPWA } = usePWAInstall();

  // 현재 앱으로 실행 중이거나 설치가 불가능한 상태면 숨김
  if (isStandalone || !isInstallable) return null;

  return (
    <div className="mt-8 mb-4 p-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl animate-fade-in text-white">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-white/20 p-2 rounded-xl text-2xl shadow-inner">📱</div>
        <div>
          <h4 className="font-bold">앱으로 설치해서 사용하세요</h4>
          <p className="text-xs opacity-90 leading-relaxed">
            홈 화면에 고정하면 매번 주소를 입력하지 않고 <br />
            실시간 날씨를 더 빠르고 편하게 볼 수 있어요!
          </p>
        </div>
      </div>

      <button
        onClick={installPWA}
        className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] hover:bg-blue-50"
      >
        앱 설치하기
      </button>
    </div>
  );
}
