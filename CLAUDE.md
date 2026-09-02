# CLAUDE.md — 《전역까지 D-100》

> 뱀파이어 서바이벌형(Bullet Heaven) · **Godot 4.7.x** · **모바일 우선 · 세로 1080×1920 · 한 손 조작**
> 전체 기획은 `기획서.md`. 이 파일은 **작업 중 항상 지켜야 할 규칙**만 요약한다.

---

## 1. 컨셉 한 줄

**한 판 = 전역까지 남은 100일 = 실시간 20분.** 말년 병장이 밀려드는 군생활(작업·훈련·검열)을 뚫고 20분을 버티면 위병소를 통과한다.

- 승리: 20분 생존 → 위병소 통과 컷신 / 패배: 체력 0 → "전역 연기" 화면
- 핵심 루프: 이동(자동공격) → 처치 → '짬'(XP) → 진급(레벨업) → 명령서 3장 중 1장 선택 → 무기 진화 → 보스 → 전역 → 월급으로 영구 강화

### 진급 = 레벨
| 레벨 | 계급 | 연출 |
|---|---|---|
| 1–5 | 이등병 | 계급장 UI 1줄 |
| 6–15 | 일병 | 2줄, 이동속도 +5% |
| 16–30 | 상병 | 3줄, 공격속도 +5% |
| 31–50 | 병장 | 4줄, 화면 테두리 금색 글로우 |
| 50+ | 말년 | 화면 채도 상승 + BGM 변주 |

---

## 2. 절대 규칙 (위반 시 되돌리기)

1. **적/투사체/장판/픽업은 절대 개별 Node로 만들지 않는다.** `EnemyManager`가 `PackedFloat32Array` 배열로 관리하고 `MultiMeshInstance2D`로 렌더한다.
2. **Godot 물리 엔진을 쓰지 않는다.** 충돌은 자체 spatial hash grid (셀 64px).
3. **런타임 `instantiate()` 금지.** 전부 `ObjectPool`.
4. **게임 수치를 GDScript에 하드코딩하지 않는다.** 무기·적·업그레이드·웨이브는 전부 `Resource`(`.tres`).
5. **새 기능 추가 후 반드시 스트레스 테스트를 돌린다.** 모바일 목표는 **1,500마리**
   (`Settings.max_enemies`). 3,000은 데스크톱 시절 목표다 — 폰 CPU 환산으로 예산 초과.
6. **적은 시안/금색을 쓰지 않고, 플레이어 이펙트는 붉은색을 쓰지 않는다.**
7. **실제 부대명·인물명·상표명 사용 금지.** 패러디 명칭만 (`초코파이` → `찰떡파이`, 부대는 `○○사단`).
8. **구타·가혹행위·인권침해 소재 금지.** 적은 "사람"이 아니라 삽·낙엽·모포·제설·검열 서류 같은 사물/상황의 의인화.
9. 모듈 간 결합은 `EventBus` 전역 시그널로 낮춘다. UI·오디오·VFX는 전부 EventBus 구독.
10. **Camera2D 내장 `position_smoothing` 을 켜지 말 것.** 큰 프레임 델타에서 발산해
    카메라가 NaN이 되고 월드가 통째로 안 보인다. `vfx/screen_shake.gd` 가 직접 따라간다.
11. **보스도 몸통은 배열 안에 있다.** 행동만 `BossController` 노드가 굴리고, 개체는
    `spawn_tracked()` 핸들로 지목한다. 인덱스는 swap-remove 때문에 프레임을 못 넘긴다.
12. **세이브 딕셔너리 키는 전부 `String`.** Godot 4 의 Dictionary 는 `&"a"` 와 `"a"` 를
    다른 키로 보고, 저장 파일을 한 번 왕복하면 StringName 이 String 이 된다. 섞으면
    누적 통계가 조용히 0으로 리셋된다.
13. **메타 정산은 `GameState.end_run` 한 곳에서만.** 결과 화면은 돌려받은 값을 찍기만
    한다. 화면에서 `SaveSystem.record_run` 을 또 부르면 월급이 두 번 들어간다.

---

## 3. 성능 목표 ★

