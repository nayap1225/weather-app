import { useState, useEffect, useRef, useCallback } from "react";
import { searchRegions } from "../utils/regionUtils";
import type { Region } from "../types/region";
import { X } from "lucide-react";
import { Search } from "lucide-react";

interface Props {
  nx: number;
  ny: number;
  selectedRegion: Region | null;
  onLocationChange: (nx: number, ny: number, region?: Region) => void;
  onSearch: (nx?: number, ny?: number, region?: Region) => void;
  loading: boolean;
  onClose?: () => void;
  onCurrentLocation: () => void;
  gpsLoading: boolean;
}

export default function LocationPicker({
  // nx,
  // ny,
  // selectedRegion,
  onLocationChange,
  onSearch,
  loading,
  onClose,
  // onCurrentLocation,
  gpsLoading,
}: Props) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Region[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // const displayRegionName = selectedRegion?.name || `좌표: ${nx}, ${ny}`;

  const handleSelectRegion = useCallback(
    (region: Region) => {
      onLocationChange(region.nx, region.ny, region);
      onSearch(region.nx, region.ny, region);
      setKeyword(region.name);
      setResults([]);
      setShowDropdown(false);
      setActiveIndex(-1);
    },
    [onLocationChange, onSearch],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    // [개선] 마운트 시 입력란에 포커스
    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [activeIndex]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    setActiveIndex(-1);

    if (val.length >= 1) {
      const searchResults = searchRegions(val);
      setResults(searchResults);
      setShowDropdown(true);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  };

  const handleFocus = () => {
    if (keyword.length >= 1) {
      const searchResults = searchRegions(keyword);
      setResults(searchResults);
      setShowDropdown(true);
      setActiveIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        // [변경] 즉시 선택 대신 검색 결과 노출
        const searchResults = searchRegions(keyword);
        setResults(searchResults);
        setShowDropdown(true);
        if (searchResults.length > 0) {
          setActiveIndex(0); // 첫 번째 항목에 가이드라인 포커스
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelectRegion(results[activeIndex]);
        } else {
          // [변경] 즉시 선택 대신 검색 결과 노출
          const searchResults = searchRegions(keyword);
          setResults(searchResults);
          setShowDropdown(true);
          if (searchResults.length > 0) {
            setActiveIndex(0); // 첫 번째 항목에 가이드라인 포커스
          }
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setActiveIndex(-1);
        break;
    }
  };

  return (
    <div className="w-full px-2">
      <div className="relative bg-white/95 backdrop-blur-xl w-full rounded-[1rem] border border-white/20 p-4 overflow-y-auto max-h-[90vh] shadow-xl" ref={wrapperRef}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-[18px] font-black text-gray-800 uppercase tracking-widest">지역 검색</label>
            {onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition-colors" title="닫기">
                <X size={28} color="#000000" />
              </button>
            )}
          </div>
          <div className="relative text-left">
            <div className="flex gap-1">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="동네 이름을 입력하세요 (예: 역삼동)"
                  className="w-full h-11 px-4 text-md bg-white border border-gray-300 rounded-[.5rem] focus:ring-2 focus:ring-blue-300 transition text-gray-800 font-semibold outline-none placeholder:text-gray-800/40"
                  value={keyword}
                  onChange={handleSearchInput}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  autoComplete="off"
                />
              </div>

              <button
                onClick={() => {
                  // [변경] 즉시 선택 대신 검색 결과 노출 (onSearch 호출 제거)
                  const searchResults = searchRegions(keyword);
                  setResults(searchResults);
                  setShowDropdown(true);
                  setActiveIndex(-1);
                }}
                disabled={loading || gpsLoading}
                className="w-11 h-11 bg-white border border-gray-300 text-white rounded-[.5rem] font-semibold flex items-center justify-center hover:bg-white active:scale-95 transition-all group"
              >
                <span className="group-hover:scale-110 transition-transform bg-">
                  <Search size={20} color="#000000" />
                </span>
              </button>
            </div>
          </div>

          {/* [개선] 팝업(onClose 존재)일 때만 고정 영역 UI 적용, 인라인일 때는 기존 드롭다운 유지 */}
          {onClose ? (
            <div className="mt-2 bg-gray-400/20 rounded-[.5rem] overflow-hidden shadow-inner flex flex-col h-[60dvh] min-h-[300px]">
              {results.length > 0 ? (
                <div ref={listRef} className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300">
                  {results.map((region, index) => (
                    <button
                      key={region.code}
                      type="button"
                      onClick={() => handleSelectRegion(region)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSelectRegion(region);
                      }}
                      className={`w-full text-left px-4 py-4 cursor-pointer text-sm font-bold rounded-xl transition-all mb-1 outline-none
                              ${index === activeIndex ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 ring-offset-1" : "text-slate-700 hover:bg-white/60 focus:bg-white/60"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{region.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : keyword.length >= 1 ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-400 text-sm font-bold">
                  <div className="animate-in fade-in zoom-in duration-300">
                    <p className="text-4xl mb-4">🔍</p>
                    <p>검색 결과가 없습니다</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-200 text-sm font-bold">
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <p className="text-4xl mb-4 opacity-20">🏠</p>
                    <p className="text-slate-400">찾으시는 동네를 입력해 주세요</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 인라인 모드: 기존의 절대 위치 드롭다운 방식 */
            showDropdown &&
            results.length > 0 && (
              <div ref={listRef} className="absolute z-50 w-full bg-white/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto p-2">
                {results.map((region, index) => (
                  <button
                    key={region.code}
                    type="button"
                    onClick={() => handleSelectRegion(region)}
                    className={`w-full text-left px-4 py-3 cursor-pointer text-sm font-bold rounded-xl transition-all outline-none
                            ${index === activeIndex ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-300" : "text-slate-700 hover:bg-slate-100 focus:bg-slate-100"}`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            )
          )}

          {/* 인라인 모드 검색 결과 없음 처리 */}
          {!onClose && showDropdown && keyword.length >= 2 && results.length === 0 && (
            <div className="absolute z-50 w-full bg-white/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl mt-2 p-6 text-center text-slate-400 text-sm font-bold">
              검색 결과가 없습니다 🔍
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
