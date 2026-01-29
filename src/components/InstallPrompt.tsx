import { usePWAInstall } from '../hooks/usePWAInstall';

export default function InstallPrompt() {
  const { isInstallable, installPWA } = usePWAInstall();

  export default function InstallPrompt() {
    const { isInstallable, isStandalone, installPWA } = usePWAInstall();

    // 이미 앱으로 실행 중(Standalone)이면 아무것도 보여주지 않음
    if (isStandalone) return null;

    return (
      <div className="mt-8 mb-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <div className="bg-white p-2 rounded-xl shadow-sm text-2xl">📱</div>
          <div>
            <h4 className="font-bold text-gray-800">앱으로 설치해서 사용하세요</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              바탕화면에 아이콘을 추가하면 <br />
              매번 주소를 입력하지 않고 바로 확인할 수 있어요.
            </p>
          </div>
        </div>

        <button
          onClick={installPWA}
          className={`w-full py-3 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] ${isInstallable
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-white text-blue-600 border border-blue-200'
            }`}
        >
          {isInstallable ? '앱 설치하기' : '설치 방법 확인'}
        </button>

        {!isInstallable && (
          <p className="text-[10px] text-center text-gray-400 mt-2">
            * 브라우저 메뉴에서 "홈 화면에 추가"를 눌러도 설치됩니다.
          </p>
        )}
      </div>
    );
  }
