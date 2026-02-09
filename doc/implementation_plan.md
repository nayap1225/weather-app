---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Advanced Weather Effects
- 요청 요약: 풍향/풍속 연동, 천둥번개 연출, 강수량/강도별 가변 시스템 구축

# [Advanced Environmental Effects Implementation]

## Goal Description

현재의 정적인 기상 표현을 넘어, 실제 데이터(풍속, 풍향, 강수량)에 유기적으로 반응하는 고급 환경 효과를 구현합니다. 비와 눈은 바람의 방향으로 날리고, 번개가 치는 날엔 화면이 번쩍이며 생동감을 더합니다.

## Proposed Changes

### 1. Wind-Driven Particles (풍향/풍속 연동)

- **Data Binding**: 날씨 API의 `WSD`(풍속)와 `VEC`(풍향) 데이터를 입자 애니메이션의 `skew` 및 `translate` 값에 매핑.
- **Physics**: 풍속이 강할수록 비/눈의 낙하 속도가 빨라지고 기울기가 커짐 (최대 30도).
- **Direction**: 풍향이 동풍이면 왼쪽으로, 서풍이면 오른쪽으로 입자가 흐르도록 처리.

### 2. Thunderstorm Flash (천둥번개)

- **Logic**: `PTY`(강수형태)가 번개를 동반하거나 기상 특이사항이 있을 때 활성화.
- **Visual**: `Math.random()`을 사용하여 5~15초 간격으로 매우 짧은(100ms) 화이트 오버레이 노출.
- **Accessibility**: 광과민성 사용자를 고려하여 `prefers-reduced-motion` 설정 시 자동 비활성화.

### 3. Adaptive Intensity (강수 강도)

- **Rain/Snow Count**: `RN1`(1시간 강수량) 값에 따라 입자의 개수를 20개에서 80개까지 동적으로 조절.
- **Density**: 강수량이 많을수록 배경 오버레이의 농도를 높여 시야가 차단되는 느낌 연출.

### 4. Layering Re-Check

- **Z-Index Layering**: Base Grad -> Haze -> Weather Overlay -> **Thunder Flash Layer** -> Particles -> Mascot 순으로 배치.

## Verification Plan

1. **Dynamic Wind Test**: `comprehensive_preview.html`에 풍향/풍속 슬라이더를 추가하여 입자가 의도대로 비스듬히 떨어지는지 확인.
2. **Thunder Frequency**: 번개 효과가 너무 자주 발생하여 불쾌감을 주지 않는지 모니터링.
3. **Data Integrity**: 기상청 API 데이터(`WSD`, `VEC`)가 컴포넌트까지 끊김 없이 전달되는지 체크.

---

# 📅 Archive Updated: 2026-02-04 10:51:38

# 📄 File: implementation_plan.md

---

# 위치 감지 및 표시 오류 수정 계획 (Implementation Plan)

## 1. Goal Description

모바일 환경에서 실제 위치(독산동)와 다르게 '양천구 신정동'으로 표시되는 문제를 해결한다.
이는 좌표 변환(`dfs_xy_conv`)으로 얻은 Grid 좌표가 지형 경계나 오차로 인해 인접한 다른 동네(신정동)로 매핑되면서, Kakao API가 반환한 정확한 주소(독산동)를 덮어쓰기 때문에 발생한다.
또한 `App.tsx`로 정확한 지역 객체가 전달되지 않아 미세먼지/날씨 데이터 조회도 부정확한 지역 기준으로 이루어지는 문제를 수정한다.

## 2. Proposed Changes

### Component: `src/components/LocationPicker.tsx`

#### [MODIFY] `LocationPicker`

1.  **GPS 좌표 매핑 로직 강화 (`handleCurrentLocation`)**
    - Kakao API로 주소를 가져왔으나 `findAllRegionsByNxNy` 매칭에 실패(혹은 불일치)하는 경우, Grid 매칭 결과에 의존하지 않고 **Kakao 주소 기반의 가상 Region 객체**를 생성한다.
    - 생성된 Region 객체를 `onLocationChange`와 `onSearch`에 전달하여 상위 컴포넌트(`App.tsx`)가 정확한 행정구역 명칭을 사용하도록 보장한다.

