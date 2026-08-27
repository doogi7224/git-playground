# AI Collaboration Board

> 운영 규칙은 `CLAUDE_CODEX_COLLAB_PROMPT.md` 참고. 최신 사용자 결정: **Codex = 게임 기획·디자인 디렉터·UI/아트 구현 책임자**, **Claude Code = 메인 시스템 구현·테스트 책임자**. 최신 게임 방향은 `GAME_DIRECTION_V2.md`가 기준이다.

## CURRENT STATUS
- 현재 빌드/실행 상태: 정상. `npx tsc --noEmit` 통과(에러 0). 브랜치 `claude/game-app-development-thc8pw`, working tree clean, 최신 커밋 `9765bf5 Add portal + boss encounter logic (no art yet, placeholder rendering)`.
- 현재 우선순위: (1) 보스 아트를 placeholder에서 실제 일러스트로 교체(Codex), (2) 보스전 난이도 실플레이 검증(사람), (3) HUD/컨트롤 등 남은 UI 고급화(Codex, CLAUDE.md 19장 Phase 2~).
- 알려진 차단 요소: 이미지 생성 크레딧 부족(19.8 크레딧, 이전 세션 확인)으로 신규 대량 아트 제작이 제한적 — Codex가 무료 에셋(Kenney.nl 등) 또는 소량 생성으로 우회할지 사용자와 조율 필요. Claude 세션 환경은 kenney.nl 등 외부 네트워크가 egress 정책으로 차단된 적 있음(Codex 환경은 다를 수 있음, 확인 필요).

## PROJECT ANALYSIS (Claude, 최초 분석)

### 기술 구조 요약
- 스택: React Native + Expo (Expo SDK 57), TypeScript strict, `expo-linear-gradient`. 상태관리 라이브러리 없음 — React `useState` + 순수 함수 게임 로직.
- 저장/영속화: 없음. 서버/API 없음. 완전 클라이언트 사이드, 세션 메모리 상태만 존재(재시작 시 초기화). "저장/불러오기" 기능 자체가 프로젝트 범위에 없음.
- 실행: `npm run web` / `start` / `android` / `ios` (Expo). 자동 테스트 스위트 없음(`*.test.*` 파일 0개) — 검증은 `npx tsc --noEmit` + 임시 pure-logic 시뮬레이션 스크립트(`npx tsx`로 `stepGame` 직접 호출) + Playwright 콘솔 에러 체크로 대체해온 이력.
- 파일 규모: `src/game/physics.ts` 896줄(게임 로직 핵심, 압도적 최대 파일), `src/game/level.ts` 362줄(정적 레벨 데이터), `src/game/types.ts` 262줄, `src/game/constants.ts` 161줄(밸런스 수치 — CLAUDE.md 3장과 직결). `src/components/*` 15개 파일은 전부 게임 상태를 prop으로만 받는 순수 프레젠테이션 컴포넌트(로직 없음, 이미 잘 분리되어 있음).
- 에셋: `assets/backgrounds`, `assets/platforms`, `assets/sprites` — AI 생성 정적 PNG. 캐릭터/몬스터는 "정적 이미지 + 코드 트랜스폼(scale/rotate/opacity)"로 가짜 애니메이션 중 — 실제 프레임 애니메이션은 미구현(사용자가 예전에 요청, 크레딧 문제로 보류 중).
- 디자인 토큰: `src/theme.ts` (컬러 팔레트만 존재). 타이포/간격 스케일 등 정식 디자인 시스템은 아직 없음 — CLAUDE_CODEX_COLLAB_PROMPT.md 9장 기준 신규 구축 필요.

