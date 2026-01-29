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