2.  **상태 덮어쓰기 방지 (`useEffect`)**
    - `gpsCoords` ref를 도입하여 GPS로 설정된 최신 `nx, ny` 좌표를 추적한다.
    - `useEffect`에서 `nx, ny` 변경 감지 시, 만약 현재 상태가 **'GPS/API로 설정된 상태'**(`(현재 위치)` 문구 포함)이고, 좌표가 불변했다면 **Grid 기반 역추적 로직(덮어쓰기)을 실행하지 않도록** 방어 코드를 추가한다.

### Data Flow Impact

- **Before**: GPS -> Lat/Lon -> KakaoAddr(독산) & Grid(신정Grid) -> GridMatch(신정) -> UI Overwrite(신정) & App Search(신정)
- **After**: GPS -> Lat/Lon -> KakaoAddr(독산) -> **Force UI(독산) & Pass Region(독산)** -> UI Preserved

## 3. Verification Plan

### Automated Tests

- N/A (이 프로젝트는 현재 단위 테스트 환경이 구성되어 있지 않음)

### Manual Verification

1.  **PC/Mobile Browser Test (Simulation)**
    - 개발자 도구 > Sensors 탭 > 위치 좌표를 문제의 '독산동' 좌표(또는 경계 지역)로 강제 설정.
      - 독산동 예시 좌표: 37.468, 126.897 (대략적)
    - '현재 위치' 버튼 클릭.
    - **Expectation**:
      - UI에 "서울 금천구 독산동 (현재 위치)" (또는 유사 형식) 표시 유지.
      - "양천구 신정동"으로 바뀌지 않아야 함.
      - 네트워크 탭에서 미세먼지 조회 API가 '독산동' 또는 '금천구' 키워드로 요청되는지 확인.

### User Review Required

- > [!IMPORTANT]
  > 모바일 기기에서의 실제 테스트가 필요합니다. PC 시뮬레이션으로는 GPS 오차 특성을 완벽히 재현하기 어렵습니다. 배포 후 모바일에서 '현재 위치' 버튼 2-3회 반복 클릭하여 주소가 안정적인지 확인 부탁드립니다.


---
# 📅 Archive Updated: 2026. 02. 04. 11:23:19
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 11:32:35
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 11:34:09
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 11:38:19
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 13:52:11
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 13:53:47
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 13:54:15
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 13:54:44
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 13:55:48
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 14:01:06
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 14:03:12
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 14:03:58
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 14:06:50
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 14:13:48
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 14:16:34
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 14:18:43
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 16:13:08
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 16:16:57
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 16:18:34
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 16:28:35
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 04. 18:05:49
# 📄 File: implementation_plan.md
---

# 인라인 검색창 제거 및 UI 슬림화 계획

## Goal Description

팝업 형태의 위치 검색 기능이 도입됨에 따라, 메인 화면 상단에 상시 노출되던 인라인 `LocationPicker`를 제거하여 화면을 더 넓고 깔끔하게 만듭니다. 이제 모든 위치 변경은 날씨 카드의 버튼을 통해 이루어집니다.

## Proposed Changes

### [Component] [App.tsx](file:///d:/myStudy/weather-app/src/App.tsx)

- **인라인 검색창 제거**: `main` 태그 내부의 `LocationPicker` 렌더링 코드를 삭제합니다.
- **초기 위치 감지 이관**: 기존에 `LocationPicker` 마운트 시 수행되던 `autoDetect` 기능을 `App.tsx`의 마운트 `useEffect`로 옮겨, 앱 실행 시 자동으로 현재 위치를 잡도록 유지합니다.

### [Component] [LocationPicker.tsx](file:///d:/myStudy/weather-app/src/components/LocationPicker.tsx)

- `any` 타입으로 지정되었던 `listRef` 관련 린트 에러를 정식 타입 정의로 수정하여 코드 품질을 높입니다.

## Verification Plan

### Manual Verification

1. 앱 접속 시 상단 검색창이 사라지고 바로 날씨 카드가 보이는지 확인.
2. 앱 초기 진입 시 "위치 정보를 받아오고 있어요" 로딩과 함께 위치 감지가 정상 작동하는지 확인.
3. 날씨 카드를 통해 팝업을 열고 위치를 변경하는 전체 흐름이 매끄러운지 최종 점검.

# 위치 검색 UI 및 GPS 정밀도 개선 계획

## Goal Description