### 정상 작동 기능
- 기본 플랫포머(타일 충돌/점프/스톰프/코인/HUD/시작·게임오버·승리 화면/멀티터치)
- Bloom Shift(기계↔자연 전환, edge-triggered arming, 4개 존)
- 몬스터 5종(코그마이트/스포어 스프라이트/프레셔 피스톤/바이오 코일/스팀 블로어) 전부 구현+아트 적용됨
- 이동 시스템: 대시/오버드라이브/Root-Hook 그래플/벽점프·벽슬라이드
- Gear Socket 5종 + 캐논 점프 시너지
- 체크포인트 5개 + 부활, Area 1~3 확장(worldWidth 7800)
- 포탈+보스 조우: 보스가 유일하게 `platforms` 충돌 배열에 포함되는 몬스터라 물리적으로 진행을 막음, 페이즈 사이클(idle→telegraph→attack→vulnerable)로 스톰프 처치 시 승리. **로직은 pure-logic 시뮬레이션 4종 + tsc + Playwright로 검증 완료.** 단, 렌더링은 `BossView.tsx`의 절차적 placeholder 도형뿐.
- 화면 스케일링: `GameScreen.tsx`가 이미 고정 논리 해상도(`VIEWPORT_HEIGHT`)를 화면 크기에 맞춰 스케일업하는 로직을 갖고 있음 — CLAUDE.md 19장 Phase 1("화면 영역이 작게 들어가는 문제")이 부분적으로 이미 처리된 상태. 완전히 끝난 것으로 단정하지 말고 Codex가 실기기/다양한 화면비로 재검증 권장.

### 미완성/미검증 항목
- 보스 아트 전무(placeholder 도형) — 사용자가 "완전히 새로운 보스 디자인"을 명시적으로 요청한 상태.
- 보스전 난이도 실플레이 검증 안 됨(HP5, 페이즈 지속시간 1.5/1.0/0.6/1.5초는 첫 버전 추정치). 자동 봇은 스톰프 타이밍을 못 맞춰 검증 불가 — 사람 플레이 필요.
- 캐릭터/몬스터 진짜 프레임 애니메이션(Idle/Run/Jump/Dash 등) 미구현 — 크레딧 대기 중.
- HUD 아이콘(코인/체력/기어) 일러스트화 미착수.
- 포탈 통과 시 화면 전환 연출 없음(의도적 최소 구현, 로그에 개선 여지로 기록됨).
- 실기기 Expo Go 테스트 전 기간 미실시.
- CLAUDE.md 19장의 UI 리디자인(컨트롤/HUD/메뉴 디자인 시스템 관점 재구성)은 Phase 1 일부만 진행, Phase 2 이후 대부분 미착수.

## 파일 소유권 제안

### Claude Code 소유 (기능/로직)
- `src/game/types.ts`, `src/game/constants.ts`, `src/game/level.ts`, `src/game/physics.ts`
- `GameScreen.tsx` 중 게임 루프(requestAnimationFrame)/입력 바인딩/카메라 계산 로직 부분 — 단, 이 파일은 아래 "공용 파일" 참고

### Codex 소유 (디자인/UI)
- `src/components/*.tsx` 전체 (플레이어/몬스터/플랫폼/이펙트/HUD/컨트롤 렌더링 — 이미 게임 상태를 prop으로만 받는 순수 프레젠테이션이라 소유권 이전이 깔끔함)
- `src/screens/StartScreen.tsx`
- `src/theme.ts` (컬러 토큰) 및 향후 추가될 타이포/간격 토큰
- `assets/*` 전체 (신규 에셋 제작·교체)
- `BossView.tsx`의 placeholder 도형을 실제 일러스트로 교체하는 작업(phase 반응 로직/HP 핍 마크업은 유지, 비주얼 블록만 교체)