**1,500마리 동시 @ 60fps @ 1080×1920 세로 (모바일).** 컨테이너에서는 3,000까지 돈다.

- 적 상태 = 배열(SoA). 렌더 = **전체 적을 MultiMesh 1개**로 (기획서는 타입별 1개지만
  아틀라스 UV를 CUSTOM_DATA로 넘기면 적이 20종이어도 드로우콜 1개다). 애니메이션은 셰이더에서 UV 오프셋 + 시간 기반 bob/squash로 GPU 처리.
- 데미지 넘버는 개별 `Label` 금지 → 전용 MultiMesh + 폰트 아틀라스, 동시 최대 **120개 캡**.
- 저사양 옵션: 데미지 넘버 off, 파티클 밀도, 글로우 off, Mobile 렌더러 토글.
- 실측(컨테이너 CPU 기준): 3,000마리 물리 1틱 **7.13ms**, 드로우콜 46.
  **폰 환산 ×2.5 = 19.5ms 로 예산 초과.** 그래서 상한이 1,500이다. `docs/performance.md`
- **이 컨테이너에서 폰 성능은 못 잰다.** llvmpipe 소프트웨어 렌더러라 프레임률이 무의미하다.
  CPU 시뮬 비용과 드로우콜만 유효하고, 나머지는 실기에서 재야 한다.
  M0 그대로면 26.95ms(162%)였다. 자세한 건 `docs/performance.md`.
- **성능 검증은 M1에서 (아트 넣기 전에).** 아트 넣고 나서 성능 문제를 발견하면 재작성이다.

---

## 4. 아트 디렉션

- **고해상도 2D 카툰** (픽셀아트 아님). 한국 웹툰/애니 느낌 셀셰이딩 + 두꺼운 잉크 외곽선.
- 시점 3/4 톱다운(45° 부감). 1920×1080 기준. 캐릭터 원본 512px / 인게임 96~128px / 보스 1024px.

### 팔레트 (가독성 = 생존)
| 역할 | 색 | 규칙 |
|---|---|---|
| 배경/지형 | 국방색 `#3E4A32`, 카키 `#7A6E4E` | 채도 40% 이하 |
| 적 | 갈색·회색 | 외곽선 어둡게, 실루엣 단순화 |
| 플레이어 | 밝은 올리브 + 흰 하이라이트 | 항상 화면에서 가장 밝음 |
| 플레이어 공격 이펙트 | 시안 `#3FE0D0`, 금색 `#FFC94A` | 고채도 독점 — 적은 금지 |
| 위험(적 공격/장판) | 진홍 `#C8102E` | 이 색 = 무조건 피해야 함 |
| 회복/획득 | 연녹 `#8FE388` | |

### 히트 필 3종 (구현 완료 — `docs/graphics.md`)
1. `vfx/shaders/hit_flash.gdshader` — 피격 시 **2프레임**(시간 아님) 흰 플래시
2. 히트스톱 — 크리티컬·보스 사망 시 `time_scale` 0.05 → 0.04초 후 복구.
   **복귀 시각은 실시간으로 잰다** (게임 시간으로 세면 0.04초가 0.8초가 된다)
3. 스쿼시&스트레치 — `vfx/shaders/squash_stretch.gdshader` 정점 셰이더

**MultiMesh 로 텍스처를 그릴 때 주의**: `QuadMesh` 를 2D에서 쓰면 UV의 V가 뒤집힌다.
원은 상하 대칭이라 안 보이지만 글자·스프라이트는 바로 드러난다. `1.0 - UV.y` 로 뒤집을 것.
**`Polygon2D` 에 `AtlasTexture` 를 물리지 말 것** — UV 공간이 어긋나 텍스처가 찢어진다. `Sprite2D` 를 쓴다.

포스트: `WorldEnvironment` glow 0.6, 대비 +10%, 채도 +5%, 비네트 + 아주 약한 색수차(코너가 중앙보다 8% 어두운 정도 — 기획서가 "강하면 촌스러움"이라 못 박았다). 화면 흔들림은 Perlin 노이즈 + 강도 슬라이더(접근성, 0이면 완전 정지).
데미지 넘버는 MultiMesh + 폰트 아틀라스, 동시 120개 캡, 크리티컬 1.5배 금색.
연출은 전부 **Esc 옵션 패널**에서 개별로 끌 수 있고 저사양 프리셋도 있다.
라이팅: `CanvasModulate` 맵별 전역 톤, `PointLight2D`(총구 화염/조명탄/연막/발밑 림라이트), 주요 오브젝트에 노멀맵.

