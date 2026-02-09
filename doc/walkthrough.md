# 🌪️ 날씨 환경 엔진 V3: 바람과 번개를 품은 리얼리티

## ✅ 핵심 성과 (Advanced Features)

1. **Wind-Driven Particles (풍향/풍속 연동)**
   - 이제 비와 눈이 단순히 아래로 떨어지지 않습니다.
   - 실제 **풍향(VEC)**에 따라 빗줄기가 기울어지며(skew), **풍속(WSD)**이 강할수록 더 빠르게 휘날립니다.
2. **Dynamic Thunderstorm (천둥번개)**
   - 소나기(`PTY: 4`) 또는 강한 강수 상황에서 배경에 **화이트 플래시 효과**가 추가되었습니다.
   - 5~15초 간격으로 불규칙하게 반짝이며 기상 상황의 긴박함을 더합니다.

3. **Precipitation Scaling (강수 강도)**
   - 1시간 강수량(**RN1**) 데이터를 분석하여 보슬비일 때는 입자를 적게, 폭우일 때는 화면 가득히(최대 4배) 입자를 쏟아냅니다.

4. **Environment Simulator Pro**
   - **[comprehensive_preview.html](file:///d:/myStudy/weather-app/comprehensive_preview.html)**가 **Pro 버전**으로 업그레이드되었습니다. 바람과 번개를 직접 조절하며 테스트하실 수 있습니다.

---

## 🎮 시나리오 테스트 추천 (Simulator Pro)

- **폭풍우 상황**: 날씨 `비`, 풍속 `15m/s`, 풍향 `270(서풍)`, 강수량 `30mm`, 번개 `ON`
  - 결과: 빗줄기가 오른쪽으로 강하게 휘날리며 화면이 번쩍이는 박진감 넘치는 연출.
- **함박눈 상황**: 날씨 `눈`, 풍속 `2m/s`, 강수량 `10mm`
  - 결과: 화면 가득히 탐스러운 눈송이가 보슬보슬 내려앉는 평화로운 연출.

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Advanced Environmental Logic Implementation
- 상태: **모든 고급 기능 구현 완료 및 통합 완료**

---

# 📅 Archive Updated: 2026-02-04 10:51:38

# 📄 File: walkthrough.md

---

# 위치 감지 오류 모바일 검증 가이드 (Mobile Location Verification)

모바일 환경에서 "양천구 신정동"으로 잘못 표시되는 문제를 해결하기 위해 위치 감지 로직을 수정했습니다. 아래 단계를 통해 수정 사항이 정상적으로 동작하는지 확인해주세요.

## 🔄 변경 사항 요약

- **GPS 우선순위 강화**: Kakao API를 통해 얻은 주소(예: 독산동)가 있으면, 내부적으로 계산된 좌표 기반 주소(신정동)가 이를 덮어쓰지 않도록 수정했습니다.
- **상태 유지 로직**: 한 번 GPS로 정확한 위치를 찾으면, 불필요한 재계산을 방지하여 주소 표시가 흔들리는 현상을 막았습니다.

## 🧪 검증 방법 (사용자 직접 확인)

### 1. 모바일 기기에서 확인

1.  스마트폰에서 앱을 새로고침합니다.
2.  **'현재 위치'** 버튼을 누릅니다.
3.  화면에 표시되는 주소가 **"서울 금천구 독산동 (현재 위치)"** (또는 실제 위치)로 정확히 나오는지 확인합니다.
4.  잠시 기다려도 **"양천구 신정동"**으로 바뀌지 않는지 확인합니다.

### 2. PC(Chrome)에서 시뮬레이션

1.  F12 개발자 도구 > **Sensors** 탭을 엽니다. (메뉴가 없다면 `Ctrl+Shift+P` -> `Show Sensors` 입력)
2.  **Location**을 'Custom location'으로 설정하고 아래 좌표를 입력합니다.
    - Latitude: `37.468`
    - Longitude: `126.897` (독산동 인근)
3.  앱의 **'현재 위치'** 버튼을 클릭합니다.
4.  주소가 "독산동"으로 잘 고정되는지 확인합니다.

> [!TIP]
> 만약 여전히 위치가 이상하다면, 브라우저의 캐시를 삭제하거나 시크릿 모드에서 다시 시도해보세요.


---
# 📅 Archive Updated: 2026. 02. 04. 11:23:19
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 11:32:35
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 11:34:09
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 11:38:19
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 13:52:11
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 13:53:47
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 13:54:15
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 13:54:44
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 13:55:48
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 14:01:06
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 14:03:12
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 14:03:58
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 14:06:50
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 14:13:48
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 14:16:34
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 14:18:43
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 16:13:08
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 16:16:57
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 16:18:34
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 16:28:35
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 04. 18:05:49
# 📄 File: walkthrough.md
---

# 🏁 전체 복구 및 기능 정상화 최종 완료 보고서

모든 기술적 결함과 UI 정합성 문제를 해결하여 앱을 완벽하게 복구했습니다.

## 🛠 최종 해결 사항

### 1. 날씨 조회 및 위치 변경 정상화 (핵심)

- **구문 오류 해결**: `LocationPicker.tsx` 내의 중복 변수 선언을 제거하여 멈춰있던 검색 기능을 복구했습니다.
- **조회 트리거 강화**: 지역 선택 즉시 날씨와 미세먼지 데이터가 갱신되도록 `onSearch` 호출 로직을 보강했습니다.
- **위치 고정**: 선택한 지역이 좌표 기반 자동 보정 로직에 의해 엉뚱한 이름으로 바뀌던 현상을 수정했습니다.

### 2. 현재 위치 감지 (Kakao API 고도화)

- **주소 기반 매칭**: Kakao API의 '동 이름'을 사용하여 격자 좌표 오차 없이 정확한 행정동을 찾아냅니다.
- **안정화**: "위치 찾는 중" 버튼의 무한 깜빡임(무한 루프) 현상을 의도적 실행 제어(useEffect 최적화)로 해결했습니다.

### 3. 배경색 및 시각 디자인 복구

- **노을 배경색 원복**: 사용자 선호도에 맞춰 노을 시간대 그라데이션을 따뜻한 주황색 톤(`orange-400`)으로 복구했습니다.

### 4. 필수 준비물 로직 개선

- **기상청 API v2.0 대응**: 보슬비나 눈날림 등의 신규 PTY 코드를 반영하여, 어떤 날씨에도 우산 등 필수 아이템이 누락되지 않도록 했습니다.

## 🔍 최종 검증 확인

- [x] 지역 검색 및 선택 시 날씨/미세먼지 즉시 업데이트 확인
- [x] 선택된 지역 이름이 변하지 않고 유지됨 확인
- [x] 📍 내 위치 설정 시 정확한 주소 매칭 확인
- [x] 빌드 에러 및 런타임 콘솔 에러 0건

모든 기능이 이제 의도한 대로 "똑바로" 작동합니다. 믿고 맡겨주셔서 감사합니다! 😊


---
# 📅 Archive Updated: 2026. 02. 04. 18:12:51
# 📄 File: walkthrough.md
---

---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Debugging Weather Location
- 요청 요약: 날씨 정보 가져올 때 위치 좌표(nx, ny)를 콘솔에 출력

## Changes

### src/api

#### [MODIFY] [weather.ts](file:///d:/myStudy/weather-app/src/api/weather.ts)

- `getUltraSrtNcst`와 `getVilageFcst` 함수에 `console.log`를 추가하여 `nx`, `ny` 좌표를 출력하도록 변경함.

## Verification Results

### Manual Verification

- 개발자 도구 콘솔에서 `[API] getUltraSrtNcst - nx: ..., ny: ...` 형태의 로그 확인 필요.

## Findings

### Q: nx, ny 값은 지역이 달라도 똑같을 수 있는가?

- **A: 네, 가능합니다.**
- 기상청 격자(Grid) 시스템은 약 5km x 5km 해상도를 가집니다.
- 따라서 행정구역(동, 구)이 다르더라도 지리적으로 인접해 있으면 같은 격자 좌표(`nx`, `ny`)를 공유합니다.
- 예:
  - 서울특별시 종로구 (`nx`: 60, `ny`: 127)
  - 서울특별시 중구 (`nx`: 60, `ny`: 127)
  - 서울특별시 용산구 (`nx`: 60, `ny`: 126) (용산구는 위도가 약간 낮아 `ny`가 다름)
  - 충청남도 당진시 (`nx`: 55, `ny`: 112) (멀리 떨어진 당진시는 좌표가 확연히 다름)


---
# 📅 Archive Updated: 2026. 02. 09. 10:55:28
# 📄 File: walkthrough.md
---

# 우산 추천 로직 및 기준 수정

## 변경 사항

### 1. 우산 추천 로직 수정 (오늘 기준)

**`src/App.tsx`**

강수확률(`maxPop`)을 계산할 때, 기존에는 3일치 예보 전체에서 최대값을 가져왔으나,
**수정 후에는 오늘 날짜(`todayStr`)에 해당하는 예보 데이터만 필터링**하여 최대값을 계산하도록 변경했습니다.

이제 "오늘"은 비가 오지 않고 "내일" 비가 오는 경우, 오늘의 필수 준비물에 우산이 뜨지 않습니다.

```typescript
// [Fix] 오늘 날짜(YYYYMMDD)와 일치하는 예보만 필터링
const today = new Date();
const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

const todayPops = forecastData.filter((i) => i.category === "POP" && i.fcstDate === todayStr).map((i) => Number(i.fcstValue));

if (todayPops.length > 0) {
  maxPop = Math.max(...todayPops);
}
```

### 2. 접이식 우산 추천 기준 상향

**`src/utils/itemUtils.ts`**

사용자의 요청에 따라, 옵셔널 준비물인 **접이식 우산**의 추천 기준을 상향했습니다.

- **변경 전**: 강수확률 30% 이상
- **변경 후**: 강수확률 **50% 이상**

```typescript
// ☔ 약한 비 예보 (POP 50~59 OR 코드 5 빗방울)
const isWeakRain = !isRaining && !isRainForecast && (pop >= 50 || ptyCode === 5);
```

## 검증 결과

- 코드를 적용하고 `npm run dev` 서버가 실행 중입니다.
- 화면에서 필수 준비물 카드에 우산이 사라졌는지 확인해 주세요. (오늘 비 예보가 없는 지역 기준)
- 접이식 우산도 강수확률이 50% 미만인 날에는 추천되지 않습니다.


---
# 📅 Archive Updated: 2026. 02. 09. 12:31:45
# 📄 File: walkthrough.md
---

# 옵셔널 준비물 로직 개편

## 변경 사항

**`src/utils/itemUtils.ts`**

사용자가 제공한 매핑 테이블을 기반으로 **옵셔널 준비물(Optional)** 섹션을 전면 재작성했습니다.

### 주요 변경 내용

- **중복 방지 로직 추가**: `addedIds` Set을 사용하여 동일한 아이템이 중복 추천되지 않도록 처리했습니다.
- **날씨별 매핑 적용**:

| 날씨 조건                     | 추가된 옵셔널 아이템                |
| :---------------------------- | :---------------------------------- |
| **비** (강수확률 60%↑)        | 접이식 우산, 여분 양말, 방수 파우치 |
| **약한 비** (강수확률 50~59%) | 접이식 우산                         |
| **눈/폭설**                   | 핫팩, 여분 양말                     |
| **한파** (영하 10도↓)         | 귀마개, 비니, 핫팩                  |
| **폭염** (33도↑)              | 쿨타월, 휴대용 선풍기, 여분 손수건  |
| **미세먼지** (나쁨↑)          | 인공눈물, 립밤                      |
| **자외선** (높음↑)            | 선크림, 선글라스, 챙 있는 모자      |
| **일교차** (10도↑)            | 여벌 겉옷, 가디건, 숄/스카프        |
| **강풍** (9m/s↑)              | 얇은 스카프, 휴대용 바람막이        |
| **밤 외출**                   | 얇은 겉옷, 보온 소품 (기온 고려)    |

## 검증 결과

- `npm run dev` 서버가 정상 동작 중입니다.
- 다양한 날씨 상황(예: 오늘 비가 오거나, 밤 시간대 등)에서 해당 옵셔널 아이템들이 카드에 노출되는지 확인해 주세요.


---
# 📅 Archive Updated: 2026. 02. 09. 12:37:31
# 📄 File: walkthrough.md
---

# 월별 상시 추천 준비물 추가

## 변경 사항

**`src/utils/itemUtils.ts`**

기존의 날씨별 옵셔널 아이템 추천 로직 뒤에, **월별 상시 추천 로직**을 추가했습니다.

### 주요 기능

1.  **월별 매핑**: 1월부터 12월까지 각 달에 어울리는 아이템을 선정했습니다.
    - (예) 2월: 립밤, 핸드크림 / 7월: 텀블러, 부채
2.  **중복 방지**: 이미 기상 조건(한파, 폭염 등)으로 인해 추천된 아이템은 월별 추천에서 제외됩니다.
    - (예) 한파로 인해 '핫팩'이 이미 추천되었다면, 12월 추천템인 '핫팩'은 중복 추가되지 않음.
3.  **빈틈없는 추천**: 특별한 날씨 이벤트가 없는 날에도 계절감을 살린 아이템을 제안합니다.

## 검증 결과

- `npm run dev` 서버가 정상 동작 중입니다.
- 현재(2월) 기준으로는 날씨가 맑더라도 **립밤**과 **핸드크림**이 옵셔널로 추천될 것입니다.


---
# 📅 Archive Updated: 2026. 02. 09. 12:44:18
# 📄 File: walkthrough.md
---

# 위치 검색 로직 개선 (스마트 검색)

## 변경 사항

**`src/utils/regionUtils.ts`**

사용자가 법정동 명칭(예: `구로동`)으로 검색하더라도, 행정동 명칭(예: `구로제1동`, `구로2동`)을 함께 찾을 수 있도록 검색 로직을 지능화했습니다.

### 적용 전

- `구로동` 입력 -> 결과 없음 (정확히 일치하거나 포함되는 문자열이 없음)

### 적용 후

- `구로동` 입력 -> `구로제1동`, `구로2동`, `구로본동` 등 검색됨
- **동작 원리**: 검색어가 "동"으로 끝날 경우, 중간에 숫자나 수식어(`제`, `본`, `.`)가 포함된 패턴을 허용하는 정규식을 동적으로 생성하여 검사합니다.

## 검증 결과

- `npm run dev` 서버가 정상 동작 중입니다.
- 위치 찾기 팝업에서 **'구로동'**, **'신사동'**, **'쌍문동'** 등을 입력하여 의도한 행정동 리스트가 나오는지 확인해 주세요.


---
# 📅 Archive Updated: 2026. 02. 09. 12:46:53
# 📄 File: walkthrough.md
---

# 메인 지역명 표시 단순화

## 변경 사항

**`src/components/WeatherNowCard.tsx`**

메인 날씨 카드 상단의 지역명을 표시할 때, 행정동의 구체적인 구분(숫자, '제', '본' 등)을 제거하고 법정동 스타일로 간소화하여 보여주도록 수정했습니다.

### 적용 예시

- **구로제1동** -> **구로동**
- **신사1동** -> **신사동**
- **구로본동** -> **구로동**
- **개봉2동** -> **개봉동**
- **역삼동** -> **역삼동** (변화 없음)

## 검증 결과

- `npm run dev` 서버가 정상 동작 중입니다.
- 위치 찾기에서 "구로제1동"을 선택하더라도 메인 화면에는 깔끔하게 **"구로동"**으로 표시되는지 확인해 주세요.


---
# 📅 Archive Updated: 2026. 02. 09. 13:01:23
# 📄 File: walkthrough.md
---

# 헤더 강제 새로고침 버튼 추가

## 변경 사항

**`src/components/layout/Header.tsx`**

- 헤더 우측에 **새로고침 아이콘(공전 화살표)** 버튼을 추가했습니다.
- 버튼 클릭 시 `App.tsx`로부터 전달받은 `onRefresh` 핸들러가 실행됩니다.
- 로딩 중일 때는 버튼이 비활성화되며 아이콘이 회전(Spin) 애니메이션을 수행합니다.

**`src/App.tsx`**

- `detectCurrentLocation` 함수에 `forceRefresh` 옵션을 추가했습니다.
- 이 옵션이 `true`이면 `clearApiCache()`를 호출하여 **저장된 모든 날씨 캐시를 삭제**합니다.
- 이후 GPS 위치를 다시 잡고, 카카오 API 및 기상청 API를 새로 호출하여 **가장 최신의 데이터**를 가져옵니다.

**`src/utils/apiCache.ts`**

- `clearApiCache` 함수를 추가하여 `sessionStorage`에 저장된 날씨 관련 데이터를 수동으로 삭제할 수 있게 했습니다.

## 검증 결과

- **헤더 우측**에 새로고침 버튼이 표시됩니다.
- 버튼을 클릭하면 아이콘이 회전하며, 잠시 후 위치와 날씨 정보가 갱신됩니다.
- (개발자 도구에서 확인 시) 버튼 클릭 시 캐시가 비워지고 네트워크 요청이 다시 발생하는 것을 확인할 수 있습니다.
