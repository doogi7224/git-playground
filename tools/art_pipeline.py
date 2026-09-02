#!/usr/bin/env python3
"""《전역까지 D-100》 AI 아트 후처리 파이프라인 (기획서 4.3).

AI가 뽑아준 그림이 뭐가 됐든 **자동으로 우리 게임 색으로 통일**하는 장치다.
스타일 붕괴 방지가 목적이고, 손으로 다시 칠하지 않는 게 목적이다.

    python tools/art_pipeline.py --input art/raw --palette core --normal

입력  art/raw/**.png
출력  art/processed/<이름>.png          (배경 제거 + 팔레트 스냅 + 외곽선)
      art/processed/<이름>_n.png        (--normal 일 때 노멀맵)
      art/atlas/<아틀라스>.png          (--atlas 일 때)
      art/atlas/<이름>.tres             (AtlasTexture 리소스)

의존성은 numpy / Pillow 뿐이다. rembg 는 있으면 쓰고 없으면 모서리 색 기준 폴백으로
넘어간다 — 투명 배경으로 이미 뽑아온 그림이 대부분이라 그것만으로도 대개 충분하다.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:  # pragma: no cover
    sys.exit("numpy 와 Pillow 가 필요합니다:  pip install -r tools/requirements.txt")


# --------------------------------------------------------------------------
# 팔레트 — 기획서 3.2. 이 표가 이 스크립트의 존재 이유다.
# --------------------------------------------------------------------------

TERRAIN = ["#3E4A32", "#7A6E4E", "#2A3222", "#5C5438"]        # 국방색 / 카키
ENEMY = ["#8A7B5E", "#6B5E48", "#5A5A52", "#3A3730", "#241F19"]  # 갈색·회색
# 위 다섯 색만으로 스냅하면 적 24종이 전부 같은 진흙색이 된다. 눈보라의 푸른 흰색,
# 잡초의 초록, 서류의 크림색이 통째로 갈색이 됐다 -- 원본은 다 달랐는데 파이프라인이
# 뭉갠 것이다. 규칙 6이 금지하는 건 시안(#3FE0D0)·금색(#FFC94A) 두 색이지
# "갈색만 써라" 가 아니다. 그 둘에서 충분히 먼 저채도 색을 넓혀 둔다.
ENEMY_EXTRA = [
    "#B9C0C4",  # 눈·서리 (차가운 밝은 회색)
    "#7E8A93",  # 철제 (푸른 회색)
    "#4A545C",  # 짙은 철회
    "#5E6B3A",  # 탁한 초록 (잡초·위장)
    "#3B4A26",  # 짙은 초록
    "#D8CDA9",  # 종이·서류 크림
    "#A8916A",  # 밝은 목재
    "#6E4B32",  # 녹·가죽 (붉은 갈색)
]
# 적 20종 중 절반이 사람이다(조교·행보관·불침번…). 살색이 팔레트에 없으면
# 얼굴이 전부 국방색이 된다 -- 플레이어도 같은 이유로 초록 얼굴이 됐었다.
SKIN = ["#E8C4A0", "#C99B72", "#8A5F42"]
PLAYER = ["#B7C77A", "#8C9B58", "#E8F0C8", "#FFFFFF"]         # 밝은 올리브 + 흰 하이라이트
PLAYER_FX = ["#3FE0D0", "#FFC94A"]                            # 시안 / 금색 — 적은 절대 금지
DANGER = ["#C8102E", "#7A0C1C"]                               # 진홍 — 무조건 피해야 함
HEAL = ["#8FE388"]                                            # 연녹
INK = "#1B2016"                                               # 외곽선 잉크

PALETTES: dict[str, list[str]] = {
    # 적은 시안/금색을 쓰지 않는다 (CLAUDE.md 규칙 6) — 아예 후보에서 뺀다.
    "enemy": ENEMY + ENEMY_EXTRA + SKIN + TERRAIN + [INK],
    # 플레이어 이펙트는 붉은색을 쓰지 않는다 — DANGER 를 뺀다.
    "player": PLAYER + SKIN + PLAYER_FX + TERRAIN + [INK],
    "fx": PLAYER_FX + HEAL + [INK],
    "danger": DANGER + [INK],
    "terrain": TERRAIN + [INK],
    "core": TERRAIN + ENEMY + ENEMY_EXTRA + SKIN + PLAYER + PLAYER_FX + DANGER + HEAL + [INK],
}

# 같은 색을 명암 단계로 펼친다. 6색으로 통짜 스냅하면 음영이 다 날아간다.
SHADES = (0.42, 0.62, 0.80, 1.00, 1.22)


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def build_palette(name: str) -> np.ndarray:
    """팔레트 이름 → (N, 3) uint8 배열. 각 색의 명암 단계까지 펼친 것."""
    if name == "none":
        return np.empty((0, 3), dtype=np.uint8)
    if name not in PALETTES:
        raise SystemExit(f"모르는 팔레트: {name}  (가능: {', '.join(PALETTES)}, none)")
    out: list[tuple[int, int, int]] = []
    for hex_value in PALETTES[name]:
        base = np.array(hex_to_rgb(hex_value), dtype=np.float32)
        for shade in SHADES:
            out.append(tuple(np.clip(base * shade, 0, 255).astype(np.uint8)))
    # 중복 제거 (순서 유지)
    seen: dict[tuple[int, int, int], None] = {}
    for color in out:
        seen.setdefault(color, None)
    return np.array(list(seen.keys()), dtype=np.uint8)


# --------------------------------------------------------------------------
# 색 공간 — 가까운 색을 RGB 거리로 고르면 눈에 안 맞는다. Lab 로 간다.
# --------------------------------------------------------------------------

def srgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """(..., 3) uint8/float sRGB → (..., 3) float32 CIELAB (D65)."""
    srgb = np.asarray(rgb, dtype=np.float32) / 255.0
    linear = np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)
    matrix = np.array([
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.0721750],
        [0.0193339, 0.1191920, 0.9503041],
    ], dtype=np.float32)
    xyz = linear @ matrix.T
    white = np.array([0.95047, 1.00000, 1.08883], dtype=np.float32)
    t = xyz / white
    eps = np.float32(216.0 / 24389.0)
    kappa = np.float32(24389.0 / 27.0)
    f = np.where(t > eps, np.cbrt(np.maximum(t, 1e-8)), (kappa * t + 16.0) / 116.0)
    lab = np.empty_like(f)
    lab[..., 0] = 116.0 * f[..., 1] - 16.0
    lab[..., 1] = 500.0 * (f[..., 0] - f[..., 1])
    lab[..., 2] = 200.0 * (f[..., 1] - f[..., 2])
    return lab


# --------------------------------------------------------------------------
# 파이프라인 단계
# --------------------------------------------------------------------------

def load_rgba(path: Path) -> np.ndarray:
    return np.array(Image.open(path).convert("RGBA"), dtype=np.uint8)


def remove_background(rgba: np.ndarray, tolerance: int, force: bool) -> np.ndarray:
    """배경 제거. rembg 가 있으면 쓰고, 없으면 모서리 색 기준으로 지운다.

    이미 알파가 살아 있는 그림(대부분의 '투명 배경으로 뽑아줘' 결과)은 건드리지 않는다.
    """
    alpha = rgba[..., 3]
    already_cut = bool((alpha < 250).mean() > 0.02)
    if already_cut and not force:
        return rgba

    try:
        import rembg  # type: ignore
    except ImportError:
        rembg = None

    if rembg is not None:
        cut = rembg.remove(Image.fromarray(rgba))
        return np.array(cut.convert("RGBA"), dtype=np.uint8)

    return _flood_background(rgba, tolerance)


def _flood_background(rgba: np.ndarray, tolerance: int) -> np.ndarray:
    """테두리에서 이어진 배경만 지운다.

    색만 보고 지우면 캐릭터 안쪽의 흰 눈동자나 밝은 금속까지 같이 사라진다(실제로 겪었다).
    바깥 테두리에서 flood fill 로 번져 들어간 영역만 배경으로 본다.
    """
    h, w = rgba.shape[:2]
    corner = np.concatenate([
        rgba[0:8, 0:8, :3].reshape(-1, 3), rgba[0:8, w - 8:w, :3].reshape(-1, 3),
        rgba[h - 8:h, 0:8, :3].reshape(-1, 3), rgba[h - 8:h, w - 8:w, :3].reshape(-1, 3),
    ])
    bg = tuple(int(v) for v in np.median(corner, axis=0))

    # 1픽셀 테두리를 덧대고 (0,0) 에서 한 번만 채우면 테두리에 닿은 배경이 전부 잡힌다
    padded = np.empty((h + 2, w + 2, 3), dtype=np.uint8)
    padded[:] = bg
    padded[1:-1, 1:-1] = rgba[..., :3]

    sentinel = (1, 254, 3)   # 실제 그림에 나올 일이 없는 색
    canvas = Image.fromarray(padded)
    # PIL 의 임계값은 채널별 차이의 합이라 채널 허용오차에 3을 곱한다
    ImageDraw.floodfill(canvas, (0, 0), sentinel, thresh=tolerance * 3)
    filled = np.array(canvas)[1:-1, 1:-1]
    mask = np.all(filled == np.array(sentinel, dtype=np.uint8), axis=-1)

    out = rgba.copy()
    out[..., 3] = np.where(mask, 0, out[..., 3]).astype(np.uint8)
    return out


def clean_alpha(rgba: np.ndarray, feather: float = 0.8) -> np.ndarray:
    """알파 엣지 정리. 반투명 테두리에 남은 배경색(헤일로)을 지운다.

    잘라낸 그림을 그대로 쓰면 외곽에 원래 배경색이 실처럼 남아서, 어두운 맵에 올리면
    그 실선이 눈에 띈다. 불투명 픽셀 색을 바깥으로 한 번 번지게 해서 덮는다.
    """
    alpha = rgba[..., 3].astype(np.float32) / 255.0
    solid = alpha > 0.55

    rgb = rgba[..., :3].astype(np.float32)
    # 불투명 영역 색을 사방으로 1픽셀 확장
    filled = rgb.copy()
    weight = solid.astype(np.float32)[..., None]
    acc = rgb * weight
    acc_w = weight.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        acc += np.roll(rgb * weight, (dy, dx), axis=(0, 1))
        acc_w += np.roll(weight, (dy, dx), axis=(0, 1))
    spread = np.where(acc_w > 0, acc / np.maximum(acc_w, 1e-6), filled)
    rgb = np.where(solid[..., None], rgb, spread)

    smoothed = np.array(
        Image.fromarray((alpha * 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(feather)),
        dtype=np.float32) / 255.0
    # 부드럽게 만든 뒤 다시 세워서 흐릿한 가장자리를 줄인다
    alpha_out = np.clip((smoothed - 0.35) / 0.35, 0.0, 1.0)

    out = np.empty_like(rgba)
    out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[..., 3] = (alpha_out * 255).astype(np.uint8)
    return out


def snap_palette(rgba: np.ndarray, palette: np.ndarray, strength: float) -> np.ndarray:
    """모든 픽셀을 팔레트에서 가장 가까운 색으로 끌어당긴다 (Lab 거리 기준).

    strength 1.0 이면 완전히 갈아끼우고, 0.7 정도면 원본 질감을 조금 남긴다.
    """
    if palette.size == 0 or strength <= 0.0:
        return rgba
    h, w = rgba.shape[:2]
    pixels = rgba[..., :3].reshape(-1, 3)
    lab_pixels = srgb_to_lab(pixels)
    lab_palette = srgb_to_lab(palette)

    # (P, 3) 과 (N, 3) 의 제곱거리 — 청크로 나눠서 메모리 폭발을 막는다
    nearest = np.empty(lab_pixels.shape[0], dtype=np.int32)
    chunk = 200_000
    for start in range(0, lab_pixels.shape[0], chunk):
        block = lab_pixels[start:start + chunk]
        d = ((block[:, None, :] - lab_palette[None, :, :]) ** 2).sum(axis=2)
        nearest[start:start + chunk] = d.argmin(axis=1)

    snapped = palette[nearest].astype(np.float32)
    mixed = pixels.astype(np.float32) * (1.0 - strength) + snapped * strength

    out = rgba.copy()
    out[..., :3] = np.clip(mixed, 0, 255).astype(np.uint8).reshape(h, w, 3)
    return out


def _sobel(gray: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    kx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
    ky = kx.T
    padded = np.pad(gray, 1, mode="edge")
    gx = np.zeros_like(gray)
    gy = np.zeros_like(gray)
    for j in range(3):
        for i in range(3):
            window = padded[j:j + gray.shape[0], i:i + gray.shape[1]]
            gx += window * kx[j, i]
            gy += window * ky[j, i]
    return gx, gy


def add_outline(rgba: np.ndarray, interior: float, contour: int) -> np.ndarray:
    """Sobel 엣지로 내부 선을 어둡게 하고, 실루엣 바깥에 두꺼운 잉크 외곽선을 두른다.

    기획서 3.1의 "두꺼운 잉크 외곽선"이 이 게임 스타일의 핵심이다. AI 결과물은 선이
    얇거나 흐린 경우가 많아서 여기서 강제로 세운다.
    """
    ink = np.array(hex_to_rgb(INK), dtype=np.float32)
    rgb = rgba[..., :3].astype(np.float32)
    alpha = rgba[..., 3].astype(np.float32) / 255.0

    if interior > 0.0:
        gray = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
        gx, gy = _sobel(gray * alpha)
        magnitude = np.sqrt(gx * gx + gy * gy)
        peak = float(np.percentile(magnitude, 99.0)) or 1.0
        edge = np.clip(magnitude / peak, 0.0, 1.0) * interior
        rgb = rgb * (1.0 - edge[..., None]) + ink * edge[..., None]

    if contour > 0:
        mask = Image.fromarray((alpha * 255).astype(np.uint8))
        grown = np.array(mask.filter(ImageFilter.MaxFilter(contour * 2 + 1)),
                         dtype=np.float32) / 255.0
        ring = np.clip(grown - alpha, 0.0, 1.0)
        rgb = rgb * (1.0 - ring[..., None]) + ink * ring[..., None]
        alpha = np.maximum(alpha, grown)

    out = np.empty_like(rgba)
    out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[..., 3] = (alpha * 255).astype(np.uint8)
    return out


def make_normal_map(rgba: np.ndarray, strength: float, blur: float) -> np.ndarray:
    """밝기를 높이맵으로 보고 노멀맵을 만든다 (기획서 3.3 — 조명 받으면 입체감).

    진짜 조각한 노멀은 아니지만, 셀셰이딩 그림에서는 밝은 쪽이 대체로 튀어나온 쪽이라
    PointLight2D 를 받았을 때 충분히 입체로 보인다.
    """
    rgb = rgba[..., :3].astype(np.float32)
    alpha = rgba[..., 3].astype(np.float32) / 255.0
    gray = (rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)) * alpha
    if blur > 0.0:
        gray = np.array(
            Image.fromarray(gray.astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur)),
            dtype=np.float32)

    gx, gy = _sobel(gray / 255.0)
    nx = -gx * strength
    ny = -gy * strength
    nz = np.ones_like(nx)
    length = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx / length, ny / length, nz / length

    out = np.empty(rgba.shape, dtype=np.uint8)
    out[..., 0] = ((nx * 0.5 + 0.5) * 255).astype(np.uint8)
    out[..., 1] = ((ny * 0.5 + 0.5) * 255).astype(np.uint8)
    out[..., 2] = ((nz * 0.5 + 0.5) * 255).astype(np.uint8)
    out[..., 3] = rgba[..., 3]
    return out


def downscale(rgba: np.ndarray, max_size: int) -> np.ndarray:
    """긴 변을 max_size 로 맞춘다. 키우지는 않는다.

    배경 제거 직후, 팔레트 스냅과 외곽선보다 먼저 부른다. 순서가 중요하다 —
    외곽선 두께가 px 단위라서, 큰 그림에 외곽선을 그린 뒤 줄이면 선이 같이 얇아진다.
    """
    if max_size <= 0:
        return rgba
    h, w = rgba.shape[:2]
    longest = max(h, w)
    if longest <= max_size:
        return rgba
    scale = max_size / float(longest)
    size = (max(1, int(round(w * scale))), max(1, int(round(h * scale))))
    return np.array(Image.fromarray(rgba).resize(size, Image.LANCZOS))


def trim(rgba: np.ndarray, padding: int = 2) -> np.ndarray:
    """투명한 여백을 잘라낸다. 아틀라스 낭비를 막는다."""
    alpha = rgba[..., 3]
    rows = np.where(alpha.any(axis=1))[0]
    cols = np.where(alpha.any(axis=0))[0]
    if rows.size == 0 or cols.size == 0:
        return rgba
    top, bottom = rows[0], rows[-1] + 1
    left, right = cols[0], cols[-1] + 1
    cropped = rgba[top:bottom, left:right]
    if padding <= 0:
        return cropped
    h, w = cropped.shape[:2]
    out = np.zeros((h + padding * 2, w + padding * 2, 4), dtype=np.uint8)
    out[padding:padding + h, padding:padding + w] = cropped
    return out


# --------------------------------------------------------------------------
# 아틀라스 패킹
# --------------------------------------------------------------------------

@dataclass
class Placed:
    name: str
    x: int
    y: int
    w: int
    h: int


## 흔한 GPU 최대 텍스처가 16384 다. 절반을 상한으로 둔다 — 모바일은 더 낮다.
MAX_ATLAS_SIDE = 8192


def pack_atlas(images: list[tuple[str, np.ndarray]], width: int, gap: int
               ) -> tuple[np.ndarray, list[Placed]]:
    """선반(shelf) 패킹. 높이 내림차순으로 줄을 채운다.

    최적 패킹은 아니지만 스프라이트 수십~수백 장이면 낭비가 5% 안쪽이고,
    무엇보다 결과가 매번 같아서 diff 가 조용하다.
    """
    ordered = sorted(images, key=lambda item: item[1].shape[0], reverse=True)
    placed: list[Placed] = []
    x = y = shelf_height = 0
    for name, image in ordered:
        h, w = image.shape[:2]
        if w > width:
            raise SystemExit(f"'{name}' 가 아틀라스 폭보다 넓다 ({w} > {width}). --atlas-width 를 키우세요.")
        if x + w > width:
            x = 0
            y += shelf_height + gap
            shelf_height = 0
        placed.append(Placed(name, x, y, w, h))
        x += w + gap
        shelf_height = max(shelf_height, h)

    total = y + shelf_height
    height = 1
    while height < total:
        height *= 2
    # 실기에서 안 뜨는 아틀라스를 조용히 만들어 두지 않는다.
    # 1024px 원본을 안 줄이고 24장 packing 했더니 1024x32768 이 나온 적이 있다.
    if height > MAX_ATLAS_SIDE:
        raise SystemExit(
            f"아틀라스가 {width}x{height} 로 너무 크다 (한 변 {MAX_ATLAS_SIDE} 초과). "
            "--max-size 로 원본을 줄이거나 --atlas-width 를 키우세요.")
    canvas = np.zeros((max(height, 1), width, 4), dtype=np.uint8)
    lookup = {name: image for name, image in images}
    for spot in placed:
        canvas[spot.y:spot.y + spot.h, spot.x:spot.x + spot.w] = lookup[spot.name]
    return canvas, placed


def _res_path(path: Path) -> str:
    """디스크 경로 → Godot res:// 경로. 프로젝트 밖이면 경고만 하고 그대로 쓴다."""
    try:
        relative = path.resolve().relative_to(Path.cwd().resolve())
        return f"res://{relative.as_posix()}"
    except ValueError:
        print(f"  경고: {path} 가 프로젝트 폴더 밖이라 res:// 경로를 못 만듭니다.",
              file=sys.stderr)
        return f"res://{path.as_posix().lstrip('/')}"


