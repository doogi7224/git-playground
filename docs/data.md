# 데이터 주도 구조 (기획서 프롬프트 3)

**게임 수치는 GDScript에 없다.** 전부 `data/` 의 `.tres` 다.
밸런싱은 코드를 건드리지 않고 이 파일들만 고쳐서 한다. (CLAUDE.md 규칙 4)

## 스키마는 `core/data/`, 값은 `data/`

| 스키마 (`core/data/*.gd`) | 인스턴스 (`data/**/*.tres`) | 무엇 |
|---|---|---|
| `EnemyData` | `data/enemies/` | 적 1종 — 체력·속도·반경·접촉피해·짬·색 |
| `WeaponData` | `data/weapons/` | 무기 1종 — 동작 방식(behavior) + 수치 + 레벨 곡선 + 진화 |
| `UpgradeData` | `data/upgrades/` | 명령서 1장 — 스탯 가산 또는 무기 지급 |
| `UpgradeTable` | `data/upgrades/upgrade_table.tres` | 레벨업 때 뽑을 후보 목록 |
| `WaveData` / `WaveTable` | `data/waves/` | 1분 구간별 밀도·패턴·엘리트 확률·보스 |
| `CharacterData` | `data/characters/` | 캐릭터 1종 — 기본 스탯 + 시작 무기 |
| `MapData` | `data/maps/` | 맵 1종 — 등장하는 적 목록 + 웨이브 테이블 + 색 |
| `ProgressionData` | `data/progression.tres` | 한 판 길이, D-카운트, 경험치 곡선, 계급표 |

기획서 6.1은 `data/` 에 `.tres`만 두라고 했다. Resource **클래스**(스키마)는 코드이므로
`core/data/` 에 뒀다. 값과 스키마를 섞지 않기 위해서다.

## 흔한 작업

**적 추가** → `data/enemies/새적.tres` 만들고 `data/maps/*.tres` 의 `enemies` 배열과
웨이브의 `enemy_ids` 에 넣는다. 코드 수정 없음.

**밀도 곡선 조정** → `data/waves/parade_ground_waves.tres` 의 `spawns_per_second` 만 고친다.

**무기 추가** → `data/weapons/새무기.tres`. `behavior` 가 이미 구현돼 있으면 코드 수정 없음.
새 동작이 필요하면 `weapons/` 에 스크립트 하나 만들고 `WeaponFactory.SCRIPTS` 에 등록한다.
`MELEE_ARC` 하나에 야전삽·예초기가 같이 올라간다 — 정체성은 전부 .tres에 있다.

**캐릭터 추가** → `data/characters/새캐릭.tres`. `Arena` 의 `character` 만 바꿔 끼우면 된다.

## 성능 때문에 캐시하는 곳 (수정할 때 주의)

`EnemyManager` 는 `EnemyData` 의 속도·반경·색을 등록 시점에 `PackedArray` 로 복사해 둔다.
매 프레임 3,000번 읽는 값을 Resource 프로퍼티로 접근하면 그것만으로 느려지기 때문이다.
**런 도중에 `.tres` 를 고쳐도 이미 등록된 적에게는 반영되지 않는다.** 다시 시작해야 한다.

## 오타 방지

`tests/run_tests.gd` 의 `test_data_resources()` 가 매번 확인한다.

- 모든 `.tres` 가 로드되는가
- 웨이브가 부르는 적 id가 맵의 적 목록에 실제로 있는가 (오타 잡기)
- 밀도가 시간에 따라 오르고, 20분 직전 1분은 소강인가 (기획서 5.4)
- 명령서에 id/제목이 있고, 최대 레벨이면 다시 안 나오고, 한 번에 중복이 없는가
- 무기 레벨 곡선이 실제로 세지고 빨라지는가

`.tres` 를 고친 뒤에는 `tools/test.sh` 를 돌릴 것.
