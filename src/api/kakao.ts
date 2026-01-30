
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
    console.log("[KakaoAPI] Response data:", data);

    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      const addr = doc.address;

      if (addr) {
        return `${addr.region_1depth_name} ${addr.region_2depth_name} ${addr.region_3depth_name}`;
      }

      // 도로명 주소 폴백
      if (doc.road_address) {
        const r = doc.road_address;
        return `${r.region_1depth_name} ${r.region_2depth_name} ${r.road_name}`;
      }
    }

    console.warn("[KakaoAPI] No address found in documents");
    return null;
  } catch (error) {
    console.error("[KakaoAPI] Error getting address from coords:", error);
    return null;
  }
};
