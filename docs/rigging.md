# 컷아웃 리깅 템플릿 (기획서 프롬프트 7)

**AI에게 스프라이트 시트를 시키지 마세요. 반드시 실패합니다.**
프레임 간 일관성을 못 지켜서, 걷기 8프레임을 뽑으면 프레임마다 얼굴이 다릅니다.

대신 **정지 그림 1장을 파츠로 잘라서 뼈대에 끼운다.** 애니메이션은 뼈대가 만든다.
캐릭터 8종 = 이미지 8장 + 리깅 0번.

```
AI로 캐릭터 1장(정지) 고해상도 생성
  → tools/art_pipeline.py (배경 제거 · 팔레트 스냅 · 외곽선 · 노멀맵)
  → 파츠 분리 (머리/몸통/양팔/양다리/무기)
  → 이 템플릿의 슬롯에 텍스처만 끼움
  → 걷기/공격/피격/사망이 그대로 나온다
```

## 파일

| 파일 | 역할 |
|---|---|
| `entities/characters/rigged_character.tscn` | 뼈대 + 파츠 슬롯 + 4개 애니메이션 |
| `entities/characters/rigged_character.gd` | 파츠 교체 / 애니메이션 재생 API |
| `tools/gen_rig_template.py` | 위 씬을 찍어내는 생성기 |
| `tools/rigging_preview.sh` | 4개 애니메이션을 여러 컷으로 찍어서 눈으로 확인 |

## 뼈대

```
Skeleton2D
└─ Hip
   ├─ Torso
   │  ├─ Head
   │  ├─ ArmL   (먼 쪽 팔 — 몸통 뒤, z -1)
   │  └─ ArmR   (가까운 쪽 팔 — 몸통 앞, z 3)
   │     └─ Weapon  (z 4)
   ├─ LegL  (z -2)
   └─ LegR  (z -1)
```

파츠 슬롯은 뼈마다 **두 개**다.
- `<이름>Part` — `Polygon2D` 플레이스홀더 도형. 텍스처가 없을 때만 보인다.
- `<이름>Sprite` — `Sprite2D`. 실제 그림이 여기 붙고, 붙는 순간 플레이스홀더는 숨는다.

> **왜 그림은 Polygon2D 가 아니라 Sprite2D 인가**
> `Polygon2D` 에 `AtlasTexture` 를 물리면 텍스처가 갈래갈래 찢어진다.
> `AtlasTexture.get_rid()` 가 region 이 아니라 **전체 아틀라스**의 RID를 돌려주는데
> `Polygon2D` 의 UV 는 `get_size()`(= region 크기) 기준이라 배율이 안 맞기 때문이다.
> `Sprite2D` 는 region 을 스스로 처리한다. 기획서는 "Polygon2D"라고 적었지만
> 컷아웃은 파츠를 통째로 돌리는 방식이라 어느 쪽이든 결과가 같고, 아틀라스를 쓰려면 Sprite2D 여야 한다.
> 나중에 천·머리카락처럼 정점 스키닝이 필요한 파츠가 생기면 그 파츠만 Polygon2D 로 되돌리면 된다.

둘 다 각 `Bone2D` 의 자식이다. 뼈가 돌면 파츠가 따라 돈다.
**정점 스키닝(Polygon2D 의 bones/weights)은 쓰지 않는다** — 컷아웃은 파츠를 통째로
돌리는 방식이고, 그게 손으로 관리하기 훨씬 안전하다. 천이나 머리카락처럼 휘어야 하는
파츠가 생기면 그때 그 파츠만 스키닝하면 된다.

### z_index 가 3/4 시점을 만든다
이게 없으면 팔을 아무리 휘둘러도 몸통에 파묻혀서 안 보인다.
먼 쪽 팔·다리는 몸통 뒤로, 가까운 쪽 팔과 무기는 앞으로 보낸다.

## 새 캐릭터 붙이기

1. AI로 캐릭터 정지 1장 생성 (프롬프트는 `docs/art.md`)
2. `tools/art_pipeline.py --palette player` 로 후처리
3. 파츠 7개로 잘라서 각각 투명 배경 PNG로 저장
   (`head.png`, `torso.png`, `arm_l.png`, `arm_r.png`, `leg_l.png`, `leg_r.png`, `weapon.png`)
