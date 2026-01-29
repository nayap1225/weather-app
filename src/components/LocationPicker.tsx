import { useState, useEffect, useRef } from 'react';
import { searchRegions, findAllRegionsByNxNy } from '../utils/regionUtils';
import { dfs_xy_conv } from '../utils/coordinateConverter';
import type { Region } from '../types/region';

interface Props {
  nx: number;
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
  const [gpsLoading, setGpsLoading] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 좌표(nx, ny)가 변경되면 해당 위치의 주소명을 찾아서 업데이트
  useEffect(() => {
    // 1. 이미 선택된 이름이 있고, 그 이름이 현재 좌표와 일치하는지 검증은 복잡하므로 생략.
    // 하지만 사용자가 검색해서 클릭했을 때는 setSelectedRegionName이 먼저 실행됨.
    // 따라서 여기서는 '초기 로딩' 이거나 '외부에서 좌표가 변했을 때(GPS 등)'를 커버해야 함.

    // 좌표로 해당하는 모든 동네 찾기
    const matched = findAllRegionsByNxNy(nx, ny);

    if (matched.length === 0) {
      if (nx === 60 && ny === 127) setSelectedRegionName("서울특별시 종로구 (기본)");
      else setSelectedRegionName(`위치 좌표: ${nx}, ${ny}`);
      return;
    }

    // 2. 만약 selectedRegionName이 이미 matched 목록 중 하나라면(사용자가 방금 선택함) 굳이 덮어쓰지 않음.
    // (단, 단순 문자열 비교라 정확하진 않지만 UX 개선용)
    const currentName = selectedRegionName.replace(' (기본)', '').replace(' 인근 (GPS)', '').trim();
    const isAlreadySet = matched.some(r => r.name === currentName || (r.s2 && currentName.includes(r.s2) && currentName.includes(r.s3)));

    if (isAlreadySet && selectedRegionName) return;

    // 3. 자동으로 대표 주소 설정
    // 구(s2)가 같으면 '~~구 ~~동 외', 다르면 '~~구, ~~구'
    const s2Set = new Set(matched.map(r => r.s2).filter(Boolean));
    const s2List = Array.from(s2Set);

    if (s2List.length === 1) {
      // 같은 구
      const s3Set = new Set(matched.map(r => r.s3).filter(Boolean));
      const s3List = Array.from(s3Set);
      const district = s2List[0];

      if (s3List.length > 0) {
        // 그냥 첫번째 동을 대표로 표시하거나 '~~동 외' 처리
        const dong = s3List[0];
        // 너무 길어지지 않게
        const suffix = s3List.length > 1 ? ' 등' : '';
        setSelectedRegionName(`${district} ${dong}${suffix}`);
      } else {
        setSelectedRegionName(district || matched[0].name);
      }
    } else if (s2List.length > 1) {
      // 여러 구에 걸친 좌표
      setSelectedRegionName(`${s2List.join(', ')} 인근`);
    } else {
      // 시/도 단위 등 예외
      setSelectedRegionName(matched[0].name);
    }
  }, [nx, ny]); // selectedRegionName은 의존성에서 제외 (무한루프 방지)

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
    setKeyword('');
    setResults([]);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        const target = results[0];
        handleSelectRegion(target);
        onSearch(target.nx, target.ny);
      } else if (keyword.length > 0) {
        alert('검색된 지역이 없습니다. 올바른 지역명(동 단위)을 입력해주세요.');
      }
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("브라우저가 위치 정보를 지원하지 않습니다.");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const { nx, ny } = dfs_xy_conv(latitude, longitude);

        onLocationChange(nx, ny);

        // 좌표로 지역명 역추적 (다건 조회)
        const matchedRegions = findAllRegionsByNxNy(nx, ny);

        if (matchedRegions.length > 0) {
          // 1. 구(s2) 단위로 그룹핑
          const s2Set = new Set(matchedRegions.map(r => r.s2).filter(Boolean));
          const s2List = Array.from(s2Set);

          if (s2List.length > 1) {
            // 다른 구가 섞여있는 경우 (예: 금천구, 양천구) -> 구 단위로 표시
            const label = s2List.slice(0, 2).join(', '); // 최대 2개만 표시
            setSelectedRegionName(`${label} 인근 (GPS)`);
          } else {
            // 같은 구인 경우 (예: 금천구) -> 동(s3) 단위로 표시
            const s3Set = new Set(matchedRegions.map(r => r.s3).filter(Boolean));
            const s3List = Array.from(s3Set);
            // 최대 2개 동만 표시하고 "등" 붙임
            const displayS3 = s3List.slice(0, 2).join(', ');
            const suffix = s3List.length > 2 ? ' 외' : '';
            const district = s2List[0] || '';

            setSelectedRegionName(`${district} ${displayS3}${suffix} 인근 (GPS)`);
          }
        } else {
          setSelectedRegionName(`현재 위치 (GPS)`);
        }

        onSearch(nx, ny);

        setGpsLoading(false);
      },
      (error) => {
        console.error(error);
        if (error.code === error.PERMISSION_DENIED) {
          alert(
            "위치 권한이 거부되었습니다. 🔒\n\n" +
            "Safari/iOS 사용자라면 아래 설정을 확인해주세요:\n" +
            "1. 아이폰 [설정 > 개인정보 보호 > 위치 서비스]가 '켬'인지 확인\n" +
            "2. 하단 리스트에서 [Safari 웹 사이트]를 찾아 '앱을 사용하는 동안'으로 변경\n\n" +
            "이미 거부하셨다면 브라우저 주소창 왼쪽의 [Aa] 또는 [설정] 아이콘을 눌러 위치 권한을 다시 허용해주세요."
          );
        } else if (error.code === error.TIMEOUT) {
          alert("위치 정보를 가져오는 데 시간이 너무 오래 걸립니다. 신호가 좋은 곳에서 다시 시도해주세요.");
        } else {
          alert("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
        }
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 w-full max-w-sm mx-auto relative" ref={wrapperRef}>
      <h2 className="text-lg font-bold text-gray-800 mb-4">위치 설정</h2>

      <div className="mb-4 text-sm text-blue-600 font-medium bg-blue-50 p-3 rounded-lg flex items-center gap-2">
        <span>📍</span>
        <span>{selectedRegionName || `위치 좌표: ${nx}, ${ny}`}</span>
      </div>

      <div className="relative mb-4 flex gap-2">
        <div className="flex-1 relative">
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

        <div className="flex flex-col justify-end">
          <button
            onClick={handleCurrentLocation}
            disabled={gpsLoading || loading}
            className={`p-3 rounded-lg border border-gray-200 text-gray-600 transition-colors h-[50px]
                ${(gpsLoading || loading) ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'}`}
            title="내 현재 위치로 찾기"
          >
            {gpsLoading ? (
              <span className="animate-spin block">↻</span>
            ) : (
              <span>📍</span>
            )}
          </button>
        </div>
      </div>

      <button
        onClick={() => onSearch()}
        disabled={loading || gpsLoading}
        className={`w-full py-3 rounded-xl font-bold text-white transition-all
          ${(loading || gpsLoading)
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95'
          }`}
      >
        {loading ? '조회 중...' : '날씨 조회'}
      </button>
    </div>
  );
}
