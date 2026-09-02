# 그록 재생성 요청 — 2차

1차로 받은 31장 중 **17장은 그대로 씁니다.** 아래 것만 다시 뽑으면 됩니다.

다시 뽑는 이유는 두 가지입니다.

1. **인물형 6종이 인게임 크기(112px)에서 서로 구분이 안 됩니다.**
   전부 국방색 군복을 입고 서 있는 사람이라 색도 형태도 같습니다.
   기획서의 「가독성 = 생존」에 정면으로 걸립니다 — 화면에 뭐가 들어왔는지
   0.2초 안에 읽혀야 하는데 지금은 안 읽힙니다.
   → 프롬프트에 **실루엣의 가장 넓은 부분**을 하나씩 다르게 못박았습니다
     (모자 / 어깨 / 클립보드 / 서류더미 / 군장 / 없음).

2. **플레이어 파츠에 시안색 글로우가 구워져 있습니다.** 이건 1차 프롬프트에
   `bright cyan rim light` 라고 쓴 제 잘못입니다. 시안은 게임에서 플레이어
   **공격 이펙트 전용색**이라, 몸에 항상 켜져 있으면 지금 공격 중인지가 안 보입니다.
   좌우 팔도 한쪽은 펼친 손바닥, 한쪽은 팔+주먹으로 와서 한 쌍이 아니었습니다
   (`hand open` / `hand gripping` 이라고 쓴 것도 제 잘못입니다).
   → 글로우를 빼고, 좌우 팔을 **어깨에서 주먹까지 같은 형태**로 바꿨습니다.

---

## 쓰는 법

- 1차 때 쓰던 **그 대화를 이어서** 보내세요. 새 대화를 열면 스타일이 다시 흔들립니다.
- 대화가 이미 닫혔다면 아래 「스타일 기준」을 먼저 한 번 보내고 시작하세요.
- 받은 그림은 `[파일명]` **그대로** 저장. 파일 이름이 곧 게임 속 id 입니다.
- 배경은 투명이 제일 좋지만 흰 배경이어도 됩니다 (파이프라인이 지웁니다).

---

## 스타일 기준 (대화가 끊겼을 때만)

```
Character design sheet for a Korean webtoon style top-down survival game set in a military base. Establish the art style: thick black ink outlines, cel shaded flat colors, muted brown khaki and olive palette, desaturated, top-down 3/4 view, readable simple silhouettes, transparent background, no text. Draw a single military field shovel standing upright, come to life, with simple cartoon eyes. 512x512
```

---

## ① 인물형 6종 — 우선순위 높음

저장 위치: `art/raw/enemies/`

### `battalion_commander.png` — 대대장 순시 (보스)

```
a huge barrel-chested battalion commander on inspection, very wide shoulders, oversized peaked cap, long coat flaring out to a wide triangular silhouette, hands behind back, looming, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted brown and grey palette, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 1024x1024
```

### `sergeant_major.png` — 주임원사 (중형)

```
a short stocky bald company sergeant major, extremely broad square body, hands on hips forming two triangular gaps at the waist, no hat, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted brown and grey palette, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 768x768
```

### `drill_instructor.png` — 조교 (중형)

```
a lean shouting drill instructor, wide-brimmed campaign hat as the widest part of the silhouette, whistle, one arm pointing straight out sideways, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted brown and grey palette, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 768x768
```

### `duty_officer.png` — 당직사관 (중형)

```
a thin duty officer holding a large clipboard flat in front of the chest so the board is the widest part of the silhouette, garrison cap, narrow body, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted brown and grey palette, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 768x768
```

### `inspector.png` — 사단 검열관 (보스)

```
a spindly division inspector buried under a tall stack of paper folders held in both arms, the paper stack taller than the head, thin legs, red official stamps floating around, glowing crimson eyes, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted brown and grey palette, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 1024x1024
```

### `recruit.png` — 신병 (잡몹)

```
a tiny hunched army recruit with an oversized backpack bigger than the body and a helmet too big, cartoon eyes, small round silhouette, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted brown and grey palette, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 512x512
```

---

## ② 플레이어 파츠 7종

저장 위치: `art/raw/player/`

7장이 한 몸으로 합쳐져 걷기·공격·피격·사망 애니메이션이 나옵니다.
**같은 굵기의 선, 같은 명암**으로 뽑아 주세요. 파츠마다 톤이 다르면 조립했을 때 티가 납니다.

### `kim_head.png`

```
Isolated body part of a Korean army conscript soldier: head only, front-facing, short army haircut, tired expression, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted olive and khaki palette, no glow, no rim light, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 512x512
```

### `kim_torso.png`

```
Isolated body part of a Korean army conscript soldier: torso only, olive drab field jacket, no arms, no head, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted olive and khaki palette, no glow, no rim light, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 512x512
```

### `kim_arm_l.png`

```
Isolated body part of a Korean army conscript soldier: single left arm only, from shoulder joint down to a closed fist, olive drab sleeve, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted olive and khaki palette, no glow, no rim light, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 512x512
```

### `kim_arm_r.png`

```
Isolated body part of a Korean army conscript soldier: single right arm only, from shoulder joint down to a closed fist, olive drab sleeve, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted olive and khaki palette, no glow, no rim light, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 512x512
```

### `kim_leg_l.png`

```
Isolated body part of a Korean army conscript soldier: single left leg only, fatigue trousers and combat boot, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted olive and khaki palette, no glow, no rim light, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 512x512
```

### `kim_leg_r.png`

```
Isolated body part of a Korean army conscript soldier: single right leg only, fatigue trousers and combat boot, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted olive and khaki palette, no glow, no rim light, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 512x512
```

### `kim_weapon.png`

```
Isolated body part of a Korean army conscript soldier: a small military field shovel (entrenching tool), seen from the side, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted olive and khaki palette, no glow, no rim light, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 512x512
```

---

## ③ 여유 있으면 (급하지 않음)

저장 위치: `art/raw/enemies/`

`shovel_mob` 에만 만화 눈이 빠졌습니다. 나머지 잡몹은 다 눈이 있어서 이것만 톤이 튑니다.

### `shovel_mob.png` — 야전삽

```
a military field shovel standing upright, come to life, with big simple cartoon eyes clearly drawn on the blade, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted brown and grey palette, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 512x512
```

---

## 그대로 쓰는 17장 (다시 안 뽑아도 됨)

모포 · 창고박스 · 관물대 · 페인트통 · 짬통 · 눈덩이 · 각목 · 낙엽 · 잡초 ·
보급품 · 모기 · 화생방마스크 · 연막 · 검열서류 · 눈보라 · 3주차 훈련 · 불침번

실루엣이 서로 달라서 112px 에서도 뭐가 오는지 바로 읽힙니다. 눈 달린 사물 컨셉도 일관됩니다.

---

## 다 모이면

```bash
tools/build_art.sh
python3 tools/test_art_pipeline.py
```

파일 이름만 맞으면 팔레트 스냅 · 외곽선 · 노멀맵 · 아틀라스가 자동으로 돕니다.
일부만 넣어도 빌드는 돌아갑니다 (없는 건 1차 그림이 그대로 남습니다).
