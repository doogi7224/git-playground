# AI 협업 상태판

> 현재 작업만 기록한다. 완료된 상세 이력은 `개발로그.md`에 남긴다.

## 현재 게임 기준

- 단일 연속 숲 동선. Route Gate, Bloom Shift, 환경 전환, 처치 후 임시 발판은 폐기됨.
- Codex: 기획·아트·UI·프레젠테이션 구현.
- Claude Code: 물리·상태·레벨·입력 연결·테스트.
- 공용 기준: `CLAUDE.md`.

## CLAUDE ACTIVE

- (완료, 비어 있음) 최근 완료 내용은 HANDOFF 참고.

## CODEX ACTIVE

- 작업: 사용자 부재 중 1차 화면·모션 완성. 모바일 실제 화면에서 조작 가능성, 캐릭터/적/활/그래플의 읽기성을 검수하고 프레젠테이션을 다듬는다.
- 소유 파일: `assets/*`, `src/components/*`, `src/theme.ts`, `src/screens/GameScreen.tsx`의 레이아웃·프레젠테이션 범위.
- 순서: (1) 모바일 가로 화면·터치 컨트롤 검수, (2) 주인공 발 착지/달리기·활 사격 연출 보정, (3) Cogmite/Jumper/Turret 모션 가독성 보정, (4) HUD와 원정 배너/Root-Hook의 시각 통일.
- 금지: `src/game/*` 규칙 변경, 수치 임의 변경, 새 게임 시스템/레벨 구간 추가.

## REVIEW REQUESTS

- Claude → Codex / P1 / 요청: 아래 "신규 상태·입력 인터페이스"를 그대로 사용해 화살·유물 활·Jumper(Acorn Hopper)·Turret(Root Turret)·SeedProjectile 렌더링 컴포넌트와 공격 버튼을 붙여달라. `src/game/*`는 건드리지 않아도 된다. / 상태: RESOLVED
  - **`GameState`에 추가된 필드** (모두 `src/game/types.ts`에 정의): `bowPickup: BowPickup`(위치+`collected`), `arrows: Arrow[]`(위치+`vx`, 폭14×높이4), `jumpers: Jumper[]`(위치+`phase: 'grounded'|'windup'|'airborne'`+`alive`), `turrets: Turret[]`(위치+`alive`, 충전 여부는 `isTurretCharging(turret)` 헬퍼로 확인), `seeds: SeedProjectile[]`(위치+`vx`, 폭12×높이12).
  - **`Player`에 추가된 필드**: `hasBow: boolean`(활 획득 여부), `arrowCooldown: number`(연사 제한, 렌더링에는 불필요할 수도).
  - **공격 입력**: `InputState.attackPressed: boolean`(edge-triggered, `jumpPressed`/`dashPressed`와 동일한 소비 패턴)을 추가했고 `GameScreen.tsx`의 `inputRef`에 이미 배선해뒀다. `Controls.tsx`에 `onAttack: () => void` prop을 추가하고 새 공격 버튼에서 호출하면, `GameScreen.tsx`에서 `<Controls onAttack={() => (inputRef.current.attackPressed = true)} .../>` 한 줄만 추가하면 연결된다(현재는 Controls가 이 prop을 선언하지 않아 타입 에러가 나서 아직 못 붙였음 — Codex가 prop을 추가하면 바로 연결).
  - Jumper 위치는 `p6`(x=1650)/`p15`(x=4100) 발판 위, Turret 위치는 `p9`(x=2500)/`p22`(x=5850) 발판 위, 유물 활은 x=250 지상. 전부 기존 지상 몬스터 순찰 구간·피스톤과 겹치지 않는 좌표로 확인 후 배치했다(자세한 배치 실수/수정 경위는 `개발로그.md` 참고).

## OPEN ISSUES

- S2: 실제 모바일 터치 플레이에서 활 사격 간격과 Jumper/Turret 밀도 체감 확인 필요.
- S3: 적 전체의 개별 애니메이션 프레임(특히 기본 Cogmite)은 아직 추가 제작 대상이다.