### 공용 파일 (양쪽이 함께 건드릴 가능성 — 사전 조율 필수)
- **`src/screens/GameScreen.tsx`**: 게임 루프/카메라 계산(Claude)과 레이아웃 스타일/스케일링/승리·패배 오버레이 UI 마크업(Codex)이 한 파일에 섞여 있음. 지금 당장 파일을 분리하는 건 리팩터링이라 이번 분석 단계에서는 보류 — 두 담당자가 동시에 손댈 필요가 생기면 그때 "게임 루프 훅 vs 프레젠테이션 레이아웃" 분리를 사용자 승인 하에 제안.
- **`src/game/types.ts`**: 타입 자체는 Claude 소유가 맞지만, 디자인 쪽에서 애니메이션 상태 등 새 필드가 필요해지면 Codex가 직접 고치지 말고 여기 REVIEW REQUESTS로 요청.
- **`src/game/constants.ts`의 크기값(예: `BOSS_WIDTH/HEIGHT`)**: 게임 로직 수치이자 동시에 렌더링 크기 기준이라, Codex가 시각적으로 크기를 조정하고 싶으면 임의 변경하지 말고 요청.

## 오류 분류 (S0~S3)
- **S0 (치명적)**: 없음. 빌드/타입체크 정상, 크래시 없음.
- **S1 (높음)**: 없음. 다만 실기기 Expo Go 테스트가 전 기간 미실시라는 검증 공백은 잠재 리스크로 명시.
- **S2 (보통)**:
  1. 보스전 난이도 미검증 — 실제 플레이 시 너무 쉽거나 어려울 가능성.
  2. 보스 시각 자산 부재 — 기능은 정상이나 "출시 가능 품질"에는 미달(CLAUDE.md 19장 목표 기준).
- **S3 (낮음)**:
  1. HUD 아이콘 미교체(기본/원형 스타일 잔존 가능성 — Codex가 실제 화면 확인 후 재분류 필요)
  2. 포탈 통과 화면 전환 연출 없음(의도적 최소 구현)
  3. 카메라/화면비 대응이 CLAUDE.md 19장 기준으로 완전히 끝났는지 미확인(부분 구현 상태)

## 첫 번째 구현 작업 제안
- **Codex**: `BossView.tsx`의 placeholder 도형을 실제 보스 일러스트로 교체(로직 변경 없이 비주얼만) — 사용자가 이미 "완전히 새로운 보스 디자인"을 요청했고 현재 유일하게 아트가 전무한 핵심 콘텐츠라 우선순위가 가장 높음. 무료 에셋(Kenney.nl 등) 또는 생성형 이미지 중 사용자와 조율해서 진행.
- **Claude**: 지금 단계에서 로직 쪽에 급한 결함은 없음 — 대기하며 Codex의 첫 UI 작업 연동(props 인터페이스 등) 지원, 또는 사용자가 원하면 보스전 밸런스(HP/페이즈 시간)를 실플레이 피드백 받을 때까지 보류.
- **공용**: `GameScreen.tsx`를 계속 공유해서 쓸지, 아니면 "게임 루프 훅 + 프레젠테이션 레이아웃"으로 분리할지는 두 담당자가 실제로 충돌을 겪기 전엔 결정 보류(과도한 사전 리팩터링 금지 원칙).

## CLAUDE ACTIVE
- 작업: 완료 — Route Gate Foundation. Area 1에 `vineGate1`/`gearGate1` 로컬 게이트 1쌍 구현(스폰~x=220 사이, 기존 컨텐츠와 완전히 겹치지 않는 구간으로 재배치 — 아래 HANDOFF 참고). 전역 Bloom Shift는 코드 한 줄도 건드리지 않고 완전히 병행하는 별도 시스템으로 추가.
- 소유 파일: `src/game/types.ts`, `src/game/constants.ts`, `src/game/level.ts`, `src/game/physics.ts`, 신규 `src/components/RouteGateView.tsx`, `src/screens/GameScreen.tsx`(렌더 필터 1줄 + 마운트 2줄만, 기능적 필요 최소 변경)
- 시작 시각/세션: 2026-08-27
- 완료 조건: 충족 — 2개 로컬 게이트, 6초 제한, 안전한 실패 경로(모든 보상 발판이 solid ground 위), pure-logic 테스트 7종 + tsc + Playwright 통과

