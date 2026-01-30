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

  const encodedName = encodeURIComponent(stationName);

  // 프록시 URL (serviceKey는 서버에서 주입하므로 클라이언트에서는 제외)
  const url = `/api/dust?returnType=json&numOfRows=1&pageNo=1&stationName=${encodedName}&dataTerm=DAILY&ver=1.0`;

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

      let items = json.response?.body?.items;

      // [공공데이터포털 특이사항] 결과가 1개일 때 배열이 아닌 객체로 오는 경우 대응
      if (!items) return null;
      const itemArray = Array.isArray(items) ? items : [items];

      if (itemArray.length > 0) {
        return itemArray[0] as DustItem;
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
    const fetchTM = async (name: string) => {
      const encoded = encodeURIComponent(name);
      const res = await fetch(`/api/tm-coord?umdName=${encoded}`);
      const text = await res.text();

      if (text.includes("Forbidden") || text.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR")) {
        console.error("[DustAPI] TM Coord API is Forbidden! Please check if 'MsrstnInfoInqireSvc' is approved in Data.go.kr");
        return [];
      }

      try {
        const json = JSON.parse(text);
        const raw = json.response?.body?.items;
        return Array.isArray(raw) ? raw : (raw ? [raw] : []);
      } catch (e) {
        return [];
      }
    };
    const findMatchedTM = (items: any[]) => {
      const sShort = sidoName.slice(0, 2);
      const sClean = sggName.replace(/\s+/g, '');
      return items.find((item: any) => {
        if (!item.sidoName || !item.sggName) return false;
        const itemSidoShort = item.sidoName.slice(0, 2);
        const itemSggClean = item.sggName.replace(/\s+/g, '');
        const isSidoMatch = (sShort === itemSidoShort);
        const isSggMatch = (sClean.includes(itemSggClean) || itemSggClean.includes(sClean.replace(/시|구|군/g, '')) || sClean.startsWith(itemSggClean.slice(0, 2)));
        return isSidoMatch && isSggMatch;
      });
    };

    // 1. 읍면동명으로 조회 및 매칭 시도
    let tmItems = await fetchTM(umdName);
    let matchedTM = findMatchedTM(tmItems);

    // 2. 동 단위 매칭 실패 시 시군구명으로 재시도
    if (!matchedTM && sggName) {
      console.log(`[DustAPI] No matched TM for ${umdName}, trying with ${sggName}`);
      const sggTMItems = await fetchTM(sggName);
      matchedTM = findMatchedTM(sggTMItems);
      // 만약 시군구로 매칭 성공했다면 tmItems도 업데이트해서 최후의 보루용으로 확보
      if (matchedTM) tmItems = sggTMItems;
    }

    // 3. 최후의 보루: 매칭된게 전혀 없다면 동 단위 결과 중 첫 번째라도 사용
    const finalTM = matchedTM || tmItems[0];

    if (!finalTM?.tmX || !finalTM?.tmY) {
      console.warn(`[DustAPI] No valid TM coordinates found for ${umdName}/${sggName}`);
      return null;
    }

    // 4. 근처 측정소 조회 및 데이터 페칭
    const nearbyUrl = `/api/nearby-station?tmX=${finalTM.tmX}&tmY=${finalTM.tmY}`;
    const nearbyRes = await fetch(nearbyUrl);
    const nearbyText = await nearbyRes.text();

    if (nearbyText.includes("Forbidden") || nearbyText.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR")) {
      console.error("[DustAPI] Nearby Station API is Forbidden!");
      return null;
    }

    let nearbyJson;
    try {
      nearbyJson = JSON.parse(nearbyText);
    } catch (e) {
      console.error("[DustAPI] Failed to parse nearby station JSON:", nearbyText);
      return null;
    }

    let stationItemsRaw = nearbyJson.response?.body?.items;
    if (!stationItemsRaw) {
      console.warn(`[DustAPI] No nearby stations found for TM coordinates: ${finalTM.tmX}, ${finalTM.tmY}`);
      return null;
    }
    const stations = Array.isArray(stationItemsRaw) ? stationItemsRaw : [stationItemsRaw];

    if (stations.length === 0) {
      console.warn(`[DustAPI] Nearby station list is empty for TM coordinates: ${finalTM.tmX}, ${finalTM.tmY}`);
      return null;
    }

    // 최대 5곳까지 순회하여 유효 데이터 확보 (안전성 강화)
    for (let i = 0; i < Math.min(stations.length, 5); i++) {
      const stationName = stations[i].stationName;
      const dustData = await getDustInfo(stationName);
      if (dustData && dustData.pm10Value && dustData.pm10Value !== '-' && dustData.pm10Value !== '') {
        console.log(`[DustAPI] Found valid dust data for station: ${stationName}`);
        return dustData;
      }
    }

    console.warn(`[DustAPI] No valid dust data found after checking ${Math.min(stations.length, 5)} nearby stations for ${umdName}/${sggName}.`);
    return null;
  } catch (error) {
    console.error("[DustAPI] Error in getNearbyStationWithDust:", error);
    return null;
  }
};

