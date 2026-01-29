import regionsData from '../data/regions.json';
import type { Region } from '../types/region';

/**
 * regions.json 데이터 전체 캐싱 (import 시점에 로드됨)
 */
const allRegions: Region[] = regionsData as Region[];

/**
 * 검색어(keyword)를 포함하는 지역(동 단위)을 검색하여 반환
 * @param keyword 사용자 입력 검색어
 * @param limit 최대 반환 개수 (기본 30개)
 */
export const searchRegions = (keyword: string, limit: number = 30): Region[] => {
  if (!keyword || keyword.trim() === '') {
    return [];
  }

  const normalizedKeyword = keyword.trim().replace(/\s+/g, '');

  // 1. 실제 사용자가 선택할 '동/읍/면' 단위가 있는 데이터만 필터링 (노이즈 제거)
  const candidates = allRegions.filter(region => {
    if (!region.s3) return false; // 읍/면/동 정보가 없으면 제외 (구/시 단위 검색 방지)

    const s3Name = region.s3.replace(/\s+/g, '');
    const fullName = region.name.replace(/\s+/g, '');

    return s3Name.includes(normalizedKeyword) || fullName.includes(normalizedKeyword);
  });

  // 2. 가중치 기반 정렬 (사용자 의도에 가장 가까운 순서)
  return candidates
    .sort((a, b) => {
      const aS3 = a.s3.replace(/\s+/g, '');
      const bS3 = b.s3.replace(/\s+/g, '');

      // A. 읍/면/동 이름이 검색어로 시작하는 경우 최우선 (예: '이동' -> '이동' 먼저, '이화동' 뒤로)
      const aStartsWith = aS3.startsWith(normalizedKeyword);
      const bStartsWith = bS3.startsWith(normalizedKeyword);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // B. 읍/면/동 이름이 검색어와 정확히 일치하는 경우 우선
      if (aS3 === normalizedKeyword && bS3 !== normalizedKeyword) return -1;
      if (aS3 !== normalizedKeyword && bS3 === normalizedKeyword) return 1;

      // C. 읍/면/동 이름 길이기 짧은 순 (더 명확한 검색 결과)
      if (aS3.length !== bS3.length) return aS3.length - bS3.length;

      return 0;
    })
    .slice(0, limit);
};

/**
 * NX, NY 좌표에 해당하는 지역 정보를 반환 (역추적)
 * 격자 좌표 특성상 여러 동이 같은 좌표를 공유할 수 있으므로, 첫 번째 매칭되는 지역을 반환함.
 */
export const findRegionByNxNy = (nx: number, ny: number): Region | undefined => {
  return allRegions.find(region => region.nx === nx && region.ny === ny);
};

/**
 * NX, NY 좌표를 공유하는 모든 지역 리스트 반환
 */
export const findAllRegionsByNxNy = (nx: number, ny: number): Region[] => {
  return allRegions.filter(region => region.nx === nx && region.ny === ny);
};