1. **검색 UI 고도화**: `LocationPicker`의 검색 결과창을 기존 드롭다운 방식에서 고정된 영역(`height: 60dvh`, `min-height: 300px`)으로 변경하여 가독성과 사용성을 높입니다.
2. **GPS 정밀도 개선**: 사용자가 위치한 '독산동' 대신 '신정동'으로 감지되는 문제를 해결하기 위해 GPS 수집 정밀도를 높이고 실시간 정보를 사용하도록 수정합니다.
3. **코드 안정화**: `App.tsx`에서 발생한 임포트 누락 및 타입 오류를 모두 해결합니다.

## Proposed Changes

### [Component] [LocationPicker.tsx](file:///d:/myStudy/weather-app/src/components/LocationPicker.tsx)

- **엔터(Enter) 및 검색 버튼 동작 변경**:
  - 검색 시 첫 번째 항목을 자동 선택하거나 `onSearch`를 즉시 호출하던 로직을 제거합니다.
  - 이제 엔터나 버튼 클릭 시에는 단순히 검색 결과 목록을 하단 박스에 갱신/표시하기만 합니다.
- **지역 선택 로직 유지**:
  - 목록에 나타난 지역명을 **직접 클릭**하거나, 화살표로 이동 후 엔터를 쳤을 때만 실제 위치가 반영되고 팝업이 닫히도록 합니다.
- **접근성 유지**: 탭(Tab) 이동 및 키보드 화살표 내비게이션 기능을 강화된 상태로 유지합니다.
- 검색 결과 영역(`div`)을 조건부 렌더링이 아닌 **상시 노출(고정 영역)**로 변경.
- 리스트가 없을 때(초기 상태) 및 검색 결과가 없을 때의 UI 분기 처리:
  - 초기 상태: "동네 이름을 입력해 보세요" 안내 문구 노출.
  - 결과 없을 때: "검색 결과가 없습니다" 안내 문구 노출.
- 높이 설정 유지: `h-[60dvh] min-h-[300px]`.
- 팝업 내 스크롤 정책 최적화.
- 검색 결과 리스트(`ul`) 스타일 수정:
  - `absolute` 제거 및 부모 레이아웃 내 고정 배치.
  - 클래스 추가: `h-[60dvh] min-h-[300px] overflow-y-auto`.
- 검색 결과가 없을 때의 안내 문구도 해당 영역 내에 정렬되도록 수정.

### [Component] [App.tsx](file:///d:/myStudy/weather-app/src/App.tsx)

- `onSearch`가 `LocationPicker`의 검색 버튼에서 직접 호출되지 않도록 조정하여 의도치 않은 날씨 정보 갱신을 방지합니다.
- `onSearch`는 위치가 최종 확정되었을 때만 실행됩니다.
- `searchRegions` 임포트 및 `Region` 타입 관련 잔여 린트 에러 해결.
- GPS 정밀도 옵션 최종 확인.
- `searchRegions` 임포트 추가 및 `Region` 타입 적용.
- `detectCurrentLocation` 내 GPS 옵션 강화 (`enableHighAccuracy: true`, `maximumAge: 0`).
- 위치 감지 실패 시 사용자 알림(alert) 추가.

## Verification Plan

### Manual Verification

1. 팝업에서 지역 검색 시 결과창이 넓게(`60dvh`) 나타나는지 확인.
2. 목록이 300px 이상의 높이를 유지하며 스크롤이 잘 되는지 확인.
3. 📍 버튼 클릭 시 '독산동' 등 현재 위치를 정확하게 잡아오는지 확인.


---
# 📅 Archive Updated: 2026. 02. 04. 18:12:51
# 📄 File: implementation_plan.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

# [Goal Description]

날씨 API를 호출할 때 사용되는 위치 좌표(`nx`, `ny`)를 콘솔에 출력하여, 현재 어떤 위치 정보를 기반으로 데이터를 요청하는지 확인합니다.

## User Review Required

없음.

## Proposed Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst` 함수 진입부에 `console.log("[API] getUltraSrtNcst - nx:", nx, "ny:", ny)` 추가
- `getVilageFcst` 함수 진입부에 `console.log("[API] getVilageFcst - nx:", nx, "ny:", ny)` 추가

## Verification Plan

### Manual Verification

1. `npm run dev` 실행
2. 브라우저 개발자 도구(F12) 콘솔 탭 확인
3. 날씨 정보 로딩 시 `[API] ... - nx: ... ny: ...` 로그가 출력되는지 확인


