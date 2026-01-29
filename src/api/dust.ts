/**
 * 미세먼지 데이터 인터페이스
 */
export interface DustItem {
  dataTime: string; // 측정일시
  pm10Value: string; // 미세먼지 농도
  pm10Grade: string; // 미세먼지 등급 (1:좋음, 2:보통, 3:나쁨, 4:매우나쁨)
  pm25Value: string; // 초미세먼지 농도
  pm25Grade: string; // 초미세먼지 등급
  khaiGrade: string; // 통합대기환경등급
}

/**
 * 측정소 이름으로 미세먼지 정보를 조회합니다.
 */
export const getDustInfo = async (stationName: string): Promise<DustItem | null> => {
  console.log(`[DustAPI] getDustInfo called with: ${stationName}`);

  const apiKey = import.meta.env.VITE_DUST_API_KEY;
  if (!apiKey) {
    console.error("[DustAPI] VITE_DUST_API_KEY is missing in .env.local!");
    return null;
  }

  // 공공데이터포털 Decoding Key는 특수문자(+, / 등)를 포함하므로 URL 인코딩 필수
  const encodedKey = encodeURIComponent(apiKey);
  const encodedName = encodeURIComponent(stationName);

  // 프록시 URL
  const url = `/api/dust-proxy?serviceKey=${encodedKey}&returnType=json&numOfRows=1&pageNo=1&stationName=${encodedName}&dataTerm=DAILY&ver=1.0`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`Dust API Error: ${res.status} ${res.statusText}`);
      const errText = await res.text();
      console.error("Error Response Body:", errText);
      throw new Error(`Dust API HTTP Error ${res.status}`);
    }

    const text = await res.text();
    // 공공데이터포털 에러 시 XML/HTML이 올 수 있음 (<OpenAPI_ServiceResponse...>)
    if (text.trim().startsWith('<')) {
      console.error("Dust API returned XML/HTML instead of JSON:", text);
      throw new Error("Invalid API Response (NOT JSON)");
    }

    try {
      const json = JSON.parse(text);

      // 결과 코드 확인 (00: 정상)
      if (json.response?.header?.resultCode !== '00') {
        console.warn("Dust API returned error code:", json.response?.header);
      }

      const items = json.response?.body?.items;

      if (items && items.length > 0) {
        return items[0] as DustItem;
      }

      console.warn("No dust data found for station:", stationName);
      return null;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Text:", text);
      return null;
    }

  } catch (e) {
    console.error("Failed to fetch dust info:", e);
    return null;
  }
};

/**
 * 읍면동 명칭을 기반으로 가장 가까운 측정소를 찾아 미세먼지 정보를 가져옵니다.
 * [개선] 동일 지명(예: 이동) 중 현재 지역과 일치하는 TM 좌표를 정밀 선택하도록 필터링 강화
 */
export const getNearbyStationWithDust = async (umdName: string, sidoName: string, sggName: string): Promise<DustItem | null> => {
  try {
    // 1. 읍면동명 -> TM 좌표 목록 조회
    const encodedUmd = encodeURIComponent(umdName);
    const tmUrl = `/api/tm-coord?umdName=${encodedUmd}`;
    const tmRes = await fetch(tmUrl);
    const tmJson = await tmRes.json();
    const tmItems = tmJson.response?.body?.items || [];

    if (tmItems.length === 0) {
      console.warn(`[DustAPI] No TM coordinates found for: ${umdName}`);
      return null;
    }

    // 2. 현재 지역(sido, sgg)과 매칭되는 TM 좌표 찾기
    // 복합 지명(창원시진해구)의 경우 부분 일치 여부로 유연하게 체크
    const sggClean = sggName.replace(/\s+/g, '');
    let matchedTM = tmItems.find((item: any) => {
      const isSidoMatch = (sidoName.includes(item.sidoName) || item.sidoName.includes(sidoName.slice(0, 2)));
      const isSggMatch = (sggClean.includes(item.sggName) || item.sggName.includes(sggClean.replace(/시|구|군/g, '')));
      return isSidoMatch && isSggMatch;
    });

    // 매칭되는 게 없으면 첫 번째 결과라도 사용 시도
    const finalTM = matchedTM || tmItems[0];

    if (!finalTM?.tmX || !finalTM?.tmY) return null;

    // 3. TM 좌표 -> 근처 측정소 목록 조회
    const nearbyUrl = `/api/nearby-station?tmX=${finalTM.tmX}&tmY=${finalTM.tmY}`;
    const nearbyRes = await fetch(nearbyUrl);
    const nearbyJson = await nearbyRes.json();
    const stations = nearbyJson.response?.body?.items;

    if (!stations || stations.length === 0) {
      console.warn("[DustAPI] No nearby stations found");
      return null;
    }

    // 3. 근처 측정소들을 순회하며 실제 데이터가 있는 곳 찾기 (최대 3곳)
    for (let i = 0; i < Math.min(stations.length, 3); i++) {
      const stationName = stations[i].stationName;
      const dustData = await getDustInfo(stationName);
      if (dustData && dustData.pm10Value && dustData.pm10Value !== '-') {
        console.log(`[DustAPI] Found valid data at nearby station: ${stationName}`);
        return dustData;
      }
    }

    return null;
  } catch (error) {
    console.error("[DustAPI] Error in getNearbyStationWithDust:", error);
    return null;
  }
};
