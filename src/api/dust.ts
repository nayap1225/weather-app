import {
  getCachedData,
  setCachedData,
  generateCacheKey,
} from "../utils/apiCache";

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
  stationName?: string; // [추가] 측정소 이름
}

/**
 * 시도 명칭을 AirKorea API 약어 규격(2글자)으로 변환합니다.
 */
const getSidoShort = (name: string) => {
  if (!name) return "";
  if (name.includes("서울")) return "서울";
  if (name.includes("부산")) return "부산";
  if (name.includes("대구")) return "대구";
  if (name.includes("인천")) return "인천";
  if (name.includes("광주")) return "광주";
  if (name.includes("대전")) return "대전";
  if (name.includes("울산")) return "울산";
  if (name.includes("경기")) return "경기";
  if (name.includes("강원")) return "강원";
  if (name.includes("충북") || (name.includes("충청") && name.includes("북")))
    return "충북";
  if (name.includes("충남") || (name.includes("충청") && name.includes("남")))
    return "충남";
  if (name.includes("전북") || (name.includes("전라") && name.includes("북")))
    return "전북";
  if (name.includes("전남") || (name.includes("전라") && name.includes("남")))
    return "전남";
  if (name.includes("경북") || (name.includes("경상") && name.includes("북")))
    return "경북";
  if (name.includes("경남") || (name.includes("경상") && name.includes("남")))
    return "경남";
  if (name.includes("제주")) return "제주";
  if (name.includes("세종")) return "세종";
  return name.slice(0, 2);
};

/**
 * 측정소 이름으로 미세먼지 정보를 조회합니다.
 */
