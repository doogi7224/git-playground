# Gearwood: The Broken Spring (기어우드: 파괴된 태엽)

React Native(Expo)로 만든 사이드스크롤 플랫포머 게임입니다. 반기계 정령 스프라우트가 되어 좌우로 이동하고 점프해서 코그마이트를 밟아 처치하고, 코인을 모아 기어숲의 깃발까지 도달하면 클리어됩니다. (기획 배경은 [GEARWOOD 기획서](./docs/gearwood-design-doc.md) 참고)

## 실행 방법

```bash
npm install
npm run start   # Expo 개발 서버 실행 (QR코드로 Expo Go에서 실행)
npm run android # 안드로이드 에뮬레이터/기기
npm run ios     # iOS 시뮬레이터 (macOS 필요)
npm run web     # 웹 브라우저에서 실행
```

## 조작법

- 화면 좌하단 ◀ / ▶ 버튼: 좌우 이동
- 화면 우하단 ▲ 버튼: 점프
- 적을 위에서 밟으면 처치, 옆에서 부딪히면 목숨 감소
- 코인을 모두 모으고 깃발에 도착하면 클리어

## 프로젝트 구조

```
src/
  game/
    constants.ts   # 물리/게임 상수
    types.ts       # 타입 정의
    level.ts       # 레벨(지형, 적, 코인, 깃발) 데이터
    physics.ts      # 게임 루프 업데이트 로직 (충돌 처리 등)
  components/       # 플레이어, 적, 코인, 발판, 깃발, 조작 버튼, HUD 렌더링
  screens/
    StartScreen.tsx # 시작 화면
    GameScreen.tsx  # 실제 게임 화면 (게임 루프 실행)
App.tsx             # 화면 전환
```
