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

  const normalizedKeyword = keyword.trim().replace(/\s+/g, ''); // 공백 제거 후 비교

  // "독산동" 입력 시 "독산제1동"도 검색되도록 하기 위해 "동"을 뗀 키워드 준비
  let looseKeyword = '';
  if (normalizedKeyword.length > 1 && normalizedKeyword.endsWith('동')) {
    looseKeyword = normalizedKeyword.slice(0, -1); // "독산"
  }

  // 동 단위(s3) 정보가 있는 구체적인 지역 우선, 혹은 구 단위까지 검색
  return allRegions
    .filter(region => {
      // 1. 최소한 시/군/구(s2) 정보는 있어야 의미있는 검색 결과
      if (!region.s2) return false;

      const normalizedName = region.name.replace(/\s+/g, '');

      // A. 정확히 포함되는 경우 (기본)
      if (normalizedName.includes(normalizedKeyword)) return true;

      // B. "OO동" -> "OO"로 검색 시, 동 이름(s3)에 "OO"이 포함되는지 확인
      // 예: "독산동" -> "독산" -> "독산제1동" (매칭)
      if (looseKeyword && region.s3 && region.s3.includes(looseKeyword)) {
        return true;
      }

      return false;
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
