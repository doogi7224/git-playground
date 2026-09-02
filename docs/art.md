# AI 아트 파이프라인 (기획서 4장)

## 대원칙

> **AI에게 스프라이트 시트를 시키지 마세요. 반드시 실패합니다.**
> 프레임 간 일관성을 못 지킵니다. 걷기 8프레임을 뽑으면 프레임마다 얼굴이 다릅니다.

```
AI로 캐릭터 1장(정지) 고해상도 생성
  → tools/art_pipeline.py (배경 제거 · 팔레트 스냅 · 외곽선 · 노멀맵 · 아틀라스)
  → 파츠 분리 (머리/몸통/양팔/양다리/무기)
  → Godot Skeleton2D + Polygon2D 컷아웃 리깅
  → 걷기/공격/피격/사망은 리깅으로 재사용
```

캐릭터 1장으로 모든 애니메이션이 나오고, 새 캐릭터는 뼈대를 복사해서 붙인다.
8종 캐릭터 = 이미지 8장 + 리깅 재사용.

## 파이프라인 쓰는 법

```bash
pip install -r tools/requirements.txt

tools/build_art.sh                      # 적 + 플레이어 전체 빌드 (보통 이것만 쓰면 된다)
python3 tools/test_art_pipeline.py      # 자체 검증 (19개 검사)
```

`build_art.sh` 는 적과 플레이어를 **따로** 돌린다. 팔레트가 다르기 때문이다 —
적은 시안·금색을 못 쓰고(플레이어 이펙트 독점색), 플레이어는 진홍을 못 쓴다(위험 표시 독점색).

```
art/raw/enemies/*.png  → art/atlas/enemies.png + enemies_n.png + enemies_atlas.tres
art/raw/player/*.png   → art/atlas/player.png  + player_n.png  + player_atlas.tres
                         + 파츠별 AtlasTexture .tres
```

낱장으로 돌리고 싶으면:

```bash
python3 tools/art_pipeline.py --input art/raw/enemies --palette enemy --normal --atlas enemies
```

| 옵션 | 뜻 |
|---|---|
| `--palette` | `core` / `enemy` / `player` / `fx` / `danger` / `terrain` / `none` |
| `--snap-strength` | 팔레트로 끌어당기는 정도 0~1 (기본 0.85) |
| `--outline` | Sobel 내부 선 강도 |
| `--contour` | 바깥 잉크 외곽선 두께(px) |
| `--normal` | 노멀맵도 생성 (`<이름>_n.png`) |
| `--atlas 이름` | 아틀라스로 묶고 AtlasTexture `.tres` 자동 생성 |

입력 `art/raw/` → 출력 `art/processed/`, `art/atlas/`.

**`art/raw/` 와 `art/atlas/` 를 커밋한다.** 기획서는 "raw 만 커밋"이라고 했지만,
`art/atlas/` 는 게임이 **실행 중에 직접 읽는 데이터**다. 이게 없으면 클론 직후 그림이 안 나온다.
중간 산출물인 `art/processed/` 만 `.gitignore` 대상이다.

## 게임에 어떻게 붙는가

- **적**: `MapData.sprite_atlas` 에 `enemies_atlas.tres` 를 물린다. `EnemyManager` 가
  적 종류별로 아틀라스의 몇 번째 칸인지를 풀어서 셰이더에 넘긴다.
  **적이 20종이어도 MultiMesh 하나, 드로우콜 1개다.**
  아틀라스 안의 이름은 **파일 이름 = 적 id** 로 맞춘다 (`art/raw/enemies/weed.png` → `&"weed"`).
  이름이 안 맞으면 경고를 띄우고 그 적만 화이트박스로 남는다 — 조용히 엉뚱한 그림이 붙지 않는다.
- **플레이어**: `CharacterData.parts` 에 파츠별 AtlasTexture 를 넣는다.
  리깅 템플릿의 `<파츠>Sprite` 슬롯에 들어간다 (`docs/rigging.md`).

