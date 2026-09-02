# 아트 주문서 (자동 생성)

> `python3 tools/art_request.py` 로 다시 만든다. **손으로 고치지 말 것** — data/ 가 원본이다.

AI로 그림을 뽑을 때 쓰는 목록이다. 규칙은 세 가지.

1. **파일 이름을 그대로 지킬 것.** 파일 이름이 곧 아틀라스 안의 이름이고, 적 id 와 같아야 게임에 붙는다.
   이름이 어긋나면 그 적만 화이트박스 도형으로 남는다(경고가 뜬다).
2. **정지 그림 1장씩.** 스프라이트 시트를 시키지 말 것 — 프레임 간 일관성이 절대 안 지켜진다.
3. **배경은 투명하게.** 안 되면 단색 배경으로 뽑아도 파이프라인이 지운다.

넣는 곳: `art/raw/enemies/` (적·보스), `art/raw/player/` (플레이어 파츠).
다 넣었으면 `tools/build_art.sh` 한 번. 지금 들어 있는 건 전부 임시 도형이라 덮어쓰면 된다.

## 색 철칙 (기획서 3.2)

- **적은 시안 `#3FE0D0` / 금색 `#FFC94A` 를 쓰지 않는다.** 플레이어 이펙트 독점색이다.
- **플레이어는 진홍 `#C8102E` 를 쓰지 않는다.** 위험 표시 독점색이다.
- 지키지 못해도 파이프라인의 팔레트 스냅이 강제로 걷어낸다. 다만 처음부터 맞추면 결과가 낫다.

## 잡몹 — 15장

화면에 수백 마리가 깔린다. **실루엣이 단순하고 서로 구분돼야 한다.** 디테일보다 형태.

| 파일 | 이름 | 프롬프트에 넣을 묘사 |
|---|---|---|
| `blanket.png` | 모포 | a folded army wool blanket, creased into sharp corners, with cartoon eyes |
| `crate.png` | 창고박스 | a large wooden storage crate with rope handles, cartoon eyes |
| `gas_mask.png` | 화생방 마스크 | an army CBRN gas mask floating upright, round filter cheeks |
| `leaf_pile.png` | 낙엽 | a pile of dry fallen leaves bound together into a creature, cartoon eyes |
| `locker.png` | 관물대 | a tall steel military footlocker cabinet with cartoon eyes |
| `mosquito.png` | 모기 | an oversized mosquito, ragged wings, military green tint |
| `night_watch.png` | 불침번 유령 | a pale translucent ghost of a night-duty soldier, faint uniform outline |
| `paint_can.png` | 페인트통 | a dented paint can with a drip running down its side, cartoon eyes |
| `plank.png` | 각목 | a heavy wooden plank of lumber, splintered edges, cartoon eyes |
| `recruit.png` | 신병 | a nervous fresh army recruit in oversized fatigues, cartoon eyes |
| `shovel_mob.png` | 삽 | a military field shovel standing upright, come to life, with simple cartoon eyes |
| `slop_can.png` | 짬통 | a battered mess-hall slop bucket, lid ajar, cartoon eyes |
| `snowball.png` | 눈덩이 | a lumpy rolled snowball with cartoon eyes, bits of gravel stuck in it |
| `supplies.png` | 자재 | a stack of tied supply bundles and sacks, cartoon eyes |
| `weed.png` | 잡초 | a tuft of stubborn weeds with cartoon eyes, sprouting from cracked dirt |

<details><summary>프롬프트 템플릿</summary>

```
{묘사}, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted brown and grey palette, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 512x512
```
</details>

## 중형 — 5장

잡몹보다 확실히 커야 한다. 한눈에 "저건 다르다"가 보여야 한다.

| 파일 | 이름 | 프롬프트에 넣을 묘사 |
|---|---|---|
| `blizzard.png` | 눈보라 | a swirling blizzard squall with faint cold eyes inside |
| `cs_gas.png` | CS가스 구름 | a rolling cloud of pale CS tear gas with faint glaring eyes inside |
| `drill_instructor.png` | 유격조교 | a lean shouting drill instructor in a field cap, whistle in mouth |
| `duty_officer.png` | 당직사관 | an imposing duty officer in dark fatigues with an armband, arms crossed |
| `sergeant_major.png` | 행보관 | a heavyset company sergeant major with a clipboard and a whistle |

<details><summary>프롬프트 템플릿</summary>

```
{묘사}, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted brown and grey palette, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 768x768
```
</details>

## 보스 — 4장

화면을 압도해야 한다. 기획서 3.1 기준 1024px.

| 파일 | 이름 | 프롬프트에 넣을 묘사 |
|---|---|---|
| `battalion_commander.png` | 대대장 순시 | an imposing battalion commander on inspection, peaked cap, long coat, hands behind back, looming |
| `discharge_delay.png` | 전역 연기 통보서 | a towering official discharge-delay notice document, red seal stamp, crimson glow, looming like a monolith |
| `drill_week3.png` | 유격 3주차 | a monstrous drill instructor of the third obstacle-course week, whistle, stopwatch, exhausted rage |
| `inspector.png` | 사단 검열관 | a division inspector figure built from stacked paperwork and clipboards, red official stamps floating around, glowing crimson eyes |

<details><summary>프롬프트 템플릿</summary>

```
{묘사}, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted brown and grey palette, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 1024x1024
```
</details>

## 플레이어 파츠 — 7장

컷아웃 리깅용이라 **파츠를 따로따로** 뽑는다 (`docs/rigging.md`).
한 장으로 뽑아서 잘라도 되지만, 팔다리는 몸통에 가려지지 않은 상태여야 한다.

| 파일 | 묘사 |
|---|---|
| `kim_head.png` | head only, front-facing, short army haircut, tired expression |
| `kim_torso.png` | torso only, olive drab field jacket, no arms, no head |
| `kim_arm_l.png` | single left arm only, olive drab sleeve, hand open |
| `kim_arm_r.png` | single right arm only, olive drab sleeve, hand gripping |
| `kim_leg_l.png` | single left leg only, fatigue trousers and combat boot |
| `kim_leg_r.png` | single right leg only, fatigue trousers and combat boot |
| `kim_weapon.png` | a small military field shovel (entrenching tool), seen from the side |

<details><summary>프롬프트 템플릿</summary>

```
Isolated body part of a Korean army conscript soldier: {묘사}, Korean webtoon art style, thick black ink outlines, cel shaded flat colors, muted olive and khaki palette with bright cyan rim light, top-down 3/4 view, transparent background, centered, no text, sharp clean lineart, 512x512
```
</details>

> 캐릭터 8종은 지금 모두 김이병 파츠를 공유한다. 캐릭터별 파츠를 뽑으면
> `data/characters/*.tres` 의 `parts` 만 새 파일로 바꿔 끼우면 된다.

## 잊지 말 것

- **Steam 은 AI 생성 콘텐츠 신고 의무가 있다.** 출시 전 최신 정책 확인.
- 실제 부대명·인물명·상표명 금지. 패러디 명칭만.
