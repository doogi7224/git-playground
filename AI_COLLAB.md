# AI 협업 상태판

> 현재 작업만 기록한다. 완료된 상세 이력은 `개발로그.md`에 남긴다.

## 현재 게임 기준

- 단일 연속 숲 동선. Route Gate, Bloom Shift, 환경 전환, 처치 후 임시 발판은 폐기됨.
- Codex: 기획·아트·UI·프레젠테이션 구현.
- Claude Code: 물리·상태·레벨·입력 연결·테스트.
- 공용 기준: `CLAUDE.md`.

## CLAUDE ACTIVE

- (완료, 비어 있음) 최근 완료 내용은 HANDOFF 참고. Codex가 남긴 P1 버그(SeedProjectile 중복 React key)를 수정·검증해 RESOLVED 처리했다.

## CODEX ACTIVE

- 작업: **상용 품질 비주얼 리빌드 1차.** 사용자가 승인한 16:9 전체 게임 프레임(월드가 전 화면을 쓰고 HUD/조작부가 오버레이되는 구성)을 기준으로 배경·지형·주인공·적·HUD를 하나의 페인터리 숲 모험 아트 세트로 교체한다.
- 소유 파일: `assets/*`, `src/components/*`, `src/theme.ts`, `src/screens/GameScreen.tsx`의 레이아웃·프레젠테이션 범위.
- 순서: (1) 16:9 전체 월드 프레임·새 원경 아트 적용, (2) 지형/수집품/상호작용 오브젝트 재질 통일, (3) 주인공·적 스프라이트 시트와 행동별 모션 교체, (4) HUD/컨트롤 축소·고급화, (5) 실제 APK 화면 QA.
- 현재: 주인공 공중/활 모션과 도약 적/포탑/투사체의 상태 전용 아트를 적용했다. 다음은 나머지 상호작용 연출 정리와 변경 묶음의 Android APK 실기기 QA.
- 렌더링: 게임 규칙과 AABB 물리는 유지한다. 성능·애니메이션 품질이 필요한 월드 프레젠테이션은 Skia 캔버스 전환을 적용한다.
- 금지: `src/game/*` 규칙 변경, 수치 임의 변경, 새 게임 시스템/레벨 구간 추가.

## REVIEW REQUESTS

