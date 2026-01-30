
/**
 * 카카오 로컬 API를 통해 위경도 좌표를 행정 구역 주소로 변환합니다.
 */
export const getAddressFromCoords = async (lat: number, lng: number): Promise<string | null> => {
  // x: 경도(lng), y: 위도(lat)
  const url = `/api/kakao-address?x=${lng}&y=${lat}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[KakaoAPI] Failed to fetch address: ${res.status}`);
      return null;
    }

    const data = await res.json();

    // 카카오 응답 구조: documents[0].address (지번) 또는 .road_address (도로명)
    // 행정동 정보가 있는 .address 사용 선호
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      const addr = doc.address;

      if (addr) {
        // "경기도 안산시 상록구 안산동" 형태 구성
        return `${addr.region_1depth_name} ${addr.region_2depth_name} ${addr.region_3depth_name}`;
      }
    }

    return null;
  } catch (error) {
    console.error("[KakaoAPI] Error getting address from coords:", error);
    return null;
  }
};
