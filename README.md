# 전역까지 D-100

한 판 = 전역까지 남은 100일 = 실시간 20분.
말년 병장이 밀려드는 군생활(작업·훈련·검열)을 뚫고 위병소를 통과하는 뱀파이어 서바이벌형(Bullet Heaven) 게임.

- **엔진**: Godot 4.7.x (Forward+ 렌더러, 1920×1080)
- **기획서**: [`기획서.md`](기획서.md)
- **작업 규칙**: [`CLAUDE.md`](CLAUDE.md) ← 코드 쓰기 전에 읽을 것

## 실행

```bash
godot --path .          # 에디터로 열기 (아직 main_scene 없음 — M0에서 추가)
```

## 빌드

```bash
tools/build.sh "Linux/X11" build/d100.x86_64
```

프리셋은 에디터의 `Project > Export` 에서 만든다. `export_presets.cfg` 는 머신마다 경로가 달라 커밋하지 않는다.

## 구조

| 경로 | 역할 |
|---|---|
| `autoload/` | GameState, EventBus, AudioManager, SaveSystem, ObjectPool |
| `core/` | 전투/스폰/업그레이드 시스템 |
| `entities/` | 플레이어, EnemyManager(배열 기반), 픽업 |
| `weapons/` | 무기 10종 |
| `data/` | 밸런싱 데이터 (`.tres`) — 수치는 전부 여기 |
| `ui/` | HUD, 레벨업 명령서, 결과(전역증), 메타 |
| `vfx/` | 셰이더, 파티클 |
| `art/` | `raw/`(AI 원본) → `processed/` → `atlas/` |
| `tools/` | `art_pipeline.py`, `build.sh` |

## 지켜야 할 선

- 적/투사체는 개별 Node 금지 → 배열 + `MultiMeshInstance2D`
- 물리 엔진 대신 spatial hash grid
- 런타임 `instantiate()` 금지 → `ObjectPool`
- 수치 하드코딩 금지 → `.tres`
- 목표: **3,000마리 @ 60fps @ 1080p**

## 진행 상황

- [x] 프롬프트 0 — 프로젝트 초기화 (뼈대)
- [ ] M0 — 화이트박스 프로토타입
- [ ] M1 — 코어 루프 + 성능 검증
- [ ] M2 — 아트 1차 패스
- [ ] M3 — 콘텐츠 확장
- [ ] M4 — 메타 진행
- [ ] M5 — 폴리시
- [ ] M6 — 출시 준비
