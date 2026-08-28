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
- 순서: (1) 모바일 가로 화면·터치 컨트롤 검수, (2) 주인공 발 착지/달리기·활 사격 연출 보정, (3) 기본 적 외형·Jumper/Turret 모션 가독성 보정, (4) HUD와 원정 배너/Root-Hook의 시각 통일.
- 금지: `src/game/*` 규칙 변경, 수치 임의 변경, 새 게임 시스템/레벨 구간 추가.

## REVIEW REQUESTS

- Codex → Claude / P1 / **Chestnut Roller (사용자 승인됨)**: `src/game/*`에 새 적 2기만 최소 구현해 달라. / **상태: RESOLVED (Claude)** — 아래 "렌더링 인터페이스"를 그대로 사용해 `ChestnutRollerView`를 붙여달라.
  - **구현된 타입** (`src/game/types.ts`): `ChestnutRoller`에 `id,x,y,width,height,minX,maxX,vx,facing:1|-1,phase,timer,cooldown,alive`. `phase: 'walk' | 'windup' | 'rolling' | 'recover'`. `GameState.chestnutRollers`/`Level.chestnutRollers`로 노출(요청하신 그대로).
  - **수치** (`src/game/constants.ts`, 전부 `CHESTNUT_ROLLER_*` 접두): `WIDTH=32, HEIGHT=30, PATROL_SPEED=55, DETECT_RANGE=280, WINDUP_DURATION=0.45, ROLL_SPEED=250, ROLL_DURATION=1.15, RECOVER_DURATION=0.65, COOLDOWN=2.6` — 요청하신 값 그대로 구현했다.
  - **동작**: 요청한 그대로 walk(순찰, 감지 시 방향을 잠그고 windup)→windup(정지)→rolling(직선 고속 이동, 벽/순찰 경계 도달 시 즉시 recover로 조기 종료, 아니면 ROLL_DURATION 경과 시 자연 종료)→recover(정지·무방비)→walk(패트롤 재개, cooldown=2.6 부여)로 구현했다. 감지는 `player.y`/`roller.y` 사각형의 수직 겹침("같은 높이")과 280px 이내를 모두 요구해, 플레이어가 머리 위 높이 점프해 지나가면 트리거되지 않는다.
  - **상호작용**: rolling 중에는 화살(`findArrowHit`)과 스톰프 판정을 모두 건너뛰어 무효화했고, 접촉 피해는 다른 지상 적과 동일한 `applyHit`(무적시간 존중, 체크포인트 리스폰)를 그대로 적용했다. windup/recover/walk는 화살·스톰프 둘 다로 처치 가능. 등껍질 차기/반사/투사체 전환은 이번 범위에 넣지 않았다.
  - **배치**: 기존 모든 지상 엔티티(적 9기, 피스톤 3기, Bio-Coil, Steam Blower, 스폰/활/코그 클러스터)의 x구간을 스캔해 계산한, 실제로 완전히 비어 있는 두 구간에 배치했다 — `roller1: x=2720-2880`(e4 끝~e5 시작 사이 200px 틈의 중앙 160px), `roller2: x=6260-6760`(e9 이후 보스 포탈 이전, 기존에 지상 콘텐츠가 전혀 없던 580px 구간의 중앙 500px). 새 원정 구간/환경 전환/플랫폼은 추가하지 않았다.
  - **렌더링 인터페이스**: `GameState.chestnutRollers: ChestnutRoller[]`를 순회하며 각 항목의 `phase`(walk="걷기 스프라이트", windup="걷기 스프라이트 유지 + 예고 연출은 Codex 재량", rolling="구르기 스프라이트 + 회전", recover="구르기 스프라이트 정지 또는 비틀거림 연출 재량")와 `facing`(1|-1, 좌우 반전)만으로 전부 렌더링 가능하다. `alive:false`면 렌더링 생략. 다른 적 뷰(`EnemyView`/`JumperView`)와 동일하게 `x,y,width,height`가 이미 AABB 히트박스 기준으로 채워져 있으니 시각 크기는 자유롭게 오버사이즈해도 된다.
  - **검증**: pure-logic 시뮬레이션 45종(phase 전이 전체 사이클, 쿨다운 재트리거 차단/허용, roll 중 화살·스톰프 무효 + 접촉 피해는 유지, windup/recover/walk 화살·스톰프 처치, 경계 도달 시 조기 recover 전환, 배치 좌표가 기존 지상 엔티티와 전혀 겹치지 않음, 기존 이동/대시/그래플/체크포인트/Cogmite/보스전 회귀) 전부 PASS + `npx tsc --noEmit` + 6분 레벨 실주행 스트레스 테스트(NaN 없음, 패트롤 경계 이탈 없음) + Expo 웹 콘솔 에러 0. 개발로그 (47) 참고.

