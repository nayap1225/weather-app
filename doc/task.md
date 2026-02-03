---

### 🔄 실행 기록

- 날짜: 2026-02-03
- 워크플로우: Advanced Weather Effects
- 요청 요약: 풍향/풍속 연동, 천둥번개 효과, 강수 강도별 가변 시스템 구축

- [ ] **Advanced Environmental Integration**
  - [x] Create/Update implementation plan
  - [/] Wind-Reactive Particle System
    - [ ] Extract WSD(풍속) and VEC(풍향) from weather data
    - [ ] Update `RainDrop` & `SnowFlake` with tilt/speed physics
  - [/] Thunderstorm Implementation
    - [ ] Create flash overlay logic in `WeatherBackground.tsx`
    - [ ] Trigger random subtle flashes for TMY/Thunder status
  - [/] Precipitation Intensity Scaling
    - [ ] Scale particle count based on RN1(1시간 강수량) data
  - [ ] Update `comprehensive_preview.html` with Wind/Thunder controls
- [ ] Final Verification