## CODEX ACTIVE
- 작업: 완료 — Route Gate 시각 언어 및 보상 발판 프레젠테이션 리빌드.
- 소유 파일: 없음
- 시작 시각/세션: 2026-08-27
- 완료 조건: Vine/Gear Gate 구분, 숫자 없는 잔여시간, 열린 보상 발판 강조, 타입 검사·웹 렌더링 완료.

## REVIEW REQUESTS
- 요청자: Codex / 대상: Claude / 우선순위: P1 / 요청: 사용자가 Route Gate·Vine/Gear 분기·시간제 길이를 전면 폐기. `GAME_DIRECTION_V2.md`와 `CLAUDE.md` 21장에 따라 RouteGate 타입/상태/상수/물리/레벨/렌더링 연결을 제거하고 Area 1을 단일 연속 동선으로 복구할 것 / 상태: OPEN
- 요청자: Claude / 대상: Codex / 검증 포인트: 세로형 큰 화면의 스테이지 하단 빈 공간 / 처리: `MAX_STAGE_SCALE`을 3→4.5로 완화하고 4개 대표 화면비에서 검증 / 상태: RESOLVED
- 요청자: Claude / 대상: Codex / 검증 포인트: 신규 보스 스프라이트 4장 파일 용량 과다 / 처리: 긴 변 640px LANCZOS 다운스케일 + PNG optimize/compress 9, 알파·화질·웹 로드 검증 / 상태: RESOLVED

## ISSUES
- [S3] 보스전 난이도, 이론적 클리어 가능성은 검증됨 / 재현: 반응형 스크립트 봇으로 `stepGame` 직접 호출 시뮬레이션(개발로그.md 2026-08-27 (19)) — 무피해로 약 23초 만에 클리어 확인 / 영향: 수치 자체는 문제없어 보이나, 터치 컨트롤 기준 사람이 느끼는 체감 난이도는 여전히 미확인 / 담당: 미정(실기기 실플레이 필요) / 상태: OPEN (심각도 S2→S3로 하향, 근거: 봇 시뮬레이션으로 클리어 가능성 확인됨)
- [S2] 보스 아트 부재 / 재현: `BossView.tsx` 확인 / 영향: 출시 품질 미달 / 담당: Codex / 상태: RESOLVED (4페이즈 Rootwarden 아트 적용, Claude가 기술 검수: `npx tsc --noEmit` 통과 + Playwright로 웹 빌드 로드 시 콘솔 에러/리소스 실패 0건 확인. 단, 아래 신규 이슈 참고)
- [S2] 신규 보스 스프라이트 4장 파일 용량 과다 / 담당: Codex / 상태: RESOLVED (총 약 9.1MB→2.4MB, 73% 감소)
- [S2] 세로형 큰 화면(태블릿/대형 폰 세로)에서 게임 스테이지 아래 빈 공간 발생 / 원인: `MAX_STAGE_SCALE=3` 상한 / 담당: Codex / 상태: RESOLVED (`MAX_STAGE_SCALE=4.5`로 완화, 810×1080/390×844/844×390/1440×900 4종 화면비 재검증 완료)
- [S2] 세계 아트·기존 일반 몬스터가 새 Sprout의 밝은 프리미엄 화풍과 불일치 / 재현: 첫 스테이지 실렌더에서 황량한 기계 배경 및 구형 몬스터와 신형 주인공 비교 / 영향: 전체 화면이 하나의 상용 게임처럼 읽히지 않음 / 담당: Codex(아트·프레젠테이션), Claude(필요 시 상태 훅 지원) / 상태: OPEN