4. 씬을 상속(에디터에서 우클릭 → 새 상속 씬)하고 각 `*Part` 노드의 `texture` 를 끼운다

코드로 끼울 수도 있다:

```gdscript
var rig: RiggedCharacter = preload("res://entities/characters/rigged_character.tscn").instantiate()
rig.set_part(&"Head", load("res://art/processed/kim_head.png"))
rig.set_part(&"Torso", load("res://art/processed/kim_torso.png"))
rig.set_part(&"Weapon", load("res://art/processed/shovel.png"))
add_child(rig)
```

`set_part()` 는 텍스처 크기에 맞춰 폴리곤과 UV를 자동으로 다시 만든다.
직접 다듬은 실루엣을 지키고 싶으면 `fit_polygon_to_texture = false` 로 끄면 된다.

**뼈의 위치는 안 건드려도 되게 파츠를 자르는 게 핵심이다.** 어깨는 어깨 위치에,
골반은 골반 위치에 오도록 잘라두면 캐릭터가 바뀌어도 애니메이션이 그대로 맞는다.
체격이 많이 다른 캐릭터(예: 보스)는 상속 씬에서 뼈 위치만 조금 옮긴다.

## 애니메이션 4종

| 이름 | 길이 | 반복 | 내용 |
|---|---|---|---|
| `walk` | 0.66s | O | 팔다리 교차 스윙 + 몸통 상하 반동(반 박자로 두 번) |
| `attack` | 0.42s | X | **예비 동작**(뒤로 당김) → 큰 스윙 → 복귀 |
| `hit` | 0.28s | X | 흰 플래시 + 상체 킥 + 뒤로 밀림 |
| `die` | 0.90s | X | 옆으로 쓰러지며 페이드아웃 |

공격에 예비 동작이 없으면 타격감이 안 산다. 0.12초짜리 뒤로 당기는 동작이
전체 길이의 1/4을 먹지만 이게 없으면 그냥 팔이 순간이동한 것처럼 보인다.

```gdscript
rig.play_walk()     # 대기는 play_idle() — 걷기를 0.35배속으로 돌린다
rig.play_attack()   # 끝나면 자동으로 walk 로 돌아온다
rig.play_hit()
rig.play_die()      # 잠긴다. revive() 전에는 다른 애니메이션으로 안 넘어간다
rig.set_facing(-1)  # 좌우 반전 — 뼈대를 통째로 뒤집는다
```

## 확인하는 법

```bash
tools/rigging_preview.sh --out=/tmp/rig --shots=4
```

4개 애니메이션을 나란히 돌리면서 여러 시점의 PNG를 찍는다.
**정지 화면 한 장으로는 "움직이는지"를 못 본다.**

`tools/test.sh` 의 `test_rigging_template()` 은 매번 다음을 확인한다.
- 파츠 슬롯 7개가 전부 있는가
- 애니메이션 4개가 있고 트랙이 붙어 있는가
- **트랙 경로가 실제 노드를 가리키는가** (오타 하나면 조용히 아무 일도 안 일어난다)
- 걷기가 반복되고 사망은 반복되지 않는가
- 실제로 뼈가 움직이는가 (같은 애니메이션의 두 시점에서 다리 각도가 다른가)

## 뼈대를 바꿀 때

`tools/gen_rig_template.py` 의 `BONES` / `ANIMATIONS` 를 고치고 다시 돌린다.
AnimationPlayer 트랙을 손으로 `.tscn` 에 쓰면 경로 오타 하나로 조용히 안 도는 트랙이 생긴다.
한 번 만든 뒤 자잘한 조정은 에디터에서 직접 해도 된다 — 생성기는 큰 구조를 바꿀 때만 다시 돌린다.

> 4.7 함정: `Bone2D` 의 프로퍼티는 `auto_calculate_length_and_angle` 이다.
> `autocalculate_...` 로 쓰면 조용히 무시되고 "No Bone2D children" 경고가 뜬다.