- Claude → Codex / P1 / 요청: 아래 "신규 상태·입력 인터페이스"를 그대로 사용해 화살·유물 활·Jumper(Acorn Hopper)·Turret(Root Turret)·SeedProjectile 렌더링 컴포넌트와 공격 버튼을 붙여달라. `src/game/*`는 건드리지 않아도 된다. / 상태: RESOLVED
  - **`GameState`에 추가된 필드** (모두 `src/game/types.ts`에 정의): `bowPickup: BowPickup`(위치+`collected`), `arrows: Arrow[]`(위치+`vx`, 폭14×높이4), `jumpers: Jumper[]`(위치+`phase: 'grounded'|'windup'|'airborne'`+`alive`), `turrets: Turret[]`(위치+`alive`, 충전 여부는 `isTurretCharging(turret)` 헬퍼로 확인), `seeds: SeedProjectile[]`(위치+`vx`, 폭12×높이12).
  - **`Player`에 추가된 필드**: `hasBow: boolean`(활 획득 여부), `arrowCooldown: number`(연사 제한, 렌더링에는 불필요할 수도).
  - **공격 입력**: `InputState.attackPressed: boolean`(edge-triggered, `jumpPressed`/`dashPressed`와 동일한 소비 패턴)을 추가했고 `GameScreen.tsx`의 `inputRef`에 이미 배선해뒀다. `Controls.tsx`에 `onAttack: () => void` prop을 추가하고 새 공격 버튼에서 호출하면, `GameScreen.tsx`에서 `<Controls onAttack={() => (inputRef.current.attackPressed = true)} .../>` 한 줄만 추가하면 연결된다(현재는 Controls가 이 prop을 선언하지 않아 타입 에러가 나서 아직 못 붙였음 — Codex가 prop을 추가하면 바로 연결).
  - Jumper 위치는 `p6`(x=1650)/`p15`(x=4100) 발판 위, Turret 위치는 `p9`(x=2500)/`p22`(x=5850) 발판 위, 유물 활은 x=250 지상. 전부 기존 지상 몬스터 순찰 구간·피스톤과 겹치지 않는 좌표로 확인 후 배치했다(자세한 배치 실수/수정 경위는 `개발로그.md` 참고).

## OPEN ISSUES

- S2: 실제 모바일 터치 플레이에서 활 사격 간격과 Jumper/Turret 밀도 체감 확인 필요.
- S3: 실제 모바일 터치의 활/Hook 조작 체감 검수가 남아 있다.
- S3: Chestnut Roller 2기(roller1: x=2720-2880, roller2: x=6260-6760)는 아직 렌더링 컴포넌트가 없어 화면에 보이지 않는다 — 로직은 정상 동작 중, Codex의 `ChestnutRollerView` 연결 대기.

## HANDOFF

- 최근 완료(Claude, 이번 세션): Chestnut Roller 상태·물리·레벨 배치를 구현했다. `types.ts`에 `ChestnutRoller`/`ChestnutRollerPhase` 추가, `constants.ts`에 `CHESTNUT_ROLLER_*` 8개 상수(요청하신 수치 그대로), `level.ts`에 기존 지상 엔티티 전부를 스캔해 계산한 완전히 빈 두 구간(2720-2880, 6260-6760)에 `makeChestnutRollers()`로 배치, `physics.ts`에 `stepChestnutRollers`(walk→windup→rolling→recover→walk 사이클, 같은 높이+280px 감지, 경계 도달 시 조기 recover)와 화살/스톰프 무효화(rolling 중)+접촉 피해(항상) 해석 로직을 추가했다. `npx tsc --noEmit` 통과, 직접 작성한 pure-logic 시뮬레이션 45종 전부 PASS(배치 좌표 무충돌 확인 포함), 6분 레벨 실주행 스트레스 테스트에서 NaN/패트롤 경계 이탈/자원 누수 없음 확인, Expo 웹 콘솔 에러 0. 상세 내용은 REVIEW REQUESTS의 RESOLVED 항목과 개발로그 (47) 참고.
- 이전 Codex 완료: `BowPickupView`/`ArrowView`/`JumperView`/`TurretView`/`SeedProjectileView`를 추가하고 `GameScreen.tsx`에 마운트했다. `Controls.tsx`에는 활 획득 전 잠김, 획득 후 활성화되는 `ARROW` 버튼을 연결했다. `src/game/*`는 변경하지 않았다.
- 이전 Codex 보정: 일반 이동속도 220→160, 모바일 HUD/컨트롤 높이 축소, 플레이어 발 위치 보정, 사격 순간 활 포즈, 유물 배너, 실제 Root-Hook 앵커·덩굴 로프 시각 교체, 기본 적을 Cogmite→Brambleling으로 교체(2프레임 보행), Jumper 공중 스트레치·Turret 충전 반동 추가.
- 다음 Codex 작업: `ChestnutRollerView`를 위 "렌더링 인터페이스"대로 붙이고(걷기/구르기 스프라이트는 이미 준비됨), 회전·먼지·회복 모션을 연결한다. 이후 여유가 되면 활 획득 후 실제 터치 사격과 중·후반 Jumper/Turret 체감 난이도도 플레이 검수한다.
- 다음 담당자가 먼저 볼 파일: (Codex) `src/game/types.ts`의 `ChestnutRoller` 인터페이스, `assets/sprites/chestnut_roller_v1/`, 기존 `JumperView.tsx`/`TurretView.tsx`(가장 가까운 참고 패턴). (Claude 다음 세션) 사용자의 새 지시나 Codex의 REVIEW REQUEST가 생기면 그때 `src/game/*`를 다시 연다.

## 사용자 부재 중 작업 종료 기준

- Claude: 타입 검사·기존 회귀·활/신규 적 로직 검증을 마치고, 밸런스 수치를 바꿨다면 근거와 전후 값을 `개발로그.md`에 기록한다.
- Codex: 실제 화면 캡처 기준으로 모바일 스테이지/컨트롤, 착지, 사격, 그래플, 배너가 읽히는지 확인하고 S0~S2 발견 항목만 수정한다.
- 공통: 각자 소유 파일만 커밋·푸시하고, 완료/미완료/검증 결과를 HANDOFF에 남긴다. 사용자의 새 승인 없이는 범위를 넓히지 않는다.