### UI 컨셉 = 군대 행정 서류
갱지 텍스처, 빨간 인장, 타자기 느낌. 레벨업 창 = 「병력 운용 명령서」 3장. 결과 화면 = 전역증 발급(도장 쾅). 폰트 `Pretendard`(SIL OFL) — **게임 내장 배포 조건 반드시 확인**.

---

## 5. 콘텐츠 구조 요약

무기 10·진화 10·패시브 10·적 20·보스 4·캐릭터 8·맵 3. 자세한 건 `docs/m3.md`
(M1 코어 루프의 배경은 `docs/m1.md`, M4 메타 진행은 `docs/m4.md`).

- 무기 동작은 `WeaponData.behavior` 로 고른다(MELEE_ARC/PROJECTILE/AURA/GROUND_AREA/THROWN).
  같은 behavior면 **새 무기 = .tres 하나**. `WeaponFactory` 가 스크립트를 붙인다.
- 진화: 무기 Lv8 + 지정 패시브 → 보스가 떨군 보물상자를 밟으면 발동 (`EvolutionRules`).
- `ProjectileManager` / `AreaManager` / `HazardManager` 도 적과 같은 SoA + MultiMesh.
  앞의 둘은 적을 때리고, `HazardManager` 는 **플레이어를 때린다**(탄막·장판·충격파, 전부 진홍색).
- 보스는 `BossData.pattern` 4종(CHARGER/BARRAGE/FIELD/FINALE)을 `BossController` 하나가 굴린다.
- 스턴/넉백은 `EnemyManager` 에 있다. **넉백 힘이 음수면 흡인**이다(잔반차).

## 6. 데이터 위치

스키마(Resource 클래스)는 `core/data/`, 값은 `data/`. 자세한 건 `docs/data.md`.

| 무엇을 바꾸려면 | 어디를 고치나 |
|---|---|
| 적 능력치·새 적 | `data/enemies/*.tres` + 맵의 `enemies` 배열 |
| 웨이브 밀도·패턴·보스 | `data/waves/*.tres` |
| 무기 수치·레벨 곡선·진화 | `data/weapons/*.tres` |
| 명령서(업그레이드) | `data/upgrades/*.tres` + `upgrade_table.tres` |
| 캐릭터 기본 스탯 | `data/characters/*.tres` |
| 보스 패턴·수치 | `data/bosses/*.tres` |
| 맵 구성(적 목록·웨이브·톤) | `data/maps/*.tres` |
| 한 판 길이·경험치 곡선·계급표·**월급 공식** | `data/progression.tres` |
| PX 상점 항목·가격 | `data/px/*.tres` + `px_shop.tres` |
| 표창장(도전과제) | `data/commendations/*.tres` + `commendation_table.tres` |
| 캐릭터·맵 해금 조건/가격 | `data/unlocks/*.tres` + `unlock_table.tres` |

**GDScript에 수치를 되돌려 넣지 말 것.** `EnemyManager`가 등록 시점에 Packed 배열로
캐시하는 건 성능 때문이며, 원본은 언제나 `.tres`다.

## 7. AI 아트 파이프라인

> **AI에게 스프라이트 시트를 시키지 마세요. 반드시 실패합니다.** 프레임 간 일관성이 안 지켜진다.

```
AI로 캐릭터 1장(정지) 고해상도 생성
  → tools/art_pipeline.py (배경 제거·팔레트 스냅·외곽선·노멀맵)
  → 파츠 분리(머리/몸통/양팔/양다리/무기)
  → entities/characters/rigged_character.tscn 슬롯에 텍스처만 끼움
  → 걷기/공격/피격/사망이 그대로 나온다 (docs/rigging.md)
```

