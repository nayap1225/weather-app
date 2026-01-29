import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // 브라우저 기본 설치 팝업 방지
      e.preventDefault();
      // 이벤트를 저장해두었다가 나중에 사용
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('PWA install prompt is deferred');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 이미 설치된 경우 처리
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;

    // 저장해둔 팝업 띄우기
    deferredPrompt.prompt();

    // 사용자의 선택 결과 대기
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // 결과와 상관없이 prompt는 한 번만 사용 가능하므로 초기화
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, installPWA };
};