export const getDustInfo = async (
  stationName: string,
): Promise<DustItem | null> => {
  console.log(`[DustAPI] getDustInfo called with: ${stationName}`);

  // 캐시 확인
  const cacheKey = generateCacheKey("dust_station", stationName);
  const cached = getCachedData<DustItem>(cacheKey);
  if (cached) return cached;

  const encodedName = encodeURIComponent(stationName);

  // 프록시 URL (serviceKey는 서버에서 주입하므로 클라이언트에서는 제외)
  // [수정] ver=1.3으로 상향 (PM2.5 등급 등 포함), numOfRows=1 -> 24로 늘려서 최근 시간대 확보 후 정렬
  const url = `/api/dust?returnType=json&numOfRows=24&pageNo=1&stationName=${encodedName}&dataTerm=DAILY&ver=1.3`;

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
    if (text.trim().startsWith("<")) {
      console.error("Dust API returned XML/HTML instead of JSON:", text);
      throw new Error("Invalid API Response (NOT JSON)");
    }

    try {
      const json = JSON.parse(text);

      // 결과 코드 확인 (00: 정상)
      if (json.response?.header?.resultCode !== "00") {
        console.warn("Dust API returned error code:", json.response?.header);
      }

      const items = json.response?.body?.items;

      // [공공데이터포털 특이사항] 결과가 1개일 때 배열이 아닌 객체로 오는 경우 대응
      if (!items) return null;
      const itemArray = Array.isArray(items) ? items : [items];

      if (itemArray.length > 0) {
        // dataTime 기준 내림차순 정렬 (최신순)
        itemArray.sort((a: DustItem, b: DustItem) => {
          return (b.dataTime || "").localeCompare(a.dataTime || "");
        });

        const item = itemArray[0] as DustItem;

        // 측정소 이름 주입
        item.stationName = stationName;

        console.log(
          `[DustAPI] Picked latest data: ${item.dataTime} (from ${itemArray.length} items)`,
        );

        // 유효한 데이터가 있을 때만 캐시 저장 (빈 값(-) 제외)
        if (item.pm10Value && item.pm10Value !== "-") {
          setCachedData(cacheKey, item);
        }
        return item;
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
export const getNearbyStationWithDust = async (
  umdName: string,
  sidoName: string,
  sggName: string,
): Promise<DustItem | null> => {
  // 캐시 확인 (위치 기반 추적 결과 캐싱)
  // 읍면동+시군구 조합으로 캐시 -> 성공적으로 찾은 결과(DustItem)를 저장해두면, 복잡한 재검색 과정을 생략 가능
  const cacheKey = generateCacheKey(
    "dust_nearby_search",
    umdName,
    sidoName,
    sggName,
  );
  const cached = getCachedData<DustItem>(cacheKey);
  if (cached) return cached;

  try {
    const fetchTM = async (name: string) => {
      const encoded = encodeURIComponent(name);
      const res = await fetch(`/api/tm-coord?umdName=${encoded}`);
      const text = await res.text();

      if (
        text.includes("Forbidden") ||
        text.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR")
      ) {
        console.error(
          "[DustAPI] TM Coord API is Forbidden! Please check if 'MsrstnInfoInqireSvc' is approved in Data.go.kr",
        );
        return [];
      }

      try {
        const json = JSON.parse(text);
        const raw = json.response?.body?.items;
        return Array.isArray(raw) ? raw : raw ? [raw] : [];
      } catch {
        return [];
      }
    };
    const findMatchedTM = (items: any[]) => {
      const sShort = getSidoShort(sidoName);
      const sClean = sggName.replace(/\s+/g, "");
      return items.find((item: any) => {
        if (!item.sidoName || !item.sggName) return false;
        const itemSidoShort = getSidoShort(item.sidoName);
        const itemSggClean = item.sggName.replace(/\s+/g, "");
        const isSidoMatch = sShort === itemSidoShort;
        const isSggMatch =
          sClean.includes(itemSggClean) ||
          itemSggClean.includes(sClean.replace(/시|구|군/g, "")) ||
          sClean.startsWith(itemSggClean.slice(0, 2));
        return isSidoMatch && isSggMatch;
      });
    };

    // 1. 읍면동명으로 조회 및 매칭 시도
    let tmItems = await fetchTM(umdName);
    let matchedTM = findMatchedTM(tmItems);

    // 2. 동 단위 매칭 실패 시 시군구명으로 재시도
    if (!matchedTM && sggName) {
      console.log(
        `[DustAPI] No matched TM for ${umdName}, trying with ${sggName}`,
      );
      const sggTMItems = await fetchTM(sggName);
      matchedTM = findMatchedTM(sggTMItems);
      // 만약 시군구로 매칭 성공했다면 tmItems도 업데이트해서 최후의 보루용으로 확보
      if (matchedTM) tmItems = sggTMItems;
    }

    // 3. 최후의 보루: 매칭된게 전혀 없다면 동 단위 결과 중 첫 번째라도 사용
    const finalTM = matchedTM || tmItems[0];

    if (!finalTM?.tmX || !finalTM?.tmY) {
      console.warn(
        `[DustAPI] No valid TM coordinates found for ${umdName}/${sggName}`,
      );
      return null;
    }

    // 4. 근처 측정소 조회 및 데이터 페칭
    const nearbyUrl = `/api/nearby-station?tmX=${finalTM.tmX}&tmY=${finalTM.tmY}`;
    const nearbyRes = await fetch(nearbyUrl);
    const nearbyText = await nearbyRes.text();

    if (
      nearbyText.includes("Forbidden") ||
      nearbyText.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR")
    ) {
      console.error("[DustAPI] Nearby Station API is Forbidden!");
      return null;
    }

    const nearbyJson = JSON.parse(nearbyText);
    const stationItemsRaw = nearbyJson.response?.body?.items;
    if (!stationItemsRaw) {
      console.warn(
        `[DustAPI] No nearby stations found for TM coordinates: ${finalTM.tmX}, ${finalTM.tmY}`,
      );
      return null;
    }
    const stations = Array.isArray(stationItemsRaw)
      ? stationItemsRaw
      : [stationItemsRaw];

    if (stations.length === 0) {
      console.warn(
        `[DustAPI] Nearby station list is empty for TM coordinates: ${finalTM.tmX}, ${finalTM.tmY}`,
      );
      return null;
    }

    // [최적화 수정] 사용자가 "가장 가까운 측정소(예: 시흥대로)"를 원함.
    // 기존 2개 제한은 너무 빡빡해서 놓치는 경우가 생김 -> 10개로 늘려서 거리순으로 샅샅이 뒤짐
    // (캐싱이 있으므로 재호출 부담은 적음)
    console.log(
      `[DustAPI] Found ${stations.length} nearby stations via TM coords.`,
    );

    for (let i = 0; i < Math.min(stations.length, 10); i++) {
      const stationName = stations[i].stationName;
      const addr = stations[i].addr || "";
      console.log(
        `[DustAPI] Checking candidate #${i + 1}: ${stationName} (${addr})`,
      );

      const dustData = await getDustInfo(stationName);

      if (!dustData) {
        console.log(`[DustAPI] Skipping ${stationName}: No data returned`);
        continue;
      }

      console.log(
        `[DustAPI] candidate ${stationName} -> PM10:${dustData.pm10Value}, PM2.5:${dustData.pm25Value}, Time:${dustData.dataTime}`,
      );

      if (
        dustData.pm10Value &&
        dustData.pm10Value !== "-" &&
        dustData.pm10Value !== ""
      ) {
        console.log(
          `[DustAPI] Found valid dust data for station: ${stationName}`,
        );

        // 최종적으로 찾은 유효 데이터를 '검색 조건(동/구)' 키로도 캐싱하여
        // 다음번엔 TM조회->근처측정소조회 과정을 통째로 건너뛰게 함.
        setCachedData(cacheKey, dustData);
        return dustData;
      }
    }

    console.warn(
      `[DustAPI] No valid dust data found after checking ${Math.min(stations.length, 2)} nearby stations for ${umdName}/${sggName}.`,
    );
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
export const getDustInfoBySgg = async (
  sidoName: string,
  sggName: string,
  neighborhoodNames: string[],
): Promise<DustItem | null> => {
  console.log(`[DustAPI] getDustInfoBySgg called for ${sidoName} ${sggName}`);

  const cacheKey = generateCacheKey("dust_sgg_search", sidoName, sggName);
  const cached = getCachedData<DustItem>(cacheKey);
  if (cached) return cached;

  const sidoShort = getSidoShort(sidoName);
  const sggClean = sggName.replace(/\s+/g, "");
  const encodedSido = encodeURIComponent(sidoShort);

  // ver=1.3: PM10, PM2.5 1시간 등급 정보 포함
  // numOfRows=1000: 경기도와 같이 대규모 측정소가 있는 지역 대응 (프록시에서도 보강하지만 여기서도 명시)
  const url = `/api/sido-dust?sidoName=${encodedSido}&searchCondition=HOUR&ver=1.3&numOfRows=1000`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const items = json.response?.body?.items;

    if (!items || !Array.isArray(items)) {
      console.warn(
        `[DustAPI] No items found in Sido-wide search for ${sidoShort}`,
      );
      return null;
    }

    // [예외 대응] 시군구명과 측정소명이 완전히 다른 지역들을 위한 수동 매핑 테이블
    const manualMapping: Record<string, string[]> = {
      안산시상록구: ["본오동", "부곡동1", "부곡3동"],
      안산시단원구: ["고잔동", "원시동", "호수동", "대부동", "중앙대로"],
      안산시: ["고잔동", "본오동", "부곡동1", "원시동"],
      창원시: [
        "의창동",
        "용지동",
        "웅남동",
        "반송동",
        "사파동",
        "회원동",
        "봉암동",
        "월영동",
        "경화동",
        "웅동",
      ],
      창원시성산구: ["웅남동", "반송동", "사파동", "토월동", "중앙동"],
      창원시진해구: ["경화동", "진해항", "웅동"],
      창원시마산회원구: ["회원동", "봉암동", "내서읍"],
      창원시마산합포구: ["월영동", "진동면"],
      창원시의창구: ["의창동", "용지동", "대산면"],
      고양시: ["신원동", "행신동", "식사동", "주엽동"],
      고양시덕양구: ["신원동", "행신동", "관산동"],
      고양시일산동구: ["식사동", "중산동", "마두역"],
      고양시일산서구: ["주엽동", "일산동"],
      세종특별자치시: ["세종", "조치원", "아름동", "신흥동"],
      세종시: ["세종", "조치원", "아름동", "신흥동"],
      제주시: ["이도동", "연동", "노형동"],
      서귀포시: ["동홍동", "강정동", "성산읍"],
    };

    const targetManualStations = manualMapping[sggClean] || [];

    // [개선] 지명이 매칭되더라도 실제 데이터가 없는(-) 측정소는 건너뛰고
    // 유효한 데이터가 있는 측정소를 우선적으로 찾습니다.
    const potentialItems = items.filter((item) => {
      const stationName = item.stationName;

      // 1. 수동 매핑 확인
      const isManualMatch = targetManualStations.some((s) =>
        stationName.includes(s),
      );
      if (isManualMatch) return true;

      // 2. 행정동 리스트와 매칭 (측정소 이름이 동 이름이거나 동 이름을 포함할 때)
      const isNeighborhoodMatch = neighborhoodNames.some(
        (dong) => stationName.includes(dong) || dong.includes(stationName),
      );
      if (isNeighborhoodMatch) return true;

      // 3. 시군구 명칭 유연 매칭
      // "창원시진해구" -> ["창원시", "진해구", "창원", "진해"]
      const sggParts = [sggClean];
      const complexMatch = sggClean.match(/^([가-힣]+시)([가-힣]+[구군])$/);
      if (complexMatch) {
        sggParts.push(complexMatch[1], complexMatch[2]);
        sggParts.push(
          complexMatch[1].replace(/시$/, ""),
          complexMatch[2].replace(/[구군]$/, ""),
        );
      } else {
        sggParts.push(sggClean.replace(/시|구|군/g, ""));
      }

      const isSggMatch = sggParts.some(
        (part) =>
          part.length > 1 &&
          (stationName.includes(part) || part.includes(stationName)),
      );

      return isSggMatch;
    });

    // 유효한 데이터(pm10Value가 -가 아님)가 있는 첫 번째 항목 선택
    const finalItem =
      potentialItems.find(
        (item) =>
          item.pm10Value && item.pm10Value !== "-" && item.pm10Value !== "",
      ) || potentialItems[0]; // 없으면 첫 번째라도 반환

    if (finalItem) {
      console.log(
        `[DustAPI] Found valid station: ${finalItem.stationName} for ${sggClean} (${neighborhoodNames[0]})`,
      );
      setCachedData(cacheKey, finalItem as DustItem);
      return finalItem as DustItem;
    }

    return null;
  } catch (error) {
    console.error("[DustAPI] Error in getDustInfoBySgg:", error);
    return null;
  }
};