- Claude → 사용자 / P3 / **16:9 리빌드 플레이 감각 회귀 검증 — 발견 3건 (수정 안 함, 승인 대기)**: 사용자 지시(입력 씹힘/착지·전환 자연스러움/애니메이션 상태 검증)에 따라 `src/game/*` pure-logic 시뮬레이션 61종 + `npx tsc --noEmit` + `npx expo export --platform web` 실제 프로덕션 웹 번들 빌드(340 모듈, 정상 완료) + 6분 레벨 실주행 스트레스 테스트(이동/점프/대시/그래플 혼합 입력, 이상 없음) + Playwright로 번들 화면 콘솔 에러 0 확인을 마쳤다. 셋 다 **`src/game/*`의 기존(이번 세션 이전부터 있던) 동작이며, 이번 리빌드가 만든 회귀는 아니다** — 소유권상 나만 고칠 수 있는 부분이라 직접 고치지 않고 재현 방법과 제안만 남긴다.
  1. **동시 입력(점프+대시) 소실**: 같은 프레임에 점프+대시를 함께 누르면 대시가 항상 이긴다(`dashTimer>0`인 동안 이동/점프 분기 전체를 건너뛰는 구조 때문). 그 프레임의 점프 입력은 시각 피드백 없이 사라지고, 대시 지속시간(`DASH_DURATION=0.18초`, 약 11프레임) 내내 눌리는 점프도 전부 같은 이유로 소실된다 — 재시도되지 않는다. 재현: `freshState` → 착지 상태에서 `{right:true, jumpPressed:true, dashPressed:true}`를 한 프레임 입력 → `vy`가 점프 값이 아니라 대시 값(`vx=DASH_SPEED, vy=0`)이 된다. 제안(적용 안 함): 대시 시작 프레임에 한해 점프 입력을 다음 프레임으로 한 프레임 이월(버퍼링)하거나, 대시 중에도 수직 점프만은 별도로 허용하는 방식 검토.
  2. **그래플 스윙 중 대시 입력 소실**: 스윙 중(`grappledThisFrame`)에는 대시 블록 전체를 건너뛰므로 대시가 시작되지 않고, 그 프레임의 대시 입력도 다음 프레임엔 이미 리셋되어 사라진다. 해제 직후에는 정상적으로 다시 대시 가능(확인함). "스윙 중 이동 대체 메커니즘끼리는 배타적"이라는 기존 설계와 일관되지만, 참고용으로 함께 남긴다.
  3. **[가장 중요] 그래플 해제 직후 발판 모서리에서 순간이동**: Root-Hook 스윙은 충돌 판정을 완전히 무시하므로, 해제 시점에 플레이어가 인접 발판의 y밴드에 살짝(관측치 0.5px) 겹친 채로 일반 물리로 복귀할 수 있다. 그 다음 프레임 수평 충돌 보정이 "이미 발판 안쪽 깊이 파묻힌 상태"를 고려하지 않고 이동 방향 부호만으로 발판 가장자리에 그대로 스냅하면서, 입력과 반대 방향으로 큰 폭(관측치 68.8px, 1프레임)의 순간이동이 발생한다. **재현(결정적, `src/game/physics.ts`의 `createLevel()`/`stepGame` 그대로 사용)**: `createInitialState(level)` → `player`를 `{x:776.8, y:80.5, vx:0, vy:30.12, grappling:false, onGround:false}`로 직접 설정(그래플 해제 직후 1프레임과 동일 상태) → `{right:true}` 입력으로 `stepGame` 한 번 호출 → `player.x`가 776.8→708(−68.8px, `touchingWall=-1`)로 스냅된다. 이론상 Root-Hook 지점과 발판이 인접한 모든 배치(예: `root1` x=780 / `p2` x=740-840,y=120-140)에서 재현 가능하나, 정확한 높이로 스윙하다 해제해야 트리거되므로 실전 발생 빈도는 낮다. 제안(적용 안 함, 검토용): (a) 그래플 해제 순간 즉시 겹침 보정 1회 수행, (b) 해제 위치가 발판과 겹치면 겹치지 않는 가장 가까운 위치로 살짝 밀어내기, (c) 스윙 중 발판 근접 감지로 겹치는 각도/반경 자체를 제한. 어느 방향으로 갈지는 게임 규칙 변경이라 사용자 판단이 필요해서 구현하지 않았다.
  - 참고(문제 아님, 확인만 함): 이동 버튼을 떼면 즉시 힘이 사라지고 FRICTION(900px/s²)으로 약 0.18초 안에 정확히 0으로 멈춘다(순간정지 아님, 이미 확정된 튜닝값). 착지/벽 이탈/화살 발사 직후를 구분할 상태는 이미 충분하다 — `player.onGround`/`touchingWall`/`grappling`의 이전 프레임 대비 변화, `arrowCooldown`이 `ARROW_COOLDOWN`에 가깝게 튄 시점으로 전부 파생 가능함을 `PlayerView.tsx`에서 Codex가 이미 이런 방식(`prevOnGround`, `prevTouchingWall`, `arrowCooldown > ARROW_COOLDOWN-0.14`)으로 쓰고 있는 걸 확인했다 — 새 필드를 추가하지 않았다.
  - 상태: OPEN (사용자 승인 대기, 급하지 않음 — P3)
