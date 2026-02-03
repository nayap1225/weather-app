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
