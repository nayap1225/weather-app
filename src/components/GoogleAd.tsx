import React, { useEffect } from "react";

const GoogleAd: React.FC = () => {
  useEffect(() => {
    // 구글 애드센스 스크립트가 로드되었을 때 광고 푸시
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Ads error", e);
    }
  }, []);

  return (
    <div className="w-full my-2 flex justify-center items-center overflow-hidden">
      {/* 실제 애드센스 코드로 교체해야 하는 부분 */}
      {/* 개발 중에는 플레이스홀더를 보여줍니다 */}
      <div className="text-gray-400 text-sm text-center">
        {/* <p className="font-bold mb-1">Google Ad Area</p>
        <p className="text-xs">이곳에 광고가 표시됩니다</p> */}
        {/* 
        실제 사용 시 아래 주석을 해제하고 data-ad-client 등을 설정하세요.
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot="XXXXXXXXXX"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        */}
      </div>
    </div>
  );
};

export default GoogleAd;