def write_sprite_atlas(out_dir: Path, name: str, atlas_res_path: str,
                       normal_res_path: str | None, placed: list[Placed],
                       canvas_size: tuple[int, int]) -> None:
    """Godot 이 읽는 SpriteAtlas 리소스. 적 MultiMesh 셰이더가 이 UV 표를 그대로 받는다."""
    width, height = canvas_size
    ordered = sorted(placed, key=lambda p: p.name)
    names = ", ".join(f'&"{p.name}"' for p in ordered)
    regions = ", ".join(
        f"{p.x / width:.6f}, {p.y / height:.6f}, {p.w / width:.6f}, {p.h / height:.6f}"
        for p in ordered)
    sizes = ", ".join(f"{p.w}, {p.h}" for p in ordered)

    steps = 3 if normal_res_path else 2
    lines = [f'[gd_resource type="Resource" script_class="SpriteAtlas" load_steps={steps + 1} format=3]', ""]
    lines.append('[ext_resource type="Script" path="res://core/data/sprite_atlas.gd" id="1_script"]')
    lines.append(f'[ext_resource type="Texture2D" path="{atlas_res_path}" id="2_tex"]')
    if normal_res_path:
        lines.append(f'[ext_resource type="Texture2D" path="{normal_res_path}" id="3_normal"]')
    lines += ["", "[resource]", 'script = ExtResource("1_script")',
              'texture = ExtResource("2_tex")']
    if normal_res_path:
        lines.append('normal_texture = ExtResource("3_normal")')
    lines += [f"names = Array[StringName]([{names}])",
              f"regions = PackedVector4Array({regions})",
              f"sizes = PackedVector2Array({sizes})", ""]
    (out_dir / f"{name}_atlas.tres").write_text("\n".join(lines), encoding="utf-8")