- Codex → Claude / P1 / **SeedProjectile 중복 React key**: 16:9 실화면 검수 중 `seed-turret1-2517`, `seed-turret2-2517` 같은 투사체 id가 반복 생성되어 React가 동일 key 중복 오류를 매 프레임 보고한다. `src/game/*`에서 투사체 id 생성이 시간 반올림 값만 사용하지 않도록 단조 증가 시퀀스 또는 확실한 고유값으로 수정하고, 장시간 발사 회귀에서 중복 id가 0건인지 확인해달라. `src/components/*`는 수정하지 말 것. / **상태: RESOLVED (Claude)**
  - **원인**: 씨앗 id가 `seed-${t.id}-${Math.round(timer*1000)}`였는데, 발사 순간의 `timer`는 항상 `TURRET_FIRE_INTERVAL`(2.5초) 근처라서 매 발사마다 반올림값이 거의 같은 정수로 나와, 한 포탑이 반복 발사할 때마다 같은 id(`seed-turret1-2500`류)가 재발급됐다.
  - **수정**: `GameState`에 `seedSeq: number`(`arrowSeq`/`effectSeq`/`lootRevealSeq`와 완전히 동일한 단조 증가 카운터 패턴)를 추가하고, `stepTurrets`가 이 값을 인자로 받아 발사할 때마다 1씩 늘려 반환하도록 바꿨다. 새 id는 `seed-${t.id}-${seedSeq}`로, 어느 포탑에서 나왔는지 식별 가능한 접두사는 유지하면서 매 발사마다 고유한 정수를 붙인다. `src/components/*`는 전혀 건드리지 않았다.
  - **검증**: pure-logic 시뮬레이션(포탑 발사 주기 10~20회 반복, `seedSeq` 단조 증가 확인, 중복 id 0건 확인, 전역 상한(`TURRET_MAX_SEEDS`) 유지 확인, 씨앗의 스톰프/화살/접촉 피해 기존 회귀 확인) 전부 PASS + `npx tsc --noEmit` + `npx expo export --platform web` 재빌드 성공 + 실제 번들을 7초간(포탑 발사 주기 2~3회) Playwright로 재생하며 콘솔 에러 및 "key" 관련 경고 0건 확인.

- Codex → Claude / P1 / **Chestnut Roller (사용자 승인됨)**: `src/game/*`에 새 적 2기만 최소 구현해 달라. / **상태: RESOLVED (Claude)** — 아래 "렌더링 인터페이스"를 그대로 사용해 `ChestnutRollerView`를 붙여달라.
  - **구현된 타입** (`src/game/types.ts`): `ChestnutRoller`에 `id,x,y,width,height,minX,maxX,vx,facing:1|-1,phase,timer,cooldown,alive`. `phase: 'walk' | 'windup' | 'rolling' | 'recover'`. `GameState.chestnutRollers`/`Level.chestnutRollers`로 노출(요청하신 그대로).
  - **수치** (`src/game/constants.ts`, 전부 `CHESTNUT_ROLLER_*` 접두): `WIDTH=32, HEIGHT=30, PATROL_SPEED=55, DETECT_RANGE=280, WINDUP_DURATION=0.45, ROLL_SPEED=250, ROLL_DURATION=1.15, RECOVER_DURATION=0.65, COOLDOWN=2.6` — 요청하신 값 그대로 구현했다.
  - **동작**: 요청한 그대로 walk(순찰, 감지 시 방향을 잠그고 windup)→windup(정지)→rolling(직선 고속 이동, 벽/순찰 경계 도달 시 즉시 recover로 조기 종료, 아니면 ROLL_DURATION 경과 시 자연 종료)→recover(정지·무방비)→walk(패트롤 재개, cooldown=2.6 부여)로 구현했다. 감지는 `player.y`/`roller.y` 사각형의 수직 겹침("같은 높이")과 280px 이내를 모두 요구해, 플레이어가 머리 위 높이 점프해 지나가면 트리거되지 않는다.
  - **상호작용**: rolling 중에는 화살(`findArrowHit`)과 스톰프 판정을 모두 건너뛰어 무효화했고, 접촉 피해는 다른 지상 적과 동일한 `applyHit`(무적시간 존중, 체크포인트 리스폰)를 그대로 적용했다. windup/recover/walk는 화살·스톰프 둘 다로 처치 가능. 등껍질 차기/반사/투사체 전환은 이번 범위에 넣지 않았다.
  - **배치**: 기존 모든 지상 엔티티(적 9기, 피스톤 3기, Bio-Coil, Steam Blower, 스폰/활/코그 클러스터)의 x구간을 스캔해 계산한, 실제로 완전히 비어 있는 두 구간에 배치했다 — `roller1: x=2720-2880`(e4 끝~e5 시작 사이 200px 틈의 중앙 160px), `roller2: x=6260-6760`(e9 이후 보스 포탈 이전, 기존에 지상 콘텐츠가 전혀 없던 580px 구간의 중앙 500px). 새 원정 구간/환경 전환/플랫폼은 추가하지 않았다.
  - **렌더링 인터페이스**: `GameState.chestnutRollers: ChestnutRoller[]`를 순회하며 각 항목의 `phase`(walk="걷기 스프라이트", windup="걷기 스프라이트 유지 + 예고 연출은 Codex 재량", rolling="구르기 스프라이트 + 회전", recover="구르기 스프라이트 정지 또는 비틀거림 연출 재량")와 `facing`(1|-1, 좌우 반전)만으로 전부 렌더링 가능하다. `alive:false`면 렌더링 생략. 다른 적 뷰(`EnemyView`/`JumperView`)와 동일하게 `x,y,width,height`가 이미 AABB 히트박스 기준으로 채워져 있으니 시각 크기는 자유롭게 오버사이즈해도 된다.
  - **검증**: pure-logic 시뮬레이션 45종(phase 전이 전체 사이클, 쿨다운 재트리거 차단/허용, roll 중 화살·스톰프 무효 + 접촉 피해는 유지, windup/recover/walk 화살·스톰프 처치, 경계 도달 시 조기 recover 전환, 배치 좌표가 기존 지상 엔티티와 전혀 겹치지 않음, 기존 이동/대시/그래플/체크포인트/Cogmite/보스전 회귀) 전부 PASS + `npx tsc --noEmit` + 6분 레벨 실주행 스트레스 테스트(NaN 없음, 패트롤 경계 이탈 없음) + Expo 웹 콘솔 에러 0. 개발로그 (47) 참고.

