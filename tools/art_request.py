#!/usr/bin/env python3
"""필요한 그림 목록을 data/ 에서 뽑아 docs/art_request.md 로 만든다.

AI(그록 등)로 아트를 뽑을 때 쓰는 **주문서**다. 손으로 관리하면 반드시 어긋난다 —
적을 하나 추가했는데 목록에 안 넣거나, 파일 이름을 다르게 쓰거나.
이 스크립트는 실제 .tres 를 읽으므로 항상 최신이다.

    python3 tools/art_request.py

파일 이름이 곧 아틀라스 안의 이름이고, 그게 적 id 와 같아야 게임에 붙는다.
"""

from __future__ import annotations

import re
from pathlib import Path

DATA = Path("data")
OUT = Path("docs/art_request.md")
OUT_PROMPTS = Path("docs/art_prompts.txt")

STYLE_ENEMY = ("Korean webtoon art style, thick black ink outlines, cel shaded flat colors, "
               "muted brown and grey palette, top-down 3/4 view, transparent background, "
               "centered, no text, sharp clean lineart")
STYLE_PLAYER = ("Korean webtoon art style, thick black ink outlines, cel shaded flat colors, "
                "muted olive and khaki palette with bright cyan rim light, top-down 3/4 view, "
                "transparent background, centered, no text, sharp clean lineart")

# 적 id → 영어 묘사. 기획서 5.3 의 "사물·상황의 의인화" 를 영어로 옮긴 것.
DESCRIPTIONS = {
    "shovel_mob": "a military field shovel standing upright, come to life, with simple cartoon eyes",
    "weed": "a tuft of stubborn weeds with cartoon eyes, sprouting from cracked dirt",
    "leaf_pile": "a pile of dry fallen leaves bound together into a creature, cartoon eyes",
    "snowball": "a lumpy rolled snowball with cartoon eyes, bits of gravel stuck in it",
    "blanket": "a folded army wool blanket, creased into sharp corners, with cartoon eyes",
    "locker": "a tall steel military footlocker cabinet with cartoon eyes",
    "mosquito": "an oversized mosquito, ragged wings, military green tint",
    "night_watch": "a pale translucent ghost of a night-duty soldier, faint uniform outline",
    "recruit": "a nervous fresh army recruit in oversized fatigues, cartoon eyes",
    "plank": "a heavy wooden plank of lumber, splintered edges, cartoon eyes",
    "paint_can": "a dented paint can with a drip running down its side, cartoon eyes",
    "supplies": "a stack of tied supply bundles and sacks, cartoon eyes",
    "crate": "a large wooden storage crate with rope handles, cartoon eyes",
    "gas_mask": "an army CBRN gas mask floating upright, round filter cheeks",
    "slop_can": "a battered mess-hall slop bucket, lid ajar, cartoon eyes",
    "duty_officer": "an imposing duty officer in dark fatigues with an armband, arms crossed",
    "sergeant_major": "a heavyset company sergeant major with a clipboard and a whistle",
    "drill_instructor": "a lean shouting drill instructor in a field cap, whistle in mouth",
    "cs_gas": "a rolling cloud of pale CS tear gas with faint glaring eyes inside",
    "blizzard": "a swirling blizzard squall with faint cold eyes inside",
    "battalion_commander": ("an imposing battalion commander on inspection, peaked cap, "
                            "long coat, hands behind back, looming"),
    "inspector": ("a division inspector figure built from stacked paperwork and clipboards, "
                  "red official stamps floating around, glowing crimson eyes"),
    "drill_week3": ("a monstrous drill instructor of the third obstacle-course week, "
                    "whistle, stopwatch, exhausted rage"),
    "discharge_delay": ("a towering official discharge-delay notice document, red seal stamp, "
                        "crimson glow, looming like a monolith"),
}

PARTS = {
    "kim_head": "head only, front-facing, short army haircut, tired expression",
    "kim_torso": "torso only, olive drab field jacket, no arms, no head",
    "kim_arm_l": "single left arm only, olive drab sleeve, hand open",
    "kim_arm_r": "single right arm only, olive drab sleeve, hand gripping",
    "kim_leg_l": "single left leg only, fatigue trousers and combat boot",
    "kim_leg_r": "single right leg only, fatigue trousers and combat boot",
    "kim_weapon": "a small military field shovel (entrenching tool), seen from the side",
}


def read_field(text: str, name: str) -> str:
    match = re.search(rf"^{name} = (.+)$", text, re.MULTILINE)
    return match.group(1).strip() if match else ""


def unquote(value: str) -> str:
    return value.strip().removeprefix('&"').removeprefix('"').removesuffix('"')


def collect(folder: str) -> list[dict]:
    out = []
    for path in sorted((DATA / folder).glob("*.tres")):
        text = path.read_text(encoding="utf-8")
        out.append({
            "id": unquote(read_field(text, "id")) or path.stem,
            "name": unquote(read_field(text, "display_name")),
            "elite": read_field(text, "is_elite") == "true",
            "radius": read_field(text, "radius"),
        })
    return out


