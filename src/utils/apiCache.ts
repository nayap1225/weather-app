/**
 * API 응답 캐싱 유틸리티 (SessionStorage 사용)
 * 새로고침 시에도 유지되지만, 탭 닫으면 초기화됨.
 */

interface CacheItem<T> {
  timestamp: number;
  data: T;
}

const CACHE_PREFIX = "weather_app_cache_v4_";
const DEFAULT_TTL = 30 * 60 * 1000; // 30분

export const getCachedData = <T>(key: string): T | null => {
  try {
    const fullKey = CACHE_PREFIX + key;
    const itemStr = sessionStorage.getItem(fullKey);

    if (!itemStr) return null;

    const item: CacheItem<T> = JSON.parse(itemStr);
    const now = Date.now();

    if (now - item.timestamp > DEFAULT_TTL) {
      sessionStorage.removeItem(fullKey);
      return null;
    }

    console.log(`[Cache] Hit: ${key}`);
    return item.data;
  } catch (e) {
    console.error(`[Cache] Read Error: ${key}`, e);
    return null;
  }
};

export const setCachedData = <T>(key: string, data: T): void => {
  try {
    const fullKey = CACHE_PREFIX + key;
    const item: CacheItem<T> = {
      timestamp: Date.now(),
      data,
    };
    sessionStorage.setItem(fullKey, JSON.stringify(item));
    console.log(`[Cache] Set: ${key}`);
  } catch (e) {
    console.error(`[Cache] Write Error: ${key}`, e);
  }
};

/**
 * 캐시 키 생성 헬퍼
 * @param type 데이터 종류 (weather, dust, etc)
 * @param args 식별 인자들 (좌표, 이름 등)
 */
export const generateCacheKey = (
  type: string,
  ...args: (string | number)[]
) => {
  // 시간 단위(시)를 포함하여 매 시간 정각이 지나면 자동으로 키가 바뀌도록 함 (선택적)
  // 여기서는 단순히 인자들을 조합하고, TTL로 관리하므로 시간은 키에 안 넣어도 무방하지만
  // 날씨 데이터 특성상 '발표 시간'이 중요하므로 호출자가 관리하게 둠.
  return `${type}_${args.join("_")}`;
};