/**
 * 시도별 실시간 측정정보 전체를 가져와서 해당 시군구(SGG)에 속한 측정소 데이터를 찾습니다.
 * TM 좌표 조회가 불가능하거나(Forbidden), 지명 매칭이 어려운 경우를 위한 최종 폴백입니다.
 */
export const getDustInfoBySgg = async (sidoName: string, sggName: string, neighborhoodNames: string[]): Promise<DustItem | null> => {
  console.log(`[DustAPI] getDustInfoBySgg called for ${sidoName} ${sggName}`);

  const sidoShort = sidoName.slice(0, 2);
  const sggClean = sggName.replace(/\s+/g, '');
  const encodedSido = encodeURIComponent(sidoShort);

  // ver=1.3: PM10, PM2.5 1시간 등급 정보 포함
  const url = `/api/sido-dust?sidoName=${encodedSido}&searchCondition=HOUR&ver=1.3`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const items = json.response?.body?.items;

    if (!items || !Array.isArray(items)) {
      console.warn(`[DustAPI] No items found in Sido-wide search for ${sidoShort}`);
      return null;
    }

    // [예외 대응] 시군구명과 측정소명이 완전히 다른 지역들을 위한 수동 매핑 테이블
    const manualMapping: Record<string, string[]> = {
      '안산시상록구': ['본오동', '부곡동1', '부곡3동'],
      '안산시단원구': ['고잔동', '원시동', '호수동', '대부동', '중앙대로'],
      '안산시': ['고잔동', '본오동', '부곡동1', '원시동'],
      '세종특별자치시': ['세종', '조치원', '아름동', '신흥동'],
      '세종시': ['세종', '조치원', '아름동', '신흥동'],
      '제주시': ['이도동', '연동', '노형동'],
      '서귀포시': ['동홍동', '강정동', '성산읍']
    };

    const targetManualStations = manualMapping[sggClean] || [];

    // [개선] 지명이 매칭되더라도 실제 데이터가 없는(-) 측정소는 건너뛰고 
    // 유효한 데이터가 있는 측정소를 우선적으로 찾습니다.
    const potentialItems = items.filter(item => {
      const stationName = item.stationName;
      const isSggMatch = (sggClean.includes(stationName) || (stationName.length > 1 && sggClean.includes(stationName.replace(/시|구|군/g, ''))));
      const isManualMatch = targetManualStations.some(s => stationName.includes(s));
      const isNeighborhoodMatch = neighborhoodNames.includes(stationName);

      return isSggMatch || isManualMatch || isNeighborhoodMatch;
    });

    // 유효한 데이터(pm10Value가 -가 아님)가 있는 첫 번째 항목 선택
    const finalItem = potentialItems.find(item => item.pm10Value && item.pm10Value !== '-' && item.pm10Value !== '')
      || potentialItems[0]; // 없으면 첫 번째라도 반환

    if (finalItem) {
      console.log(`[DustAPI] Found valid station: ${finalItem.stationName} for ${sggClean}`);
      return finalItem as DustItem;
    }

    return null;
  } catch (error) {
    console.error("[DustAPI] Error in getDustInfoBySgg:", error);
    return null;
  }
};