---
# 📅 Archive Updated: 2026. 02. 09. 10:55:28
# 📄 File: implementation_plan.md
---

# [목표] 접이식 우산 추천 기준 상향

## 문제 상황

사용자가 현재 접이식 우산이 추천되는 기준(강수확률 30% 이상)이 너무 낮다고 판단했습니다.
조금 더 확실한 비 소식일 때만 추천되기를 원합니다.

## 변경 제안

### `src/utils/itemUtils.ts`

- 접이식 우산 추천 조건 변경: `pop >= 30` -> `pop >= 50`

```typescript
// (기존)
const isWeakRain = !isRaining && !isRainForecast && (pop >= 30 || ptyCode === 5);

// (변경)
const isWeakRain = !isRaining && !isRainForecast && (pop >= 50 || ptyCode === 5);
```

## 이전 변경 사항 (완료됨)

### `src/App.tsx` (완료)

- 강수확률(`maxPop`) 계산 시 오늘 날짜의 예보만 사용하도록 수정됨.


---
# 📅 Archive Updated: 2026. 02. 09. 12:31:45
# 📄 File: implementation_plan.md
---

# [목표] 준비물 옵셔널 로직 전면 개편

## 배경

사용자가 날씨별 준비물(특히 **옵셔널**)에 대한 구체적인 매핑 테이블을 제공했습니다.
기존의 파편화된 옵셔널 로직을 통합하고, 사용자가 요청한 항목들을 추가/수정합니다.

## 변경 제안

### `src/utils/itemUtils.ts`

`getRecommendedItems` 함수의 **2️⃣ 옵셔널 준비물** 섹션을 전면 수정합니다.

#### 1. 기존 로직 유지 (Required)

- 필수 준비물(우산, 미끄럼 방지 신발, 방한용품 등)은 기존 로직을 유지합니다.

#### 2. 신규 옵셔널 로직 (Optional)

사용자 요청 매핑을 적용합니다. (중복 방지 처리 포함)

| 날씨/상황          | 조건                            | 옵셔널 아이템                       |
| :----------------- | :------------------------------ | :---------------------------------- |
| **비**             | Rain, Shower, POP >= 60         | 접이식 우산, 여분 양말, 방수 파우치 |
| **눈/폭설**        | Snow, Rain/Snow                 | 핫팩, 여분 양말                     |
| **한파**           | Temp <= -10 or FeelsLike <= -12 | 귀마개, 비니, 핫팩                  |
| **폭염**           | Temp >= 33                      | 쿨타월, 휴대용 선풍기, 여분 손수건  |
| **미세먼지**       | PM10 >= 3 (나쁨)                | 인공눈물, 립밤                      |
| **자외선**         | UV >= 6 (높음)                  | 선크림, 선글라스, 챙 있는 모자      |
| **일교차**         | DiffTemp >= 10                  | 여벌 겉옷, 가디건, 숄/스카프        |
| **강풍**           | Wind >= 9                       | 얇은 스카프, 휴대용 바람막이        |
| **밤 외출**        | isNight                         | 얇은 겉옷, 보온 소품                |
| **(기존) 약한 비** | POP 50~59                       | 접이식 우산                         |

> [!NOTE]
>
> - "접이식 우산"은 강수확률 50~59% 구간(약한 비 예보)에서도 추천됩니다.
> - "밤 외출"은 기온이나 계절감을 고려하여 너무 덥지 않을 때만 추천하도록 예외 처리를 유지/보완합니다.

#### 3. 중복 제거

- `Set` 또는 `id` 검사를 통해 동일 아이템이 중복 추가되지 않도록 합니다.
- 예: 한파 + 눈 올 때 `핫팩`이 중복되지 않게 처리.

## 검증 계획

1.  코드를 수정한 후 `npm run dev` 확인.
2.  (로컬 테스트) `src/App.tsx` 또는 `itemUtils.ts`에서 모의 데이터(mock conditions)를 넣어 각 날씨별로 옵셔널 아이템이 잘 뜨는지 확인.


---
# 📅 Archive Updated: 2026. 02. 09. 12:37:31
# 📄 File: implementation_plan.md
---

# [목표] 월별 상시 추천 준비물 추가 (중복 방지 포함)

## 배경

