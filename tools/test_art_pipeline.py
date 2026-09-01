#!/usr/bin/env python3
"""아트 파이프라인 자체 검증.  python3 tools/test_art_pipeline.py

샘플 이미지를 임시 폴더에 만들어 돌려보고, 기획서 3.2의 철칙이 실제로 강제되는지 본다.
실패하면 종료 코드 1.
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import numpy as np
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("numpy 와 Pillow 가 필요합니다:  pip install -r tools/requirements.txt")

import art_pipeline as ap

FAILURES: list[str] = []
CHECKS = 0


def check(ok: bool, label: str) -> None:
    global CHECKS
    CHECKS += 1
    if not ok:
        FAILURES.append(label)
        print(f"  [FAIL] {label}")


def make_sample(path: Path, body: tuple[int, int, int], accent: tuple[int, int, int],
                bg: tuple[int, int, int] = (235, 235, 235)) -> None:
    im = Image.new("RGB", (256, 256), bg)
    d = ImageDraw.Draw(im)
    d.ellipse((28, 28, 228, 228), fill=body, outline=(60, 55, 50), width=3)
    d.ellipse((84, 92, 116, 124), fill=(252, 252, 252))     # 안쪽 밝은 점 — 지워지면 안 된다
    d.ellipse((140, 92, 172, 124), fill=(252, 252, 252))
    d.rectangle((110, 150, 146, 200), fill=accent)
    im.save(path)


def main() -> int:
    print("=== 아트 파이프라인 검증 ===")

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        raw = root / "raw"
        out = root / "processed"
        atlas = root / "atlas"
        raw.mkdir()

        # 적: 일부러 금지색(시안)을 섞어 넣는다
        make_sample(raw / "mob.png", (150, 110, 190), (63, 224, 208))
        make_sample(raw / "mob2.png", (120, 160, 90), (255, 201, 74))

        print("[enemy 팔레트 — 적은 시안/금색을 쓰지 않는다]")
        rc = ap.main(["--input", str(raw), "--processed", str(out), "--atlas-dir", str(atlas),
                      "--palette", "enemy", "--normal", "--atlas", "enemies"])
        check(rc == 0, "파이프라인이 정상 종료한다")

        processed = sorted(out.glob("*.png"))
        check(len([p for p in processed if not p.stem.endswith("_n")]) == 2,
              "이미지 2장이 처리됐다")
        check(len([p for p in processed if p.stem.endswith("_n")]) == 2,
              "노멀맵 2장이 생겼다")

        forbidden = np.array([ap.hex_to_rgb("#3FE0D0"), ap.hex_to_rgb("#FFC94A")],
                             dtype=np.float32)
        for path in [p for p in processed if not p.stem.endswith("_n")]:
            rgba = np.array(Image.open(path).convert("RGBA"), dtype=np.uint8)
            opaque = rgba[rgba[..., 3] > 200][:, :3].astype(np.float32)
            check(opaque.size > 0, f"{path.name}: 불투명 픽셀이 남아 있다")
            if opaque.size:
                # 금지색과의 최소 거리 — enemy 팔레트에는 후보 자체가 없으므로 멀어야 한다
                dist = np.linalg.norm(opaque[:, None, :] - forbidden[None, :, :], axis=2).min()
                check(dist > 40.0,
                      f"{path.name}: 적 스프라이트에 시안/금색이 남지 않는다 (최소거리 {dist:.1f})")

        print("[배경 제거 — 테두리에서 이어진 것만 지운다]")
        rgba = np.array(Image.open(out / "mob.png").convert("RGBA"), dtype=np.uint8)
        alpha = rgba[..., 3]
        check(alpha.max() == 255, "실루엣이 불투명하게 남아 있다")
        check((alpha == 0).any(), "바깥 배경이 지워졌다")
        # 안쪽 밝은 점: 배경과 색이 비슷해도 테두리에서 안 이어져 있으니 남아야 한다
        h, w = alpha.shape
        inner = alpha[int(h * 0.30):int(h * 0.55), int(w * 0.25):int(w * 0.75)]
        check((inner > 200).mean() > 0.9,
              "캐릭터 안쪽 밝은 부분이 살아 있다 (불투명 비율 %.2f)" % (inner > 200).mean())

        print("[아틀라스]")
        check((atlas / "enemies.png").exists(), "아틀라스 PNG 가 생겼다")
        check((atlas / "enemies.json").exists(), "매니페스트가 생겼다")
        for name in ("mob", "mob2"):
            tres = atlas / f"{name}.tres"
            check(tres.exists(), f"{name}.tres 가 생겼다")
            if tres.exists():
                text = tres.read_text(encoding="utf-8")
                check("AtlasTexture" in text and "region = Rect2(" in text,
                      f"{name}.tres 가 AtlasTexture 형식이다")

        sheet = np.array(Image.open(atlas / "enemies.png").convert("RGBA"))
        check(sheet.shape[1] == 2048, "아틀라스 폭이 지정한 대로다")
        check(sheet.shape[0] & (sheet.shape[0] - 1) == 0, "아틀라스 높이가 2의 거듭제곱이다")

        print("[팔레트 none — 스냅을 끄면 원본 색이 남는다]")
        out2 = root / "processed2"
        ap.main(["--input", str(raw), "--processed", str(out2), "--palette", "none"])
        a = np.array(Image.open(out / "mob.png").convert("RGB"), dtype=np.int16)
        b = np.array(Image.open(out2 / "mob.png").convert("RGB"), dtype=np.int16)
        check(a.shape == b.shape and np.abs(a - b).mean() > 5.0,
              "스냅 켠 것과 끈 것의 결과가 실제로 다르다")

    print(f"--- {CHECKS}개 검사 중 {len(FAILURES)}개 실패 ---")
    return 1 if FAILURES else 0


if __name__ == "__main__":
    raise SystemExit(main())
