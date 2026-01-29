import { usePWAInstall } from '../hooks/usePWAInstall';

export default function InstallPrompt() {
  const { isInstallable, isStandalone, isIOS, installPWA } = usePWAInstall();

  // [PWA 고도화] 
  // 1. 이미 앱으로 실행 중이면 UI 숨김 (isStandalone)
  // 2. iOS/Safari: 자동 설치 API 미지원으로 인해 "공유 -> 홈 화면에 추가" 수동 가이드 노출
  // 3. 기타(안드로이드/크롬): 브라우저 기본 설치 팝업 트리거 버튼 제공

  if (isStandalone) return null;

  // iOS/Safari 환경인 경우 (자동 설치 API 미지원으로 수동 가이드 노출)
  if (isIOS) {
    return (
      <div className="mt-8 mb-4 p-5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl animate-fade-in text-white">
        <div className="flex items-center gap-4 mb-3">
          <div className="bg-white/20 p-2 rounded-xl text-2xl shadow-inner">🍎</div>
          <div>
            <h4 className="font-bold text-base">iPhone 설치 방법</h4>
            <p className="text-xs opacity-90 leading-relaxed">
              사파리 브라우저에서 아래 과정을 따라주세요!
            </p>
          </div>
        </div>

        <div className="bg-black/10 border border-white/10 rounded-xl p-3 text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
            <span>하단 <b>공유 버튼</b>( <span className="text-lg">⎋</span> )을 클릭</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
            <span>스크롤을 내려 <b>'홈 화면에 추가'</b> 클릭</span>
          </div>
        </div>
      </div>
    );
  }

  // 안드로이드/크롬 등 자동 설치 가능한 경우
  if (!isInstallable) return null;

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