`tools/art_pipeline.py`가 배경 제거 → **팔레트 강제 스냅** → Sobel 외곽선 강화 → 노멀맵 생성
→ 아틀라스 패킹(`.png` + AtlasTexture `.tres`)을 담당한다. 자세한 건 `docs/art.md`.

```bash
pip install -r tools/requirements.txt
tools/build_art.sh                     # 적 + 플레이어 전체 빌드
python3 tools/test_art_pipeline.py     # 자체 검증 19개
python3 tools/art_request.py           # 필요한 그림 목록 → docs/art_request.md
```

**적 그림은 아틀라스 한 장.** `MapData.sprite_atlas` 를 물리면 `EnemyManager` 가 종류별
UV 칸을 셰이더에 넘긴다 — 적이 20종이어도 MultiMesh 하나, 드로우콜 1개다.
파일 이름 = 적 id 로 맞춘다. 안 맞으면 경고 후 그 적만 화이트박스로 남는다.

**팔레트가 철칙을 강제한다.** `--palette enemy` 는 후보에서 시안·금색을 아예 빼고,
`--palette player` 는 진홍을 뺀다. AI가 뭘 뱉든 규칙 6이 지켜진다.
`art/raw/` 와 `art/atlas/` 를 커밋한다 (atlas 는 게임이 실행 중에 읽는 데이터다).
중간 산출물인 `processed/` 만 제외.

**플레이스홀더 아트가 들어 있다.** `tools/gen_placeholder_art.py` 가 만든 임시 도형이며,
AI로 뽑은 진짜 그림을 **같은 파일 이름으로 덮어쓰면** 그대로 돌아간다.

---

## 8. 폴더 구조

```
res://
├── autoload/       GameState, EventBus, AudioManager, SaveSystem, Settings, ObjectPool
├── core/
│   ├── combat/     damage_system.gd, stat_block.gd, status_effect.gd
│   ├── spawn/      spawn_director.gd, spatial_hash.gd
│   └── upgrade/    upgrade_pool.gd, evolution_rules.gd
├── entities/
│   ├── characters/ rigged_character.tscn  ← 컷아웃 리깅 템플릿
│   ├── player/     player.gd, player.tscn
│   ├── enemies/    enemy_manager.gd  ← ★ 개별 노드 아님, 데이터 배열
│   └── pickups/
├── weapons/        base_weapon.gd + 10종
├── core/data/      Resource 스키마 (.gd)
├── data/           *.tres 값 — enemies/ weapons/ upgrades/ waves/ characters/ maps/
├── ui/             hud/, level_up/, results/, meta/  ← meta/ 가 main_scene
├── vfx/            shaders/, particles/
├── maps/
├── art/            raw/ processed/ atlas/
└── tools/          art_pipeline.py, build.sh
```

---

## 9. 마일스톤 (순서대로만 진행)

| M | 기간 | 산출물 | 완료 기준 |
|---|---|---|---|
| **M0** | 1주 | 화이트박스 프로토타입 (전부 도형) | 이동+자동공격 1종+적 1종+XP+레벨업+20분 타이머가 돈다 |
| **M1** | 2주 | 코어 루프 | 무기 5·패시브 5·진화·웨이브 디렉터·보스 1·승패 화면 **+ 3,000마리 성능 검증** |
| **M2** | 2주 | 아트 1차 패스 | 아트 파이프라인, 플레이어+적 5종 실아트, 라이팅·글로우·히트필 3종 |
| **M3** | 3주 | 콘텐츠 확장 | 무기 10·패시브 10·적 20·보스 4·캐릭터 8·맵 3 |
| **M4** | 1주 | 메타 진행 | 저장, PX 상점, 해금, 표창장 |
| **M5** | 2주 | 폴리시 | 사운드, 튜토리얼, 옵션, 한/영 로컬라이즈, 최적화 |
| **M6** | 2주 | 출시 준비 | Steam 페이지, 데모 빌드, 트레일러 |

**현재 상태: M5 폴리시 진행 중.** 한/영 로컬라이즈(244개)·사운드(효과음 15종 + 스로틀링)·
옵션 확장(볼륨·언어)·튜토리얼 완료. 남은 것: BGM, 밸런스 실 플레이 조정.

한 번에 두 마일스톤 이상 진행하지 않는다. 기획서 8장의 프롬프트 팩을 순서대로 따른다.