특별한 기상 악화(비, 눈, 폭염 등)가 없는 날에도, 계절과 시기에 맞는 유용한 아이템을 추천하여 **"준비물 0개"인 상황을 최소화**합니다.

## 제안: 월별 추천 아이템 매핑

| 월       | 계절감      | 추천 아이템 (옵셔널)          |
| :------- | :---------- | :---------------------------- |
| **1월**  | 한겨울      | 립밤, 핸드크림                |
| **2월**  | 늦겨울      | 립밤, 핸드크림                |
| **3월**  | 환절기      | 핸드크림, 마스크              |
| **4월**  | 봄          | 알러지 약, 마스크, 물티슈     |
| **5월**  | 나들이      | 가벼운 물병, 물티슈           |
| **6월**  | 초여름      | 데오드란트, 파우더 시트       |
| **7월**  | 장마/무더위 | 텀블러(얼음물), 부채          |
| **8월**  | 한여름      | 텀블러(얼음물), 쿨링 스프레이 |
| **9월**  | 초가을      | 미스트, 얇은 가디건           |
| **10월** | 가을        | 핸드크림, 립밤                |
| **11월** | 늦가을      | 핸드크림, 온열 안대           |
| **12월** | 겨울        | 립밤, 핫팩                    |

## 구현 로직 (`src/utils/itemUtils.ts`)

1.  **날씨별 아이템 우선 추가**: 비, 눈, 미세먼지 등에 따른 아이템을 먼저 리스트에 담습니다.
2.  **월별 아이템 추가 시 검사**:
    - 현재 월(`Month`)에 해당하는 아이템을 확인합니다.
    - **중복 체크 (`addedIds.has(id)`)**: 이미 리스트에 있는 아이템이라면 추가하지 않습니다.
    - **개수 제한 (선택적)**: 옵셔널 아이템이 너무 많으면(예: 4개 이상) 월별 아이템은 생략할 수도 있습니다. (일단은 다 보여주되 중복만 방지)

## 기대 효과

- 필수/옵셔널 아이템과 겹치는 경우, 날씨 정보를 우선시하여 자연스럽게 중복이 제거됩니다.
- 맑은 날에도 적절한 추천을 제공합니다.


---
# 📅 Archive Updated: 2026. 02. 09. 12:44:18
# 📄 File: implementation_plan.md
---

# [목표] 행정동 검색 편의성 개선

## 문제 상황

사용자가 "구로동"과 같이 일반적인 법정동 명칭으로 검색했을 때, 실제 데이터셋에 "구로제1동", "구로제2동"과 같은 행정동 명칭만 존재하여 검색 결과가 나오지 않는 문제가 있습니다.

## 변경 제안

### `src/utils/regionUtils.ts`

`searchRegions` 함수의 검색 로직을 보완합니다.

#### 1. 스마트 동 검색 정규식 도입

- 검색어가 "OO동"으로 끝나는 경우, `OO(숫자/제/본/.)동` 패턴을 허용하는 정규식을 생성하여 추가 매칭을 시도합니다.
- **허용 패턴**: 숫자(`0-9`), `제`, `본`, `.` (점), 공백
- **예시**:
  - 검색어: `구로동` (Base: `구로`)
  - 매칭 패턴: `^구로[0-9제본.]*동$`
  - 매칭 결과: `구로제1동` (O), `구로2동` (O), `구로동` (O)
  - 비매칭: `구로디지털동` (X) -> 중간에 다른 글자가 섞이면 매칭 안 함 (오탐 방지)

#### 2. 코드 변경 계획

```typescript
// 정규식 이스케이프 함수 추가
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const searchRegions = (keyword: string, limit: number = 30): Region[] => {
  // ... (기존 정규화 로직)

  // 스마트 동 검색 패턴 생성
  let smartDongRegex: RegExp | null = null;
  if (normalizedKeyword.endsWith("동") && normalizedKeyword.length > 2) {
    // 2글자 초과일 때만 (예: "구로동" -> 3글자)
    // "일동" 처럼 너무 짧은 건 제외하거나 정책 결정. 일단 2글자 초과 권장.
    // 사용자 예시는 "구로동".
    const base = normalizedKeyword.slice(0, -1);
    smartDongRegex = new RegExp(`^${escapeRegExp(base)}[0-9\\s제본\\.]*동$`);
  }

  const candidates = allRegions.filter((region) => {
    // ... (기존 필터링) ...
    // OR 조건으로 Smart Regex 추가
    if (smartDongRegex && smartDongRegex.test(s3Name)) return true;
    return false;
  });

  // ...
  return candidates;
};
```