## 플레이스홀더

`tools/gen_placeholder_art.py` 가 `art/raw/` 에 임시 도형 그림을 만든다.
**AI로 뽑은 진짜 그림을 같은 파일 이름으로 덮어쓰면** 파이프라인과 게임이 그대로 돌아간다.
아트가 없으면 "아틀라스 → MultiMesh → 게임" 배선이 실제로 되는지 확인할 방법이 없어서 둔 것이다.

### 팔레트가 철칙을 강제한다

`--palette enemy` 는 후보 색에서 시안·금색을 아예 뺀다. 그래서 AI가 뭘 뱉든
적 스프라이트에는 그 색이 남지 않는다. (CLAUDE.md 규칙 6 / 기획서 3.2)
`--palette player` 는 반대로 진홍을 뺀다. 이건 취향이 아니라 **가독성 = 생존**의 문제다.
화면에 적이 500마리 있을 때 "이 색은 피해야 함"이 흔들리면 게임이 안 된다.

### 걸렸던 함정

배경 제거 폴백이 처음엔 "배경색과 비슷한 픽셀"을 전부 지웠다. 그랬더니 캐릭터 안쪽의
흰 눈동자와 밝은 금속 삽날까지 같이 사라졌다. 지금은 **테두리에서 flood fill 로 이어진
영역만** 지운다. rembg가 깔려 있으면 그쪽을 먼저 쓴다.

## 그록에게 시킬 것 / 시키면 안 되는 것

| ✅ 시킬 것 | ❌ 시키면 안 되는 것 |
|---|---|
| 컨셉아트, 무드보드 | 애니메이션 프레임 |
| 캐릭터 키비주얼 (정지 1장) | 이어지는 타일셋 (심 안 맞음) |
| 보스 일러스트 | UI 최종 레이아웃 |
| 배경 텍스처, 지형 소재 | 아이콘 세트를 개별로 뽑기 (스타일이 다 다름) |
| 무기/아이템 아이콘 원안 | 최종 게임 애셋 그대로 사용 |

**아이콘 일관성 트릭**: 한 장에 4×4 그리드로 16개를 한 번에 생성 요청 → 잘라 쓰기.

## 프롬프트 (영어로 넣을 것)

**플레이어 캐릭터**
```
Full body character illustration, top-down 3/4 view, Korean army conscript soldier
in olive drab fatigues and combat boots, holding a small field shovel,
tired but determined expression, Korean webtoon art style, thick black ink outlines,
cel shaded flat colors, muted olive and khaki palette with bright cyan rim light,
transparent background, centered, no text, sharp clean lineart, 512x512
```

**보스 (검열관)**
```
Top-down 3/4 view boss character, imposing military inspector figure made of stacked
paperwork and clipboards, red official stamps floating around, glowing crimson eyes,
Korean webtoon style, thick ink outlines, cel shading, dark khaki and crimson palette,
dramatic rim lighting, transparent background, no text, 1024x1024
```

**배경 텍스처**
```
Seamless tileable texture, packed dirt military parade ground with faint white line
markings, top-down view, muted desaturated brown and olive, subtle gravel detail,
flat cel shaded style, no shadows, no characters, no text, 1024x1024
```

**아이콘 16종 배치**
```
4x4 grid of 16 military item icons on transparent background: field shovel, canteen,
combat boots, helmet, smoke grenade, bugle, ration can, wristwatch, rank insignia,
ammo belt, radio, flashlight, entrenching tool, poncho, whistle, leave pass.
Consistent Korean webtoon icon style, thick black outlines, cel shaded,
olive and khaki palette with gold accents, each icon centered in its cell, no text
```

## 잊지 말 것

- **Steam은 AI 생성 콘텐츠 사용 시 신고 의무가 있다.** 출시 전 최신 정책을 확인할 것.
- 폰트(`Pretendard` 등)는 무료 배포라도 **게임 내장 조건이 다를 수 있다.** 확인할 것.