def write_atlas_tres(out_dir: Path, atlas_res_path: str, placed: list[Placed]) -> None:
    for spot in placed:
        (out_dir / f"{spot.name}.tres").write_text(
            f'''[gd_resource type="AtlasTexture" load_steps=2 format=3]

[ext_resource type="Texture2D" path="{atlas_res_path}" id="1_atlas"]

[resource]
atlas = ExtResource("1_atlas")
region = Rect2({spot.x}, {spot.y}, {spot.w}, {spot.h})
''', encoding="utf-8")


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="AI 아트 후처리 — 배경 제거 → 팔레트 스냅 → 외곽선 → 노멀맵 → 아틀라스")
    parser.add_argument("--input", default="art/raw", help="입력 폴더 (기본 art/raw)")
    parser.add_argument("--processed", default="art/processed", help="출력 폴더")
    parser.add_argument("--atlas-dir", default="art/atlas", help="아틀라스 출력 폴더")
    parser.add_argument("--palette", default="core",
                        help=f"팔레트: {', '.join(PALETTES)}, none")
    parser.add_argument("--snap-strength", type=float, default=0.85,
                        help="팔레트로 끌어당기는 정도 0~1 (기본 0.85)")
    parser.add_argument("--outline", type=float, default=0.55, help="내부 선 강도 0~1")
    parser.add_argument("--contour", type=int, default=3, help="바깥 잉크 외곽선 두께(px)")
    parser.add_argument("--normal", action="store_true", help="노멀맵도 생성")
    parser.add_argument("--normal-strength", type=float, default=2.4)
    parser.add_argument("--normal-blur", type=float, default=1.6)
    parser.add_argument("--atlas", metavar="이름", help="아틀라스로 묶어서 저장")
    parser.add_argument("--atlas-width", type=int, default=2048)
    parser.add_argument("--atlas-gap", type=int, default=2)
    parser.add_argument("--max-size", type=int, default=0,
                        help="긴 변이 이 픽셀을 넘으면 줄인다 (0이면 안 줄임). "
                             "AI 원본은 1024~2048px 로 나오는데 그대로 아틀라스에 박으면 "
                             "GPU 최대 텍스처 크기를 넘긴다.")
    parser.add_argument("--no-trim", action="store_true", help="투명 여백을 자르지 않음")
    parser.add_argument("--bg-tolerance", type=int, default=42,
                        help="rembg 없을 때 모서리 색 허용오차")
    parser.add_argument("--force-cutout", action="store_true",
                        help="이미 알파가 있어도 배경 제거를 다시 시도")
    args = parser.parse_args(argv)

    in_dir = Path(args.input)
    if not in_dir.is_dir():
        print(f"입력 폴더가 없습니다: {in_dir}", file=sys.stderr)
        return 1

    sources = sorted(p for p in in_dir.rglob("*")
                     if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"})
    if not sources:
        print(f"{in_dir} 에 이미지가 없습니다. AI로 뽑은 원본을 여기에 넣으세요.")
        return 0

    processed_dir = Path(args.processed)
    processed_dir.mkdir(parents=True, exist_ok=True)
    palette = build_palette(args.palette)

    print(f"팔레트 '{args.palette}' — {len(palette)}색 (명암 단계 포함)")
    packed: list[tuple[str, np.ndarray]] = []
    normals: dict[str, np.ndarray] = {}

    for path in sources:
        name = path.stem
        rgba = load_rgba(path)
        rgba = remove_background(rgba, args.bg_tolerance, args.force_cutout)
        rgba = downscale(rgba, args.max_size)
        rgba = clean_alpha(rgba)
        rgba = snap_palette(rgba, palette, args.snap_strength)
        rgba = add_outline(rgba, args.outline, args.contour)
        if not args.no_trim:
            rgba = trim(rgba)

        out_path = processed_dir / f"{name}.png"
        Image.fromarray(rgba).save(out_path)
        line = f"  {path.name} → {out_path.name}  {rgba.shape[1]}x{rgba.shape[0]}"

        if args.normal:
            normal = make_normal_map(rgba, args.normal_strength, args.normal_blur)
            Image.fromarray(normal).save(processed_dir / f"{name}_n.png")
            normals[name] = normal
            line += "  (+노멀맵)"
        print(line)
        packed.append((name, rgba))

    if args.atlas:
        atlas_dir = Path(args.atlas_dir)
        atlas_dir.mkdir(parents=True, exist_ok=True)
        canvas, placed = pack_atlas(packed, args.atlas_width, args.atlas_gap)
        atlas_png = atlas_dir / f"{args.atlas}.png"
        Image.fromarray(canvas).save(atlas_png)
        res_path = _res_path(atlas_png)
        write_atlas_tres(atlas_dir, res_path, placed)

        # 노멀맵도 같은 자리에 굽는다. 배치가 같아야 UV 표를 공유할 수 있다.
        normal_res: str | None = None
        if normals:
            normal_canvas = np.zeros_like(canvas)
            # 노멀맵의 "평평한" 기본값은 (128, 128, 255) 다. 빈 칸을 0으로 두면 조명이 깨진다.
            normal_canvas[..., 0] = 128
            normal_canvas[..., 1] = 128
            normal_canvas[..., 2] = 255
            normal_canvas[..., 3] = 0
            for spot in placed:
                if spot.name in normals:
                    normal_canvas[spot.y:spot.y + spot.h, spot.x:spot.x + spot.w] = normals[spot.name]
            normal_png = atlas_dir / f"{args.atlas}_n.png"
            Image.fromarray(normal_canvas).save(normal_png)
            normal_res = _res_path(normal_png)

        write_sprite_atlas(atlas_dir, args.atlas, res_path, normal_res, placed,
                           (canvas.shape[1], canvas.shape[0]))
        (atlas_dir / f"{args.atlas}.json").write_text(
            json.dumps({p.name: {"x": p.x, "y": p.y, "w": p.w, "h": p.h} for p in placed},
                       indent=2, ensure_ascii=False), encoding="utf-8")
        used = sum(p.w * p.h for p in placed)
        total = canvas.shape[0] * canvas.shape[1]
        print(f"아틀라스 {atlas_png}  {canvas.shape[1]}x{canvas.shape[0]}  "
              f"({len(placed)}장, 채움률 {100.0 * used / max(total, 1):.1f}%)")
        print(f"AtlasTexture .tres {len(placed)}개 + {args.atlas}_atlas.tres (SpriteAtlas) 저장.")

    print(f"완료 — {len(sources)}장")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