## 검증 계획

1.  앱 실행 후 위치 찾기 팝업에서 "구로동" 입력.
2.  결과 목록에 "구로제1동", "구로제2동" 등이 나타나는지 확인.
3.  "신사동" 입력 시 엉뚱한 "신동" 관련 지역이 나오지 않는지(기존 로직 유지) 확인.


---
# 📅 Archive Updated: 2026. 02. 09. 12:46:53
# 📄 File: implementation_plan.md
---

# [목표] 메인 화면 지역명 간소화

## 문제 상황

행정동 명칭(예: "구로제1동", "창신2동")이 메인 카드에 그대로 노출되어 깔끔하지 않다는 의견이 있습니다.
사용자는 "구로동", "창신동"과 같이 친숙한 법정동 스타일의 표기를 원합니다.

## 변경 제안

### 1. 포맷팅 함수 추가 (`src/utils/regionUtils.ts` 또는 내부 헬퍼)

행정동 명칭에서 불필요한 수식어를 제거하는 로직을 구현합니다.

- **패턴**: `제` + `숫자` + `동` 또는 `숫자` + `동` 또는 `본동`
- **변환**:
  - `구로제1동` -> `구로동`
  - `구로2동` -> `구로동`
  - `구로본동` -> `구로동`
  - `신사1동` -> `신사동`

### 2. `WeatherNowCard.tsx` 수정

`locationName` prop을 렌더링할 때, 위 포맷팅 함수를 적용하여 표시합니다.

```typescript
// 예시 로직
const formatDongName = (name: string) => {
  // 1. 괄호 제거 (전체 주소일 경우)
  // 2. 동 이름 포맷팅
  // "구로제1동" -> "구로동"
  return name.replace(/제?[0-9]*동$/, "동").replace(/본동$/, "동");
  // 좀 더 정교한 정규식 필요: /([가-힣]+)(제?[0-9]+|본)동/ -> "$1동"
};
```

## 검증 계획

- 앱 실행 후 "구로제1동"을 선택했을 때 메인 카드에 "구로동"이라고 뜨는지 확인.
- "역삼1동" -> "역삼동" 확인.


---
# 📅 Archive Updated: 2026. 02. 09. 13:01:23
# 📄 File: implementation_plan.md
---

# [목표] 헤더 강제 새로고침 버튼 추가

## 배경

사용자가 "현재 위치 및 날씨 정보"를 강제로 갱신하고 싶을 때 사용할 수 있는 버튼을 **헤더**에 추가합니다.
이 버튼은 **저장된 캐시를 삭제**하고 API를 다시 호출하여 무조건 최신 데이터를 가져옵니다.

## 변경 제안

### 1. `src/utils/apiCache.ts`

캐시 삭제 함수 추가.

```typescript
export const clearApiCache = () => {
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  });
};
```

### 2. `src/App.tsx`

`detectCurrentLocation` 수정 및 핸들러 전달.

```typescript
const handleRefresh = useCallback(() => {
  // 강제 새로고침 모드로 호출
  detectCurrentLocation(true);
}, [detectCurrentLocation]);

// ...
<HeaderLayout onRefresh={handleRefresh} isLoading={gpsLoading || loading} />
```

### 3. `src/components/layout/Header.tsx`

`onRefresh` prop을 추가하고 버튼을 배치합니다.

```typescript
import { RotateCw } from "lucide-react";

interface Props {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function HeaderLayout({ onRefresh, isLoading }: Props) {
  return (
    <header className="flex items-center justify-between ..."> {/* justify-between으로 변경 고려 */}
       {/* 로고 영역 */}
       <div className="flex items-center gap-4 ...">...</div>

       {/* 새로고침 버튼 */}
       <button onClick={onRefresh} disabled={isLoading} className="...">
         <RotateCw size={24} className={isLoading ? "animate-spin" : ""} />
       </button>
    </header>
  );
}
```

## 검증 계획

- 헤더 우측에 새로고침 아이콘이 생겼는지 확인.
- 클릭 시 아이콘이 회전하며 로딩 상태가 되는지 확인.
- 콘솔 로그 및 네트워크 탭에서 캐시가 삭제되고 API가 재호출되는지 확인.