def main() -> None:
    enemies = collect("enemies")
    bosses = {b["id"] for b in collect("bosses")}
    mobs = [e for e in enemies if e["id"] not in bosses and not e["elite"]]
    elites = [e for e in enemies if e["id"] not in bosses and e["elite"]]
    boss_rows = [e for e in enemies if e["id"] in bosses]

    lines: list[str] = [
        "# 아트 주문서 (자동 생성)",
        "",
        "> `python3 tools/art_request.py` 로 다시 만든다. **손으로 고치지 말 것** — data/ 가 원본이다.",
        "",
        "AI로 그림을 뽑을 때 쓰는 목록이다. 규칙은 세 가지.",
        "",
        "1. **파일 이름을 그대로 지킬 것.** 파일 이름이 곧 아틀라스 안의 이름이고, 적 id 와 같아야 게임에 붙는다.",
        "   이름이 어긋나면 그 적만 화이트박스 도형으로 남는다(경고가 뜬다).",
        "2. **정지 그림 1장씩.** 스프라이트 시트를 시키지 말 것 — 프레임 간 일관성이 절대 안 지켜진다.",
        "3. **배경은 투명하게.** 안 되면 단색 배경으로 뽑아도 파이프라인이 지운다.",
        "",
        "넣는 곳: `art/raw/enemies/` (적·보스), `art/raw/player/` (플레이어 파츠).",
        "다 넣었으면 `tools/build_art.sh` 한 번. 지금 들어 있는 건 전부 임시 도형이라 덮어쓰면 된다.",
        "",
        "## 색 철칙 (기획서 3.2)",
        "",
        "- **적은 시안 `#3FE0D0` / 금색 `#FFC94A` 를 쓰지 않는다.** 플레이어 이펙트 독점색이다.",
        "- **플레이어는 진홍 `#C8102E` 를 쓰지 않는다.** 위험 표시 독점색이다.",
        "- 지키지 못해도 파이프라인의 팔레트 스냅이 강제로 걷어낸다. 다만 처음부터 맞추면 결과가 낫다.",
        "",
    ]

    def section(title: str, rows: list[dict], size: int, style: str, note: str = "") -> None:
        lines.append(f"## {title} — {len(rows)}장")
        lines.append("")
        if note:
            lines.append(note)
            lines.append("")
        lines.append("| 파일 | 이름 | 프롬프트에 넣을 묘사 |")
        lines.append("|---|---|---|")
        for row in rows:
            desc = DESCRIPTIONS.get(row["id"], "(묘사 미정 — tools/art_request.py 에 추가할 것)")
            lines.append(f"| `{row['id']}.png` | {row['name']} | {desc} |")
        lines.append("")
        lines.append("<details><summary>프롬프트 템플릿</summary>")
        lines.append("")
        lines.append("```")
        lines.append(f"{{묘사}}, {style}, {size}x{size}")
        lines.append("```")
        lines.append("</details>")
        lines.append("")

    section("잡몹", mobs, 512, STYLE_ENEMY,
            "화면에 수백 마리가 깔린다. **실루엣이 단순하고 서로 구분돼야 한다.** 디테일보다 형태.")
    section("중형", elites, 768, STYLE_ENEMY,
            "잡몹보다 확실히 커야 한다. 한눈에 \"저건 다르다\"가 보여야 한다.")
    section("보스", boss_rows, 1024, STYLE_ENEMY,
            "화면을 압도해야 한다. 기획서 3.1 기준 1024px.")

    lines.append(f"## 플레이어 파츠 — {len(PARTS)}장")
    lines.append("")
    lines.append("컷아웃 리깅용이라 **파츠를 따로따로** 뽑는다 (`docs/rigging.md`).")
    lines.append("한 장으로 뽑아서 잘라도 되지만, 팔다리는 몸통에 가려지지 않은 상태여야 한다.")
    lines.append("")
    lines.append("| 파일 | 묘사 |")
    lines.append("|---|---|")
    for name, desc in PARTS.items():
        lines.append(f"| `{name}.png` | {desc} |")
    lines.append("")
    lines.append("<details><summary>프롬프트 템플릿</summary>")
    lines.append("")
    lines.append("```")
    lines.append(f"Isolated body part of a Korean army conscript soldier: {{묘사}}, "
                 f"{STYLE_PLAYER}, 512x512")
    lines.append("```")
    lines.append("</details>")
    lines.append("")
    lines.append("> 캐릭터 8종은 지금 모두 김이병 파츠를 공유한다. 캐릭터별 파츠를 뽑으면")
    lines.append("> `data/characters/*.tres` 의 `parts` 만 새 파일로 바꿔 끼우면 된다.")
    lines.append("")
    lines.append("## 잊지 말 것")
    lines.append("")
    lines.append("- **Steam 은 AI 생성 콘텐츠 신고 의무가 있다.** 출시 전 최신 정책 확인.")
    lines.append("- 실제 부대명·인물명·상표명 금지. 패러디 명칭만.")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")

    # --- 복붙용: 완성된 프롬프트를 파일 이름과 함께 쭉 적어둔다 ---------------
    # 템플릿에 {묘사} 를 직접 끼워 넣게 하면 실수한다. 완성본을 준다.
    prompts: list[str] = [
        "# 그록에 그대로 붙여넣는 프롬프트 (자동 생성 — tools/art_request.py)",
        "#",
        "# 쓰는 법",
        "#   1) 아래 '스타일 기준' 을 맨 먼저 한 번 보낸다. 그 결과가 마음에 들 때까지 다듬는다.",
        "#   2) 마음에 들면 그 대화를 이어가면서 나머지를 하나씩 보낸다.",
        "#      (새 대화를 열면 스타일이 다시 흔들린다)",
        "#   3) 받은 그림을 [파일] 이름 그대로 저장한다. 이름이 곧 게임 안의 id 다.",
        "#   4) 다 모으면:  tools/build_art.sh",
        "",
        "=" * 78,
        "스타일 기준 — 이걸 맨 먼저",
        "=" * 78,
        "",
        ("Character design sheet for a Korean webtoon style top-down survival game set in "
         "a military base. Establish the art style: thick black ink outlines, cel shaded "
         "flat colors, muted brown khaki and olive palette, desaturated, top-down 3/4 view, "
         "readable simple silhouettes, transparent background, no text. "
         "Draw a single military field shovel standing upright, come to life, with simple "
         "cartoon eyes. 512x512"),
        "",
        "# 위 결과가 마음에 들면 그 대화에서 아래를 하나씩 이어서 보낸다.",
        "",
    ]

    def block(title: str, rows: list[tuple[str, str, str]], style: str, size: int) -> None:
        prompts.append("=" * 78)
        prompts.append(title)
        prompts.append("=" * 78)
        prompts.append("")
        for filename, label, desc in rows:
            prompts.append(f"[{filename}]  {label}")
            prompts.append(f"{desc}, {style}, {size}x{size}")
            prompts.append("")

    block("잡몹 15장 (512px)",
          [(f"{r['id']}.png", r["name"], DESCRIPTIONS.get(r["id"], "")) for r in mobs],
          STYLE_ENEMY, 512)
    block("중형 5장 (768px) — 잡몹보다 확실히 크게",
          [(f"{r['id']}.png", r["name"], DESCRIPTIONS.get(r["id"], "")) for r in elites],
          STYLE_ENEMY, 768)
    block("보스 4장 (1024px) — 화면을 압도하게",
          [(f"{r['id']}.png", r["name"], DESCRIPTIONS.get(r["id"], "")) for r in boss_rows],
          STYLE_ENEMY, 1024)

    prompts.append("=" * 78)
    prompts.append("플레이어 파츠 7장 (512px) — 파츠를 따로따로")
    prompts.append("=" * 78)
    prompts.append("")
    prompts.append("# 팔다리는 몸통에 가려지지 않은 상태여야 한다. 잘라 붙일 조각이라서.")
    prompts.append("")
    for name, desc in PARTS.items():
        prompts.append(f"[{name}.png]")
        prompts.append(f"Isolated body part of a Korean army conscript soldier: {desc}, "
                       f"{STYLE_PLAYER}, 512x512")
        prompts.append("")

    prompts += [
        "=" * 78,
        "잘 안 나올 때",
        "=" * 78,
        "",
        "# 배경이 안 지워진다      → \"plain flat white background\" 를 붙여서 다시. 파이프라인이 지운다.",
        "# 그림자가 딸려온다        → \"no drop shadow, no ground shadow\" 추가.",
        "# 시점이 정면이 된다      → \"seen from above at a 45 degree angle\" 로 바꿔 말한다.",
        "# 스타일이 흔들린다        → 앞에서 잘 나온 그림을 다시 첨부하고 \"same style as this\" 라고 한다.",
        "# 글자가 들어간다          → \"no text, no letters, no watermark\" 추가.",
        "# 색이 너무 화려하다      → 그냥 둬도 된다. 팔레트 스냅이 게임 색으로 강제로 맞춘다.",
        "",
    ]
    OUT_PROMPTS.write_text("\n".join(prompts) + "\n", encoding="utf-8")
    total = len(mobs) + len(elites) + len(boss_rows) + len(PARTS)
    print(f"{OUT_PROMPTS} 생성 — 복붙용 프롬프트")
    print(f"{OUT} 생성 — 총 {total}장 "
          f"(잡몹 {len(mobs)} / 중형 {len(elites)} / 보스 {len(boss_rows)} / 파츠 {len(PARTS)})")


if __name__ == "__main__":
    main()