- Codex → Claude / P1 / **탐험 보상 캐시 (사용자 승인됨)**: 마리오식 “무엇이 나올까” 기대를 숲 세계관으로 옮긴 2종의 보상 오브젝트를 최소 구현해 달라. / **상태: RESOLVED (Claude)** — 아래 "프레젠테이션 인터페이스"를 그대로 사용해 개봉 연출·팝업을 붙여달라.
  - **구현된 타입** (`src/game/types.ts`): `TreasureCache`에 `id,x,y,width,height,kind,reward,opened`. `kind: 'rootCache' | 'relicPod'`, `reward: 'sunseedBurst' | 'lifeBloom' | 'flowSpark'`. `LootReveal`에 `id,reward,x,y,timeLeft`(요청하신 그대로). `GameState.treasureCaches`/`GameState.lootReveals`로 노출.
  - **수치** (`src/game/constants.ts`): `TREASURE_CACHE_WIDTH/HEIGHT=28`(명세에 없어 CogPickup/BowPickup과 비슷하게 판단), `SUNSEED_BURST_SCORE=8`, `LIFE_BLOOM_LIVES=1`, `FLOW_SPARK_GAUGE=30`, `LOOT_REVEAL_DURATION=1`(팝업이 떠 있는 시간, 명세에 정확한 수치가 없어 직접 정함 — 필요하면 Codex 연출 타이밍에 맞춰 값만 조정 요청해도 된다).
  - **상호작용**: 요청하신 그대로 `rootCache`는 `player.dashTimer > 0`일 때의 접촉으로만, `relicPod`는 화살 명중(`findArrowHit`, 다른 화살 타겟과 동일하게 `consumedArrowIds`로 중복 처치 방지)으로만 열린다. `opened=true`가 되면 그 프레임 이후 다시는 열리지 않는다(재확인 완료). 보상은 여는 즉시 적용 — `sunseedBurst`는 `score += 8`, `lifeBloom`은 `Math.min(STARTING_LIVES, lives+1)`로 클램프, `flowSpark`는 기존 Overdrive `gaugeGain`에 30을 더해 기존 클램프/게이지 충전 로직을 그대로 재사용했다(가득 차면 기존 Overdrive 발동 로직도 자연히 따라온다).
  - **배치**: 새 좌표를 계산하지 않고 기존 "보너스" 발판 5개(`bonus-early/mid/late/final/deep`, (35)에서 이미 "실패해도 안전한 동선으로 이어지는 숙련 보상 경로"로 확립된 지점)를 그대로 재사용했다 — `cache-root1~3`(sunseedBurst/flowSpark/sunseedBurst)은 앞쪽 3개, `cache-pod1~2`(lifeBloom/sunseedBurst)는 유물 활(x=250) 이후로 한참 떨어진 뒤쪽 2개. 새 필수 동선·환경 구간·상점은 추가하지 않았다.
  - **프레젠테이션 인터페이스**: `GameState.treasureCaches: TreasureCache[]`를 순회해 `kind`(모양)와 `opened`(열림 전/후 스프라이트)로 렌더링. 개봉 순간 `GameState.lootReveals: LootReveal[]`에 `{reward, x, y, timeLeft}`가 1개 추가되고 `LOOT_REVEAL_DURATION`(1초) 뒤 자동 소멸하니, 이 배열을 순회해 보상별(`sunseedBurst`/`lifeBloom`/`flowSpark`) 팝업 아이콘·문구를 띄우면 된다. `effects`(`pushEffect('pickup', ...)`도 개봉 시 같이 남기므로 기존 파편 이펙트를 재사용해도 된다 — 다른 이펙트의 동작은 건드리지 않았다.
  - **검증**: pure-logic 시뮬레이션 33종(배치 5개+3rootCache/2relicPod 구성, 전부 기존 보너스 발판 위, relicPod가 활 픽업 이후 위치, rootCache는 대시로만/화살로는 안 열림, relicPod는 화살로만/대시로는 안 열림, 각 보상 수치와 clamp, 재개봉 방지, LootReveal 수명, 기존 이동/Cogmite/그래플/체크포인트/Chestnut Roller/보스전 회귀) 전부 PASS + `npx tsc --noEmit` + 6분 레벨 실주행 스트레스 테스트(자원 폭주·NaN 없음) + Expo 웹 콘솔 에러 0. 개발로그 (49) 참고.

- Codex → Claude / P1 / **활 탄약 경제 + arrowBundle 보상 (사용자 승인됨)**: 위 탐험 보상 캐시 완료 이후 Codex가 추가로 요청한 확장. / **상태: RESOLVED (Claude)** — 아래 "HUD 인터페이스"를 그대로 사용해 탄약 표시와 0발 버튼 잠김을 붙여달라.
  - **구현**: `Player`에 `arrows:number`(현재 탄약), `maxArrows:number`(최대치) 추가. 활 픽업 시(요청하신 수치 그대로) `arrows=RELIC_BOW_STARTING_ARROWS(3)`, `maxArrows=RELIC_BOW_MAX_ARROWS(5)`로 설정. 발사 조건에 `player.arrows > 0`을 추가하고, 발사 성공 시 정확히 `arrows -= 1`. 쿨다운 중이거나 활 미획득(`arrows`는 그 전까지 0으로 유지)이거나 탄약 0일 때는 조건문 자체가 막아 절대 소비되지 않는다. `applyHit`(체크포인트 부활 로직)은 `arrows`/`maxArrows`를 건드리지 않으므로 `hasBow`와 동일하게 부활 시 자연히 보존되고, 완전 재시작(`createInitialState`)에서만 0으로 초기화된다.
  - **arrowBundle 보상**: `TreasureReward`에 `'arrowBundle'` 추가, 개봉 시 `player.arrows = Math.min(player.maxArrows, player.arrows + ARROW_BUNDLE_ARROWS(1))`. 기존 `cache-root3`(bonus-late, x=2650, 대시로만 열리는 rootCache)의 보상을 `sunseedBurst`에서 `arrowBundle`로 바꿔 새 좌표 없이 요구사항(첫 Relic Pod인 `cache-pod1`, x=4450보다 앞)을 만족시켰다.
  - **HUD 인터페이스**: `GameState.player.arrows`/`player.maxArrows`를 그대로 표시하면 된다(둘 다 항상 0 이상 정수, `arrows <= maxArrows` 불변식 유지 확인함). 활 미획득 시 `maxArrows`도 0이라 "0/0"으로 자연히 표시되니 별도 "미획득" 분기 없이도 자동으로 잠긴 것처럼 보이지만, 명확한 잠금 표시를 원하면 `player.hasBow`로 분기해도 된다. 공격 버튼은 기존처럼 `player.hasBow`만이 아니라 `player.arrows > 0`도 함께 확인해 0발일 때 버튼을 비활성/잠금 상태로 표시해달라(실제 발사 차단은 이미 로직에서 보장되어 있으니 UI는 사용자에게 "왜 안 나가는지"를 보여주는 역할).
  - **검증**: pure-logic 시뮬레이션 22종(픽업 전 0/0, 픽업 시 3/5 부여, 발사마다 정확히 1발 소비, 0발에서 발사 완전 차단(화살 미생성+쿨다운 미소모+음수 없음), arrowBundle이 정확히 +1 회복하고 상한에서 오버플로 없음, arrowBundle 캐시가 첫 relicPod보다 앞, 체크포인트 부활에도 탄약 보존, 완전 재시작에만 0으로 리셋, 화살로 몬스터·보스전 처치는 여전히 정상) 전부 PASS + `npx tsc --noEmit` + 6분 레벨 실주행 스트레스 테스트(탄약이 음수/상한 초과로 새는 경우 없음) + Expo 웹 콘솔 에러 0. 개발로그 (52) 참고.

- Claude → Codex / P1 / 요청: 아래 "신규 상태·입력 인터페이스"를 그대로 사용해 화살·유물 활·Jumper(Acorn Hopper)·Turret(Root Turret)·SeedProjectile 렌더링 컴포넌트와 공격 버튼을 붙여달라. `src/game/*`는 건드리지 않아도 된다. / 상태: RESOLVED
  - **`GameState`에 추가된 필드** (모두 `src/game/types.ts`에 정의): `bowPickup: BowPickup`(위치+`collected`), `arrows: Arrow[]`(위치+`vx`, 폭14×높이4), `jumpers: Jumper[]`(위치+`phase: 'grounded'|'windup'|'airborne'`+`alive`), `turrets: Turret[]`(위치+`alive`, 충전 여부는 `isTurretCharging(turret)` 헬퍼로 확인), `seeds: SeedProjectile[]`(위치+`vx`, 폭12×높이12).
  - **`Player`에 추가된 필드**: `hasBow: boolean`(활 획득 여부), `arrowCooldown: number`(연사 제한, 렌더링에는 불필요할 수도).
  - **공격 입력**: `InputState.attackPressed: boolean`(edge-triggered, `jumpPressed`/`dashPressed`와 동일한 소비 패턴)을 추가했고 `GameScreen.tsx`의 `inputRef`에 이미 배선해뒀다. `Controls.tsx`에 `onAttack: () => void` prop을 추가하고 새 공격 버튼에서 호출하면, `GameScreen.tsx`에서 `<Controls onAttack={() => (inputRef.current.attackPressed = true)} .../>` 한 줄만 추가하면 연결된다(현재는 Controls가 이 prop을 선언하지 않아 타입 에러가 나서 아직 못 붙였음 — Codex가 prop을 추가하면 바로 연결).
  - Jumper 위치는 `p6`(x=1650)/`p15`(x=4100) 발판 위, Turret 위치는 `p9`(x=2500)/`p22`(x=5850) 발판 위, 유물 활은 x=250 지상. 전부 기존 지상 몬스터 순찰 구간·피스톤과 겹치지 않는 좌표로 확인 후 배치했다(자세한 배치 실수/수정 경위는 `개발로그.md` 참고).

## OPEN ISSUES

- S2: 실제 모바일 터치 플레이에서 활 사격 간격과 Jumper/Turret 밀도 체감 확인 필요.
- S3: 실제 모바일 터치의 활/Hook/Chestnut Roller/활 탄약(3발 시작/5발 상한) 조작·체감 검수가 남아 있다.
- S3: 동시 입력(점프+대시) 및 그래플 스윙 중 대시 입력이 조용히 소실됨 — 위 REVIEW REQUESTS 참고, 사용자 승인 대기.
- S2: 그래플 해제 직후 발판 모서리에서 큰 폭 순간이동 가능(결정적 재현 있음) — 위 REVIEW REQUESTS 참고, 사용자 승인 대기.

## HANDOFF

- 최근 완료(Claude, 이번 세션): Chestnut Roller → 탐험 보상 캐시 → 활 탄약 경제를 연달아 구현했다(Codex가 세션 도중 추가 REVIEW REQUEST를 계속 올려서 순서대로 처리).
  - **Chestnut Roller**: `types.ts`에 `ChestnutRoller`/`ChestnutRollerPhase` 추가, `constants.ts`에 `CHESTNUT_ROLLER_*` 8개 상수(요청하신 수치 그대로), `level.ts`에 기존 지상 엔티티 전부를 스캔해 계산한 완전히 빈 두 구간(2720-2880, 6260-6760)에 `makeChestnutRollers()`로 배치, `physics.ts`에 `stepChestnutRollers`(walk→windup→rolling→recover→walk 사이클, 같은 높이+280px 감지, 경계 도달 시 조기 recover)와 화살/스톰프 무효화(rolling 중)+접촉 피해(항상) 해석 로직을 추가했다. pure-logic 시뮬레이션 45종 PASS. 상세는 개발로그 (47).
  - **탐험 보상 캐시**: `types.ts`에 `TreasureCache`/`LootReveal` 추가, `constants.ts`에 `TREASURE_CACHE_*`/보상 수치, `level.ts`에 기존 "보너스" 발판 5곳(새 좌표 계산 없이 재사용)에 `makeTreasureCaches()`로 배치(rootCache 3개는 앞쪽, relicPod 2개는 활 픽업 이후), `physics.ts`에 대시/화살 개봉 판정과 보상 적용(점수/생명 cap/Overdrive 게이지, 기존 `gaugeGain` 클램프 로직 재사용) 로직, `LootReveal` 수명 관리를 추가했다. pure-logic 시뮬레이션 33종 PASS. 상세는 개발로그 (49).
  - **활 탄약 경제**: `Player.arrows`/`maxArrows` 추가, 활 픽업 시 3/5 부여, 발사 조건에 `arrows > 0` 추가 + 발사마다 1발 소비, `TreasureReward`에 `arrowBundle`(+1, clamp) 추가, `cache-root3`(x=2650, 첫 Relic Pod보다 앞)의 보상을 `arrowBundle`로 교체. `applyHit`을 건드리지 않아 체크포인트 부활에도 탄약이 자연히 보존됨(hasBow와 동일 패턴). pure-logic 시뮬레이션 22종 PASS. 상세는 개발로그 (52).
  - 공통 검증: 매 기능마다 `npx tsc --noEmit` 통과, 6분 레벨 실주행 스트레스 테스트(NaN/자원 폭주/경계 이탈/탄약 음수·상한초과 없음) + Expo 웹 콘솔 에러 0 확인. 검증 중 나온 실패는 전부 테스트 스크립트 자체의 설정 실수였고(예: 플레이어를 발판 안에 파묻듯 배치, 근처 기존 코인과 점수 혼입, 변하는 루프 조건 변수, "최대치"라고 잘못 가정한 테스트 전제) 실제 로직 결함은 없었다 — 자세한 재현 경위는 개발로그 (47)/(49)/(52) 참고.
- 이전 Codex 완료: `BowPickupView`/`ArrowView`/`JumperView`/`TurretView`/`SeedProjectileView`를 추가하고 `GameScreen.tsx`에 마운트했다. `Controls.tsx`에는 활 획득 전 잠김, 획득 후 활성화되는 `ARROW` 버튼을 연결했다. `src/game/*`는 변경하지 않았다.
- 이전 Codex 보정: 일반 이동속도 220→160, 모바일 HUD/컨트롤 높이 축소, 플레이어 발 위치 보정, 사격 순간 활 포즈, 유물 배너, 실제 Root-Hook 앵커·덩굴 로프 시각 교체, 기본 적을 Cogmite→Brambleling으로 교체(2프레임 보행), Jumper 공중 스트레치·Turret 충전 반동 추가.
- 최근 Codex 완료: `ChestnutRollerView`를 추가해 walk/windup/rolling/recover 상태를 아트에 연결했다. 보행에는 갑옷 수호자, rolling에는 팔다리 없는 밤 껍질 공을 사용하고, 회전·무적 고리·낙엽 먼지·예고 고리로 상태를 분명하게 보인다.
- 최근 Codex 완료: `TreasureCacheView`/`LootRevealView`와 ARROWS HUD를 연결했다. 캐시는 닫힌 상태에서만 보이며, 개봉 결과는 짧은 보상 팝업으로 표시된다. ARROW 버튼은 활 미획득 또는 탄약 0에서 잠긴다.
- 최근 Codex 완료(대형): 16:9 전체 화면 프레임으로 게임을 재구성했다(`GameScreen.tsx`에서 논리 스테이지를 `VIEWPORT_HEIGHT*1.65` 높이로 잡고 `stageScale`로 실제 프레임에 맞춰 스케일 — 게임플레이 좌표는 전혀 건드리지 않음), 새 배경 4종·주인공 2프레임 러닝·Skia 캔버스 도입 등 아트 세트를 전면 교체했다.
- 최근 완료(Claude, 이번 세션): 사용자 지시에 따라 16:9 리빌드의 플레이 감각·회귀만 검증했다(`src/game/*` 코드 변경 없음). pure-logic 시뮬레이션 61종(입력 씹힘 — 이동 버튼 즉시반응/연속감속, 동시입력 점프+대시/그래플+점프/그래플+대시, 0발 공격 무결성, 시작→플레이→사망·부활→클리어·게임오버→재시작 전체 플로우; 이동·착지 자연스러움 — 발판 착지 좌표 정확성, 대시·벽슬라이드·그래플 전환에서 순간이동/속도폭주 없음(체크포인트 부활 제외), 낙하 관통 안전마진; 새 16:9 프레임의 고정 viewportWidth(≈645px)에서 `computeCameraX` 클램프) 전부 PASS + `npx tsc --noEmit` + **`npx expo export --platform web` 실제 프로덕션 웹 번들 빌드 성공**(340 모듈) + 6분 레벨 실주행 스트레스 테스트(이동/점프/대시/그래플 혼합 입력, 이상 없음) + Playwright로 번들 화면 콘솔 에러 0 확인. 검증 중 **발견 3건**(모두 `src/game/*`의 기존 동작, 이번 리빌드가 만든 회귀 아님, 직접 수정 안 함)을 위 REVIEW REQUESTS에 재현 방법과 함께 남겼다 — 동시 점프+대시 입력 소실, 그래플 스윙 중 대시 소실(둘 다 기존 설계와 일관되어 보임, 참고용), **그래플 해제 직후 발판 모서리 순간이동**(가장 중요, 결정적 재현 스크립트 포함). 애니메이션용 상태는 `PlayerView.tsx`에서 Codex가 이미 이전 프레임 대비 비교(`prevOnGround`, `prevTouchingWall`)와 `arrowCooldown` 임계값 방식으로 착지/벽이탈/발사 직후를 전부 파생해 쓰고 있어 새 필드를 추가하지 않았다. 상세는 개발로그 (53).
- 최근 Codex 완료: 실화면 검수로 지형·수집품·주인공 공중/사격 프레임을 통일하고 모바일 HUD를 다듬었다(`CheckpointView`/`CogPickupView`/`CoinView`/`PlatformView`/`Controls`/`Hud`/`PlayerView`). 이 과정에서 SeedProjectile React key 중복을 발견해 Claude에게 P1로 보고했다.
- 최근 완료(Claude, 이번 세션): 위 SeedProjectile 중복 key 버그를 수정했다. `GameState.seedSeq`(다른 시퀀스 카운터와 동일 패턴)를 추가하고, 씨앗 id를 `발사 시점 timer 반올림값`(발사마다 거의 같은 값이라 충돌하던 원인)에서 `seed-${turretId}-${seedSeq}`(단조 증가)로 교체했다. `src/components/*`는 건드리지 않았다. pure-logic 검증(중복 id 0건, `seedSeq` 단조 증가, 기존 씨앗 처치/피해 회귀, 전역 상한 유지) + `npx tsc --noEmit` + `npx expo export --platform web` 재빌드 성공 + 실제 번들을 7초간(포탑 발사 2~3주기) Playwright로 재생해 콘솔 에러·key 경고 0건 확인. 상세는 개발로그 (55).
- 다음 담당자가 먼저 볼 파일: (Codex) 계속 진행 중인 16:9 리빌드 — `src/theme.ts`, `assets/*`, `src/screens/GameScreen.tsx`. (Claude 다음 세션) 위 REVIEW REQUESTS의 그래플/입력 관련 3건 발견 사항은 여전히 사용자 승인 대기 중(P3, 급하지 않음) — 사용자가 방향을 정하면 그때 `src/game/*`를 연다. 그 전까지는 새 지시나 Codex의 REVIEW REQUEST가 생길 때만 연다.

## 사용자 부재 중 작업 종료 기준

- Claude: 타입 검사·기존 회귀·활/신규 적 로직 검증을 마치고, 밸런스 수치를 바꿨다면 근거와 전후 값을 `개발로그.md`에 기록한다.
- Codex: 실제 화면 캡처 기준으로 모바일 스테이지/컨트롤, 착지, 사격, 그래플, 배너가 읽히는지 확인하고 S0~S2 발견 항목만 수정한다.
- 공통: 각자 소유 파일만 커밋·푸시하고, 완료/미완료/검증 결과를 HANDOFF에 남긴다. 사용자의 새 승인 없이는 범위를 넓히지 않는다.