## HANDOFF

- 최근 완료(Claude, 이번 세션): 사용자 부재 중 1차 안정화 검증 4단계를 전부 수행했다 — (1) 이동 160/대시 480 체감차이, (2) 활 쿨다운(0.35s)/화살 속도(500)·수명(1.2s), (3) Jumper/Turret/씨앗 충돌·전역 스폰 상한(6), (4) 기존 5종 몬스터+체크포인트+그래플+보스전 핵심 회귀. `npx tsc --noEmit` 통과. 직접 작성한 pure-logic 시뮬레이션 42종 전부 PASS(코드는 커밋하지 않고 검증 후 삭제 — 저장소에 임시 스크립트를 남기지 않는 관례 유지). 처음 4건 FAIL이 떴으나 전부 테스트 스크립트 자체의 좌표/타이밍 실수(스폰 직후 공중 상태에서 지상 속도 검사, 대시 무적시간이 같은 프레임에 dt만큼 감쇠되는 걸 미반영, 전역 상한 테스트용 씨앗 좌표가 world 밖이라 despawn 필터에 걸림, 코그마이트 감지 테스트 위치가 패트롤 경계 바로 앞이라 충전 즉시 반전됨)로 확인 후 스크립트를 고쳐 전부 PASS — 실제 게임 로직 결함 없음. Expo 웹 + Playwright로 시작 화면→Start→실제 게임 화면(주인공/Cogmite/활 아이템/코인/HUD/컨트롤) 렌더링과 콘솔 에러 0 확인. 추가로 레벨 전체를 최대 6분간 실주행시키는 스트레스 테스트(단순 휴리스틱 봇)도 돌려 NaN/자원누수/전역 상한 위반이 전혀 없음을 확인했고, 봇이 3번 사망한 것은 전부 신규 콘텐츠와 무관한 기존 `piston1` 타이밍 회피 실패였다(개발로그 (43) 참고). **결론: 코드 변경 없음** — 기존 활/화살/Jumper/Turret 구현이 이미 안정적으로 동작해 밸런스 수치를 바꿀 근거를 찾지 못했다.
- 이전 Codex 완료: `BowPickupView`/`ArrowView`/`JumperView`/`TurretView`/`SeedProjectileView`를 추가하고 `GameScreen.tsx`에 마운트했다. `Controls.tsx`에는 활 획득 전 잠김, 획득 후 활성화되는 `ARROW` 버튼을 연결했다. `src/game/*`는 변경하지 않았다.
- 이전 Codex 보정: 일반 이동속도 220→160, 모바일 HUD/컨트롤 높이 축소, 플레이어 발 위치 보정, 사격 순간 활 포즈, 유물 배너, 실제 Root-Hook 앵커·덩굴 로프 시각 교체.
- 다음 Codex 작업: 활 획득 후 실제 터치 사격과 중·후반 Jumper/Turret 체감 난이도를 플레이 검수하고, 적 이동 프레임을 추가 제작한다(위 Claude 검증은 로직 수치가 논리적으로 안전함을 확인한 것이며, 실제 터치 조작 체감은 대체하지 못한다).
- 다음 담당자가 먼저 볼 파일: 이번 세션은 코드 변경이 없으므로 새로 볼 파일 없음. 다음 Claude 세션은 사용자의 새 지시나 Codex의 REVIEW REQUEST가 생기면 그때 `src/game/*`를 다시 연다.

## 사용자 부재 중 작업 종료 기준

- Claude: 타입 검사·기존 회귀·활/신규 적 로직 검증을 마치고, 밸런스 수치를 바꿨다면 근거와 전후 값을 `개발로그.md`에 기록한다.
- Codex: 실제 화면 캡처 기준으로 모바일 스테이지/컨트롤, 착지, 사격, 그래플, 배너가 읽히는지 확인하고 S0~S2 발견 항목만 수정한다.
- 공통: 각자 소유 파일만 커밋·푸시하고, 완료/미완료/검증 결과를 HANDOFF에 남긴다. 사용자의 새 승인 없이는 범위를 넓히지 않는다.
