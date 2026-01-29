import { useState, useEffect, useRef } from 'react';
import { searchRegions } from '../utils/regionUtils';
import type { Region } from '../types/region';

interface Props {
  nx: number; // 현재 선택된 nx (표시용으로 쓰진 않지만 부모 연동 확인용)
  ny: number;
  onLocationChange: (nx: number, ny: number) => void;
  onSearch: (nx?: number, ny?: number) => void;
  loading: boolean;
}

export default function LocationPicker({ nx, ny, onLocationChange, onSearch, loading }: Props) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Region[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRegionName, setSelectedRegionName] = useState('');

  const wrapperRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 초기 로드 시 현재 좌표 정보를 기반으로 지역명 역추적은 어려우므로(N:1),
  // "사용자 지정 위치" 등으로 표시하거나 비워둠.
  // 여기서는 단순히 초기값이 있으면(nx=60, ny=127) "서울 종로구(기본값)"을 표시해주거나 함.
  useEffect(() => {
    if (nx === 60 && ny === 127 && !selectedRegionName) {
      setSelectedRegionName("서울특별시 종로구 (기본)");
    }
  }, [nx, ny, selectedRegionName]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);

    if (val.length >= 2) {
      const searchResults = searchRegions(val);
      setResults(searchResults);
      setShowDropdown(true);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectRegion = (region: Region) => {
    onLocationChange(region.nx, region.ny);
    setSelectedRegionName(region.name);
    setKeyword(''); // 검색어 초기화
    setResults([]); // 결과 비우기
    setShowDropdown(false);
    // 클릭 시에는 자동 조회를 하지 않음 (사용자가 버튼 누르게 유도)
    // 혹은 원한다면 여기서도 onSearch(region.nx, region.ny) 호출 가능
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 조회 버튼 클릭 trigger 방지
      if (results.length > 0) {
        // 엔터 시: 첫 번째 결과 선택 + 즉시 조회
        const target = results[0];
        handleSelectRegion(target);
        onSearch(target.nx, target.ny); // 인자로 좌표 전달하여 즉시 조회
      } else if (keyword.length > 0) {
        // 검색 결과가 없는데 엔터 친 경우
        alert('검색된 지역이 없습니다. 올바른 지역명(동 단위)을 입력해주세요.');
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 w-full max-w-sm mx-auto relative" ref={wrapperRef}>
      <h2 className="text-lg font-bold text-gray-800 mb-4">위치 설정</h2>

      {/* 현재 선택된 위치 표시 */}
      <div className="mb-4 text-sm text-blue-600 font-medium bg-blue-50 p-3 rounded-lg flex items-center gap-2">
        <span>📍</span>
        <span>{selectedRegionName || `위치 좌표: ${nx}, ${ny}`}</span>
      </div>

      <div className="relative mb-4">
        <span className="block text-sm text-gray-500 mb-1">지역 검색 (동 단위)</span>
        <input
          type="text"
          placeholder="예: 종로구, 역삼동 (입력 후 엔터)"
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={keyword}
          onChange={handleSearchInput}
          onKeyDown={handleKeyDown}
          onFocus={() => keyword.length >= 2 && setShowDropdown(true)}
        />

        {/* 검색 결과 드롭다운 */}
        {showDropdown && results.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-100 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
            {results.map((region) => (
              <li
                key={region.code}
                onClick={() => handleSelectRegion(region)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-none transition-colors"
              >
                {region.name}
              </li>
            ))}
          </ul>
        )}

        {showDropdown && keyword.length >= 2 && results.length === 0 && (
          <div className="absolute z-10 w-full bg-white border border-gray-100 rounded-lg shadow-xl mt-1 p-4 text-center text-gray-400 text-sm">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      <button
        onClick={() => onSearch()}
        disabled={loading}
        className={`w-full py-3 rounded-xl font-bold text-white transition-all
          ${loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95'
          }`}
      >
        {loading ? '조회 중...' : '날씨 조회'}
      </button>
    </div>
  );
}
