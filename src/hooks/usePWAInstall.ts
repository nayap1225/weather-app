import { useState, useEffect } from 'react';

// 브라우저가 이벤트를 아주 일찍 보낼 경우를 대비해 전역 변수로 관리
let capturedPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    // 브라우저 기본 설치 팝업 방지
    e.preventDefault();
    // 이벤트를 전역에 저장
    capturedPrompt = e;
    // 이미 훅이 마운트된 상태라면 알림을 보냄
    window.dispatchEvent(new CustomEvent('pwa-prompt-captured'));
    console.log('[Global] PWA install prompt captured early');
  });
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(capturedPrompt);
  const [isInstallable, setIsInstallable] = useState(!!capturedPrompt);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 현재 독립 실행형(앱) 모드인지 확인
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone
        || document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      capturedPrompt = e;
      console.log('[Hook] PWA install prompt captured via listener');
    };

    const onCaptured = () => {
      setDeferredPrompt(capturedPrompt);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('pwa-prompt-captured', onCaptured);

    // 이미 설치된 경우 처리
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
      capturedPrompt = null;
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('pwa-prompt-captured', onCaptured);
    };
  }, []);

  const installPWA = async () => {
    const promptToUse = deferredPrompt || capturedPrompt;

    if (!promptToUse) {
      alert('설치 준비 중입니다. 잠시만 기다려 주세요. \n\n보통 앱 삭제 직후에는 브라우저 정책상 잠시 차단될 수 있습니다. \n잠시 후 다시 시도하시거나, 브라우저 메뉴의 "홈 화면에 추가"를 이용해 주세요.');
      return;
    }

    // 저장해둔 팝업 띄우기
    promptToUse.prompt();

    // 사용자의 선택 결과 대기
    const { outcome } = await promptToUse.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // 결과와 상관없이 prompt는 한 번만 사용 가능하므로 초기화
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      capturedPrompt = null;
    }
  };

  return { isInstallable, isStandalone, installPWA };
};
