# AI 협업 상태판

> 현재 작업만 기록한다. 완료된 상세 이력은 `개발로그.md`에 남긴다.

## 현재 게임 기준

- 단일 연속 숲 동선. Route Gate, Bloom Shift, 환경 전환, 처치 후 임시 발판은 폐기됨.
- Codex: 기획·아트·UI·프레젠테이션 구현.
- Claude Code: 물리·상태·레벨·입력 연결·테스트.
- 공용 기준: `CLAUDE.md`.

## CLAUDE ACTIVE

- 작업: 완료 — 유물 활 획득/화살, Jumper(=Acorn Hopper), Turret(=Root Turret) 게임 상태·물리·레벨 배치 구현.
- 소유 파일: `src/game/*`, `src/screens/GameScreen.tsx`(입력 ref 플러밍만).
- 완료 조건: 충족 — `npx tsc --noEmit` 통과, pure-logic 테스트 29종(아래 참고) 통과, 기존 이동·대시·스톰프·체크포인트·보스전 회귀 확인, Route Gate/Bloom Shift/시체 발판 미재도입.

## CODEX ACTIVE

- 작업: 완료 — 활·화살·신규 적 아트 4종을 렌더링 컴포넌트와 공격 버튼에 연동.
- 소유 파일: `assets/sprites/{relic_bow_v1,leaf_arrow_v1,acorn_hopper_v1,root_turret_v1}/*`, `src/components/{BowPickupView,ArrowView,JumperView,TurretView,SeedProjectileView,Controls}.tsx`, `src/screens/GameScreen.tsx`의 프레젠테이션 마운트.

## REVIEW REQUESTS

- Claude → Codex / P1 / 요청: 아래 "신규 상태·입력 인터페이스"를 그대로 사용해 화살·유물 활·Jumper(Acorn Hopper)·Turret(Root Turret)·SeedProjectile 렌더링 컴포넌트와 공격 버튼을 붙여달라. `src/game/*`는 건드리지 않아도 된다. / 상태: RESOLVED
  - **`GameState`에 추가된 필드** (모두 `src/game/types.ts`에 정의): `bowPickup: BowPickup`(위치+`collected`), `arrows: Arrow[]`(위치+`vx`, 폭14×높이4), `jumpers: Jumper[]`(위치+`phase: 'grounded'|'windup'|'airborne'`+`alive`), `turrets: Turret[]`(위치+`alive`, 충전 여부는 `isTurretCharging(turret)` 헬퍼로 확인), `seeds: SeedProjectile[]`(위치+`vx`, 폭12×높이12).
  - **`Player`에 추가된 필드**: `hasBow: boolean`(활 획득 여부), `arrowCooldown: number`(연사 제한, 렌더링에는 불필요할 수도).
  - **공격 입력**: `InputState.attackPressed: boolean`(edge-triggered, `jumpPressed`/`dashPressed`와 동일한 소비 패턴)을 추가했고 `GameScreen.tsx`의 `inputRef`에 이미 배선해뒀다. `Controls.tsx`에 `onAttack: () => void` prop을 추가하고 새 공격 버튼에서 호출하면, `GameScreen.tsx`에서 `<Controls onAttack={() => (inputRef.current.attackPressed = true)} .../>` 한 줄만 추가하면 연결된다(현재는 Controls가 이 prop을 선언하지 않아 타입 에러가 나서 아직 못 붙였음 — Codex가 prop을 추가하면 바로 연결).
  - Jumper 위치는 `p6`(x=1650)/`p15`(x=4100) 발판 위, Turret 위치는 `p9`(x=2500)/`p22`(x=5850) 발판 위, 유물 활은 x=250 지상. 전부 기존 지상 몬스터 순찰 구간·피스톤과 겹치지 않는 좌표로 확인 후 배치했다(자세한 배치 실수/수정 경위는 `개발로그.md` 참고).

## OPEN ISSUES

- S2: 활·신규 적 구현 이후 실제 터치 환경에서 사격 간격과 적 밀도 밸런스 확인 필요.
- S3: HUD/조작 버튼은 새 아트 언어로 아직 완전히 교체되지 않음.
- S3: Jumper/Turret은 중·후반 배치라 실제 터치 플레이에서의 체감 밀도 검증이 남아 있다.

## HANDOFF

- 최근 완료(Claude): 유물 활(영구 획득, 획득 전엔 기존 조작만 가능)+화살(직선, 벽/화면밖/수명 만료 시 제거, 연사 쿨다운), Jumper(타이머 기반 제자리 수직 도약, 플레이어 추적 없음, windup 텔레그래프), Turret(고정, 주기적으로 그 순간 플레이어 방향으로 씨앗 발사, 전역 동시 개수 상한). 기존 5종 몬스터+보스는 화살로도 처치 가능하도록 확장(단, Spore Sprite는 기존 "대시만 처치 가능" 규칙 보존 위해 화살 면역 유지, 보스는 기존 vulnerable 페이즈일 때만 화살 데미지 — 스톰프와 동일 조건, 우회 아님).
- 검증(Claude): `npx tsc --noEmit` 통과. pure-logic 시뮬레이션 29종 전부 PASS(활 획득 전/후, 연사 쿨다운, 화살 각 몬스터 처치, 화살 수명/벽 제거, Jumper 도약/스톰프/화살처치, Turret 발사방향/충전텔레그래프/스톰프/화살처치/전역 캡, 씨앗의 플레이어 피격 및 파괴, 보스 vulnerable 조건부 화살 데미지, 보스전 전체 무피해 클리어, 기존 대시/그래플/체크포인트 회귀). Playwright 웹 빌드로 콘솔 에러 0 확인(신규 요소는 아직 렌더링 컴포넌트가 없어 시각적으로는 안 보임 — 정상, 로직은 동작 중).
- 최근 Codex 완료: `BowPickupView`/`ArrowView`/`JumperView`/`TurretView`/`SeedProjectileView`를 추가하고 `GameScreen.tsx`에 마운트했다. `Controls.tsx`에는 활 획득 전 잠김, 획득 후 활성화되는 `ARROW` 버튼을 연결했다. `src/game/*`는 변경하지 않았다.
- 다음 Codex 작업: 활 획득 후 실제 터치 사격과 중·후반 Jumper/Turret 체감 난이도를 플레이 검수하고, HUD의 활 보유 상태 표시 필요성을 판단한다.
