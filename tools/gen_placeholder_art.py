#!/usr/bin/env python3
"""플레이스홀더 아트를 art/raw/ 에 만든다.

**이건 임시 그림이다.** AI로 뽑은 진짜 그림을 **같은 파일 이름으로** 덮어쓰면
파이프라인과 게임이 그대로 돌아간다. 프롬프트는 docs/art.md.

    python3 tools/gen_placeholder_art.py

이걸 두는 이유: 아트가 없으면 "아틀라스 → MultiMesh → 게임" 배선이 실제로 되는지
확인할 방법이 없다. 도형이라도 파이프라인을 한 번 통과시켜야 검증이 된다.
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

RAW_ENEMIES = Path("art/raw/enemies")
RAW_PLAYER = Path("art/raw/player")
BG = (236, 236, 232)          # 파이프라인이 지울 배경
INK = (44, 40, 32)


def canvas(size: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    im = Image.new("RGB", (size, size), BG)
    return im, ImageDraw.Draw(im)


def save(im: Image.Image, name: str, blur: float = 0.7) -> None:
    RAW_ENEMIES.mkdir(parents=True, exist_ok=True)
    im.filter(ImageFilter.GaussianBlur(blur)).save(RAW_ENEMIES / f"{name}.png")
    print(f"  {RAW_ENEMIES}/{name}.png")


# --- 적 5종 (기획서 5.3 잡몹 목록에서) --------------------------------------

def shovel_mob() -> None:
    """삽 — 자루 + 날. 의인화된 사물이라 눈을 붙인다."""
    im, d = canvas(256)
    d.polygon([(112, 40), (144, 40), (140, 150), (116, 150)], fill=(150, 120, 78))
    d.polygon([(92, 146), (164, 146), (150, 226), (106, 226)], fill=(126, 128, 130))
    d.polygon([(92, 146), (164, 146), (160, 162), (96, 162)], fill=(96, 98, 100))
    for cx in (118, 140):
        d.ellipse((cx - 9, 178, cx + 9, 196), fill=(250, 250, 248))
        d.ellipse((cx - 4, 184, cx + 4, 192), fill=INK)
    save(im, "shovel_mob")


def leaf_pile() -> None:
    """낙엽 — 잎 여러 장이 뭉친 덩어리."""
    im, d = canvas(256)
    rng = random.Random(3)
    for _ in range(9):
        cx = rng.randint(78, 178)
        cy = rng.randint(96, 176)
        r = rng.randint(30, 46)
        rot = rng.uniform(0, math.tau)
        pts = []
        for k in range(7):
            a = rot + math.tau * k / 7
            rad = r * (0.62 if k % 2 else 1.0)
            pts.append((cx + math.cos(a) * rad, cy + math.sin(a) * rad * 0.8))
        d.polygon(pts, fill=(rng.randint(120, 158), rng.randint(88, 112), rng.randint(46, 62)))
    for cx in (112, 146):
        d.ellipse((cx - 8, 130, cx + 8, 146), fill=(250, 250, 248))
        d.ellipse((cx - 3, 135, cx + 3, 141), fill=INK)
    save(im, "leaf_pile")


def blanket() -> None:
    """모포 — 각 잡아 개어놓은 모포. 모서리가 살아 있어야 모포다."""
    im, d = canvas(256)
    d.polygon([(56, 96), (200, 84), (204, 178), (60, 190)], fill=(108, 104, 92))
    d.polygon([(56, 96), (200, 84), (198, 108), (58, 120)], fill=(138, 134, 120))
    d.line([(60, 140), (202, 130)], fill=(84, 80, 70), width=5)
    d.line([(60, 160), (202, 150)], fill=(84, 80, 70), width=5)
    for cx in (108, 152):
        d.ellipse((cx - 9, 128, cx + 9, 146), fill=(250, 250, 248))
        d.ellipse((cx - 4, 134, cx + 4, 142), fill=INK)
    save(im, "blanket")


def snowball() -> None:
    """눈덩이 — 제설의 화신. 울퉁불퉁해야 굴러온 느낌이 난다."""
    im, d = canvas(256)
    rng = random.Random(11)
    pts = []
    for k in range(16):
        a = math.tau * k / 16
        r = 82 + rng.randint(-9, 9)
        pts.append((128 + math.cos(a) * r, 132 + math.sin(a) * r))
    d.polygon(pts, fill=(226, 228, 232))
    d.polygon([(p[0] * 0.8 + 26, p[1] * 0.8 + 12) for p in pts[:9]], fill=(244, 246, 250))
    for cx in (106, 152):
        d.ellipse((cx - 10, 120, cx + 10, 140), fill=(250, 250, 250))
        d.ellipse((cx - 5, 126, cx + 5, 136), fill=INK)
    save(im, "snowball")


def weed() -> None:
    """잡초 — 제초 작업의 화신. 뾰족한 잎이 위로."""
    im, d = canvas(256)
    rng = random.Random(7)
    for i in range(7):
        base = 108 + i * 8
        tip = 40 + rng.randint(0, 46)
        lean = rng.randint(-42, 42)
        d.polygon([(base - 9, 206), (base + 9, 206), (base + lean // 2 + 5, tip + 30),
                   (base + lean, tip)],
                  fill=(rng.randint(78, 108), rng.randint(112, 142), rng.randint(56, 76)))
    d.ellipse((88, 178, 168, 222), fill=(92, 108, 62))
    for cx in (112, 146):
        d.ellipse((cx - 8, 190, cx + 8, 206), fill=(250, 250, 248))
        d.ellipse((cx - 3, 195, cx + 3, 201), fill=INK)
    save(im, "weed")


def battalion_commander() -> None:
    """보스: 대대장 순시 — 정모 쓰고 클립보드 든 커다란 실루엣."""
    im, d = canvas(384)
    d.rounded_rectangle((104, 150, 280, 330), 26, fill=(96, 92, 66))
    d.rounded_rectangle((132, 62, 252, 158), 22, fill=(206, 176, 140))
    d.rounded_rectangle((118, 44, 266, 82), 12, fill=(72, 70, 52))   # 정모
    d.polygon([(118, 78), (266, 78), (274, 96), (110, 96)], fill=(54, 52, 40))
    d.rectangle((262, 190, 336, 288), fill=(214, 208, 190))          # 클립보드
    d.rectangle((262, 190, 336, 204), fill=(120, 116, 100))
    for y in (218, 238, 258):
        d.line([(272, y), (326, y)], fill=(120, 116, 100), width=4)
    for cx in (170, 216):
        d.ellipse((cx - 13, 104, cx + 13, 130), fill=(250, 250, 248))
        d.ellipse((cx - 6, 112, cx + 6, 124), fill=INK)
    save(im, "battalion_commander", blur=0.9)


# --- 플레이어 파츠 (컷아웃 리깅용) ------------------------------------------

def player_parts() -> None:
    """김이병 파츠. 리깅 템플릿 슬롯에 그대로 들어간다 (docs/rigging.md)."""
    def part(name: str, size: tuple[int, int], draw) -> None:
        im = Image.new("RGB", size, BG)
        draw(ImageDraw.Draw(im), size)
        RAW_PLAYER.mkdir(parents=True, exist_ok=True)
        im.filter(ImageFilter.GaussianBlur(0.6)).save(RAW_PLAYER / f"{name}.png")
        print(f"  {RAW_PLAYER}/{name}.png")

    part("kim_head", (128, 128), lambda d, s: (
        d.rounded_rectangle((16, 34, 112, 118), 20, fill=(214, 184, 142)),
        d.rounded_rectangle((10, 14, 118, 52), 14, fill=(104, 116, 72)),
        d.ellipse((38, 68, 54, 84), fill=INK),
        d.ellipse((74, 68, 90, 84), fill=INK)))

    part("kim_torso", (128, 160), lambda d, s: (
        d.rounded_rectangle((14, 10, 114, 150), 18, fill=(112, 126, 78)),
        d.line([(64, 20), (64, 144)], fill=(88, 100, 60), width=5),
        d.rectangle((22, 46, 52, 74), fill=(96, 108, 66))))

    for name, flip in (("kim_arm_l", False), ("kim_arm_r", True)):
        part(name, (56, 132), lambda d, s, f=flip: (
            d.rounded_rectangle((10, 6, 46, 108), 14, fill=(100, 114, 68)),
            d.rounded_rectangle((12, 96, 44, 126), 12, fill=(206, 176, 138))))

    for name in ("kim_leg_l", "kim_leg_r"):
        part(name, (56, 124), lambda d, s: (
            d.rounded_rectangle((10, 4, 46, 92), 12, fill=(74, 78, 66)),
            d.rounded_rectangle((6, 84, 50, 118), 10, fill=(48, 46, 40))))

    part("kim_weapon", (64, 176), lambda d, s: (
        d.rectangle((26, 8, 38, 108), fill=(150, 120, 78)),
        d.polygon([(14, 104), (50, 104), (44, 168), (20, 168)], fill=(132, 134, 136))))


def main() -> None:
    print("플레이스홀더 아트 생성 (진짜 그림으로 같은 이름으로 덮어쓰면 된다)")
    shovel_mob()
    leaf_pile()
    blanket()
    snowball()
    weed()
    battalion_commander()
    player_parts()
    print("완료. 다음: tools/build_art.sh")


if __name__ == "__main__":
    main()