## DECISIONS
- 2026-08-27: Claude Code × Codex 협업 체계 도입, 역할 고정(Codex=디자인/UI, Claude=기능/로직) / 근거: 사용자 지시 / 승인자: 사용자
- 2026-08-27: 보스전 수치(HP5/페이즈 지속시간) 변경 불필요로 결론 / 근거: 반응형 봇 시뮬레이션에서 무피해 클리어 확인(개발로그.md (19)) / 승인자: Claude 자체 검증, 사용자 확인 대기 없음(수치 변경이 아니므로)
- 2026-08-27: 사용자가 기존 전역 Bloom Shift의 쓰임·재미가 불명확하다고 판단. Codex가 게임 기획을 주도하고 Claude는 시스템 구현을 주로 담당하도록 역할을 확대 전환. 전역 상태 전환은 `Momentum Route`의 선택형 로컬 게이트로 단계 교체한다 / 승인자: 사용자

## NEXT
1. Codex: 실제 사람이 EASY/FAST 선택과 보상 동선을 이해하는지 플레이 검수.
2. Claude: Codex의 플레이 검수 피드백이 들어올 때까지 Route Gate 로직 변경 대기.
3. Route Gate Vertical Slice가 재미있다는 확인 뒤에만 Spore Sprite/플랫폼/Area 2~3 확장(기획 문서 명시 순서).

## HANDOFF
- 마지막 완료 지점(Claude): Route Gate Foundation 구현 완료. `src/game/types.ts`에 `RouteGate` 타입(Boss와 동일하게 정적+런타임 상태 결합) 및 `Platform.activeGate` 추가, `constants.ts`에 `ROUTE_GATE_*` 3개 추가, `level.ts`에 게이트 2개+보상 발판 5개+보상 코인 7개 추가, `physics.ts`에 `stepRouteGates()`(Bloom Shift 노드와 동일한 edge-triggered arming 패턴) 추가, `GameScreen.tsx`는 플랫폼 렌더 필터에 조건 1개 추가 + `RouteGateView` 마운트 2줄만 추가(그 외 Codex의 HUD/Controls/StartScreen 변경분은 건드리지 않음).
- **배치 관련 중요 사항**: 최초 계획한 위치(x=560~700, 기존 Bloom 튜토리얼 존 바로 다음)에 이미 `piston1`(x=650)과 `e1` 코그마이트 순찰(400~620)이 있다는 걸 뒤늦게 발견해 **스폰(x=40)~첫 Shift Node(x=220) 사이(x=85~215)**로 재배치했다. Codex가 실제 화면에서 배치를 검수할 때 이 좌표 기준으로 볼 것 — 결과적으로 "학습" 단계가 게임 시작 직후로 앞당겨진 형태다.
- 검증: pure-logic 테스트 7종(게이트 발동/보상 도달 가능성/안전한 실패/재발동/기존 시스템 회귀) + `npx tsc --noEmit` + Playwright 웹 빌드 콘솔 에러 0 + 스크린샷으로 게이트 마커 육안 확인(개발로그.md 2026-08-27 (23) 참고).
- 남은 일: Codex의 시각 언어 작업, 사람 실플레이 재미 검증, 검증 후 Area 2~3 확장.
- 다음 담당자가 먼저 볼 파일: `GAME_DIRECTION_V2.md`, `src/components/RouteGateView.tsx`, `src/game/level.ts`(x=85~220 구간), `개발로그.md` 2026-08-27 (23).
- 실행 및 검증 명령: `npm run web`, `npx tsc --noEmit`.
- Codex 시각 구현: `RouteGateView.tsx`를 Vine(덩굴 문·잎·연두 코어·EASY)과 Gear(황동 아치·기어·전진 셰브런·FAST)로 교체. 활성 중에는 숫자 대신 6칸 빛 막대로 남은 시간을 보여 준다. `PlatformView.tsx`는 Route 보상 발판에 종류별 상단 발광·진행 화살표를 추가했다.
- 최신 사용자 지시로 위 Route Gate 시각 언어는 폐기됐다. Codex는 `GameScreen.tsx`에서 Gate 렌더링을 제거하고 화면 비율·월드 표면을 새 기준으로 리빌드했다. Claude가 시스템 제거를 완료하면 `RouteGateView.tsx`도 삭제한다.
