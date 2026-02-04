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