---

## 10. 검증 도구 (새 기능 붙일 때마다 돌릴 것)

```bash
tools/test.sh          # 헤드리스 자체 검증. 실패 시 종료 코드 1
tools/test.sh --gl     # Xvfb + OpenGL 실제 렌더러 (MultiMesh 버퍼 검사 포함)
tools/screenshot.sh --out=/tmp/shot.png --seconds=80 --scale=6
tools/bench.sh         # 적 수별 물리 1틱 비용 (500~4,000마리)
tools/stress.sh --count=3000 --shot=/tmp/stress.png   # 3,000마리 유지 + 리포트
tools/menu_shot.sh --out-dir=/tmp/menu --salary=99999 --fake-progress  # 메타 화면 4종
tools/setup_godot.sh   # 컨테이너가 새로 뜨면 엔진부터 다시 받는다
tools/balance.sh       # 맵별 스폰/짬 예산과 경험치 곡선 착지 레벨
python3 tools/extract_strings.py --check   # 빠진 번역이 있으면 종료 코드 1
python3 tools/gen_sfx.py                   # 플레이스홀더 효과음 15종 합성
```

- 화면에 나오는 한국어는 **원문이 곧 번역 키다**. `locale/strings.csv` 에 en 을 채운다.
  `tr()` 은 Node 메서드라 static 함수와 Resource 에서는 못 쓴다 — `MetaUI.t()` 를 쓴다.
- 오디오는 **스로틀링이 본체다.** 3,000마리에서 요청 16,630회 중 239회만 재생된다.

- 단위 테스트만으로는 안 잡히는 게 있다. `tests/run_tests.gd` 의 **아레나 스모크 테스트**는
  실제로 한 판을 돌려서 "적이 잡히는지, 진급하는지"를 확인한다. M0에서 단위 테스트가 전부
  통과하는데도 게임에서는 28초 동안 1마리도 못 잡던 사고를 이게 잡았다.
- 새 무기/적을 추가하면 스모크 테스트 기대치도 같이 갱신할 것.
- 헤드리스(더미 렌더러)는 MultiMesh 데이터를 서버에 담지 않는다. 버퍼 레이아웃 검사는
  `--gl` 에서만 돈다.
- 인게임에서는 **F3**로 성능 오버레이(FPS/드로우콜/적 수/시뮬 ms)를 켠다.
- `tools/rigging_preview.sh   # 리깅 4종 애니메이션을 여러 컷으로 확인
tools/playthrough.sh` 로 20분 한 판을 끝까지 자동 플레이해서 밸런스를 본다.
  **배속은 8 이하.** 그보다 올리면 물리 델타가 커져서 '짬'을 통과해 버리는 가짜 결과가 나온다.
- 성능 수치와 최적화 내역은 `docs/performance.md`.

## 11. 프로젝트 설정

- Godot **4.7.x** 고정 (3.x 금지), 렌더러 **mobile**(Vulkan). gl_compatibility 는 기기 지원이
  넓지만 2D 라이팅·글로우가 떨어진다 — 저사양은 프리셋으로 그 둘을 끈다.
- 해상도 **1080×1920 세로 고정**, 스트레치 `canvas_items` / `expand`
- 조작은 **플로팅 조이스틱**(`ui/touch/`). Player 를 안 건드리고 `move_*` 액션을 눌러
  키보드·자동플레이·터치가 같은 경로로 흐른다.
- 빌드: `tools/build.sh` (`godot --headless --export-release` 래퍼)

## 12. 리스크 체크리스트

- [ ] 성능: M1에서 3,000마리 검증 완료 (아트 넣기 전에)
- [ ] 아트 일관성: 팔레트 스냅 파이프라인 가동
- [ ] 폰트 라이선스: 게임 내장 배포 조건 확인
- [ ] 상표·실명: 패러디 명칭으로 치환
- [ ] 소재 톤: 가혹행위·인권침해 소재 배제
- [ ] AI 생성물: Steam은 AI 생성 콘텐츠 **신고 의무** — 출시 전 최신 정책 확인
- [ ] 스코프: M3 콘텐츠 컷라인 정하기
