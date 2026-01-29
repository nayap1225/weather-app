export interface MidTermCode {
  region: string; // 행정구역 (서울, 부산, ...)
  landCode: string; // 육상예보 구역코드 (11B00000 등)
  tempCode: string; // 기온예보 지점코드 (11B10101 등)
}

// 행정구역별 중기예보 코드 매핑
// s1(시/도) 기준으로 1차 매핑, 필요시 세분화 가능하나 여기선 대표 코드 사용
export const MID_TERM_CODES: Record<string, MidTermCode> = {
  // 수도권
  '서울특별시': { region: '서울', landCode: '11B00000', tempCode: '11B10101' },
  '인천광역시': { region: '인천', landCode: '11B00000', tempCode: '11B20201' },
  '경기도': { region: '경기', landCode: '11B00000', tempCode: '11B20601' }, // 수원 기준

  // 강원
  '강원도': { region: '강원', landCode: '11D10000', tempCode: '11D10301' }, // 춘천 기준 (영서/영동 나뉘지만 단순화)

  // 충청
  '대전광역시': { region: '대전', landCode: '11C20000', tempCode: '11C20401' },
  '세종특별자치시': { region: '세종', landCode: '11C20000', tempCode: '11C20404' },
  '충청남도': { region: '충남', landCode: '11C20000', tempCode: '11C20101' }, // 천안 기준
  '충청북도': { region: '충북', landCode: '11C10000', tempCode: '11C10301' }, // 청주 기준

  // 전라
  '광주광역시': { region: '광주', landCode: '11F20000', tempCode: '11F20501' },
  '전라남도': { region: '전남', landCode: '11F20000', tempCode: '11F20503' }, // 목포 기준
  '전북특별자치도': { region: '전북', landCode: '11F10000', tempCode: '11F10201' }, // 전주 기준
  '전라북도': { region: '전북', landCode: '11F10000', tempCode: '11F10201' }, // (구 명칭 대비)

  // 경상
  '부산광역시': { region: '부산', landCode: '11H20000', tempCode: '11H20201' },
  '울산광역시': { region: '울산', landCode: '11H20000', tempCode: '11H20101' },
  '경상남도': { region: '경남', landCode: '11H20000', tempCode: '11H20301' }, // 창원 기준
  '대구광역시': { region: '대구', landCode: '11H10000', tempCode: '11H10701' },
  '경상북도': { region: '경북', landCode: '11H10000', tempCode: '11H10501' }, // 안동 기준

  // 제주
  '제주특별자치도': { region: '제주', landCode: '11G00000', tempCode: '11G00201' }, // 제주
};

/**
 * s1(시/도) 이름을 입력받아 적절한 중기예보 코드를 반환
 */
export const getMidTermCode = (s1: string): MidTermCode => {
  // 정확히 일치하는 경우
  if (MID_TERM_CODES[s1]) return MID_TERM_CODES[s1];

  // '충남', '경북' 등 줄임말 처리
  for (const key in MID_TERM_CODES) {
    if (key.includes(s1) || s1.includes(MID_TERM_CODES[key].region)) {
      return MID_TERM_CODES[key];
    }
  }

  // 기본값 (서울)
  return MID_TERM_CODES['서울특별시'];
};
