#!/usr/bin/env python3
"""컷아웃 리깅 템플릿 씬을 생성한다 (기획서 프롬프트 7).

AnimationPlayer 트랙을 손으로 .tscn 에 쓰면 오타 하나로 조용히 안 도는 트랙이 생긴다.
뼈대와 애니메이션을 여기서 데이터로 정의하고 씬을 찍어낸다.

    python3 tools/gen_rig_template.py

한 번 만든 뒤에는 Godot 에디터에서 직접 고쳐도 된다. 뼈대를 크게 바꿀 때만 다시 돌린다.
"""

from __future__ import annotations

from pathlib import Path

OUT = Path("entities/characters/rigged_character.tscn")

# --- 뼈대 (3/4 톱다운. 부모 기준 상대 위치) ---------------------------------
# name, parent, position, length, 파츠 폴리곤, 색, z_index
#
# z_index 가 3/4 시점의 앞뒤를 만든다. 먼 쪽 팔·다리는 몸통 뒤로, 가까운 쪽 팔과 무기는 앞으로.
# 이게 없으면 팔을 휘둘러도 몸통에 파묻혀서 안 보인다.
BONES = [
    ("Hip",    None,    (0, 0),     18, None, None, 0),
    ("Torso",  "Hip",   (0, -34),   40,
     [(-27, -6), (27, -6), (31, 42), (-31, 42)], "#7C8C52", 0),
    ("Head",   "Torso", (0, -30),   30,
     [(-24, -26), (24, -26), (27, 8), (0, 22), (-27, 8)], "#D8C89A", 2),
    ("ArmL",   "Torso", (-27, -2),  44,
     [(-8, -6), (8, -6), (10, 44), (-10, 44)], "#5B6B3C", -1),   # 먼 쪽 팔 — 몸통 뒤
    ("ArmR",   "Torso", (27, -2),   44,
     [(-8, -6), (8, -6), (10, 44), (-10, 44)], "#8B9C5C", 3),    # 가까운 쪽 팔 — 몸통 앞
    ("Weapon", "ArmR",  (2, 42),    56,
     [(-5, -4), (5, -4), (5, 46), (-5, 46)], "#8A7B5E", 4),
    ("LegL",   "Hip",   (-13, 6),   40,
     [(-10, 0), (10, 0), (12, 40), (-12, 40)], "#3C4038", -2),
    ("LegR",   "Hip",   (13, 6),    40,
     [(-10, 0), (10, 0), (12, 40), (-12, 40)], "#4A4E42", -1),
]

# 삽날 — 무기 파츠는 두 조각이라 따로 붙인다
WEAPON_BLADE = ([(-13, 44), (13, 44), (10, 74), (-10, 74)], "#9AA0A6")


def color_literal(hex_value: str) -> str:
    """.tscn 은 Color("#RRGGBB") 를 못 읽는다. 실수 4개로 써야 한다."""
    h = hex_value.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    return f"Color({r:.6f}, {g:.6f}, {b:.6f}, 1)"


def bone_path(name: str) -> str:
    """루트 기준 노드 경로."""
    chain = [name]
    lookup = {b[0]: b[1] for b in BONES}
    while lookup[chain[-1]] is not None:
        chain.append(lookup[chain[-1]])
    return "Skeleton2D/" + "/".join(reversed(chain))


# --- 애니메이션 -------------------------------------------------------------
# 트랙: (노드경로:프로퍼티, [(시간, 값), ...])
def sway(bone: str, a: float, b: float, period: float) -> tuple[str, list]:
    return (f"{bone_path(bone)}:rotation",
            [(0.0, a), (period * 0.5, b), (period, a)])


WALK = 0.66
ANIMATIONS = {
    "walk": {
        "length": WALK,
        "loop": True,
        "tracks": [
            sway("LegL", -0.34, 0.34, WALK),
            sway("LegR", 0.34, -0.34, WALK),
            sway("ArmL", 0.26, -0.26, WALK),
            sway("ArmR", -0.26, 0.26, WALK),
            # 몸통은 반 박자로 두 번 흔들려야 걷는 느낌이 난다
            ("Skeleton2D:position", [(0.0, "Vector2(0, 0)"), (WALK * 0.25, "Vector2(0, -3)"),
                                     (WALK * 0.5, "Vector2(0, 0)"), (WALK * 0.75, "Vector2(0, -3)"),
                                     (WALK, "Vector2(0, 0)")]),
            (f"{bone_path('Head')}:rotation", [(0.0, 0.05), (WALK * 0.5, -0.05), (WALK, 0.05)]),
        ],
    },
    "attack": {
        "length": 0.42,
        "loop": False,
        "tracks": [
            # 뒤로 당겼다가 크게 휘두른다. 예비 동작이 없으면 타격감이 안 산다.
            (f"{bone_path('ArmR')}:rotation", [(0.0, 0.0), (0.12, -0.85), (0.26, 1.45), (0.42, 0.0)]),
            (f"{bone_path('Weapon')}:rotation", [(0.0, 0.0), (0.12, -0.5), (0.26, 0.9), (0.42, 0.0)]),
            (f"{bone_path('Torso')}:rotation", [(0.0, 0.0), (0.12, -0.18), (0.26, 0.30), (0.42, 0.0)]),
            (f"{bone_path('ArmL')}:rotation", [(0.0, 0.0), (0.26, -0.35), (0.42, 0.0)]),
        ],
    },
    "hit": {
        "length": 0.28,
        "loop": False,
        "tracks": [
            (":modulate", [(0.0, "Color(1, 1, 1, 1)"), (0.04, "Color(2.2, 2.2, 2.2, 1)"),
                           (0.12, "Color(1, 1, 1, 1)")]),
            (f"{bone_path('Torso')}:rotation", [(0.0, 0.0), (0.06, 0.26), (0.28, 0.0)]),
            (f"{bone_path('Head')}:rotation", [(0.0, 0.0), (0.06, 0.34), (0.28, 0.0)]),
            ("Skeleton2D:position", [(0.0, "Vector2(0, 0)"), (0.06, "Vector2(-9, 2)"),
                                     (0.28, "Vector2(0, 0)")]),
        ],
    },
    "die": {
        "length": 0.9,
        "loop": False,
        "tracks": [
            ("Skeleton2D:rotation", [(0.0, 0.0), (0.55, 1.45), (0.9, 1.57)]),
            ("Skeleton2D:position", [(0.0, "Vector2(0, 0)"), (0.9, "Vector2(-14, 26)")]),
            (f"{bone_path('LegL')}:rotation", [(0.0, 0.0), (0.9, 0.5)]),
            (f"{bone_path('LegR')}:rotation", [(0.0, 0.0), (0.9, -0.35)]),
            (f"{bone_path('ArmR')}:rotation", [(0.0, 0.0), (0.9, 0.9)]),
            (":modulate", [(0.0, "Color(1, 1, 1, 1)"), (0.55, "Color(1, 1, 1, 1)"),
                           (0.9, "Color(1, 1, 1, 0)")]),
        ],
    },
}


def fmt_value(v) -> str:
    return v if isinstance(v, str) else f"{v}"


def animation_block(anim_id: str, name: str, spec: dict) -> str:
    lines = [f'[sub_resource type="Animation" id="{anim_id}"]',
             f'resource_name = "{name}"',
             f'length = {spec["length"]}',
             f'loop_mode = {1 if spec["loop"] else 0}']
    for i, (path, keys) in enumerate(spec["tracks"]):
        times = ", ".join(str(t) for t, _ in keys)
        trans = ", ".join("1" for _ in keys)
        values = ", ".join(fmt_value(v) for _, v in keys)
        lines += [
            f'tracks/{i}/type = "value"',
            f"tracks/{i}/imported = false",
            f"tracks/{i}/enabled = true",
            f'tracks/{i}/path = NodePath("{path}")',
            f"tracks/{i}/interp = 2",          # 2 = CUBIC. 움직임이 부드러워진다
            f"tracks/{i}/loop_wrap = true",
            f"tracks/{i}/keys = {{",
            f'"times": PackedFloat32Array({times}),',
            f'"transitions": PackedFloat32Array({trans}),',
            '"update": 0,',
            f'"values": [{values}]',
            "}",
        ]
    return "\n".join(lines)


def main() -> None:
    anim_ids = {name: f"Animation_{name}" for name in ANIMATIONS}
    subs = [animation_block(anim_ids[n], n, s) for n, s in ANIMATIONS.items()]

    library = ['[sub_resource type="AnimationLibrary" id="AnimationLibrary_rig"]', "_data = {"]
    library += [f'"{n}": SubResource("{anim_ids[n]}"),' for n in ANIMATIONS]
    library += ["}"]

    nodes = ['[node name="RiggedCharacter" type="Node2D"]',
             'script = ExtResource("1_rig")',
             "",
             '[node name="Skeleton2D" type="Skeleton2D" parent="."]',
             ""]

    for name, parent, pos, length, polygon, color, z in BONES:
        parent_path = "Skeleton2D" if parent is None else bone_path(parent)
        nodes += [f'[node name="{name}" type="Bone2D" parent="{parent_path}"]',
                  f"position = Vector2({pos[0]}, {pos[1]})",
                  f"rest = Transform2D(1, 0, 0, 1, {pos[0]}, {pos[1]})",
                  "auto_calculate_length_and_angle = false",   # 4.7 기준 프로퍼티 이름 (autocalculate_ 아님)
                  f"length = {length}",
                  "bone_angle = 90.0",
                  ""]
        if polygon is not None:
            pts = ", ".join(f"{x}, {y}" for x, y in polygon)
            cx = sum(px for px, _ in polygon) / len(polygon)
            cy = sum(py for _, py in polygon) / len(polygon)
            # 플레이스홀더 도형 — 텍스처가 없을 때 보인다
            nodes += [f'[node name="{name}Part" type="Polygon2D" parent="{bone_path(name)}"]',
                      f"z_index = {z}",
                      f"color = {color_literal(color)}",
                      f"polygon = PackedVector2Array({pts})",
                      ""]
            # 실제 그림 슬롯. Polygon2D 에 AtlasTexture 를 물리면 UV 공간이 어긋나
            # 텍스처가 갈래갈래 찢어진다(AtlasTexture 가 전체 아틀라스 RID를 넘기기 때문).
            # Sprite2D 는 region 을 스스로 처리하므로 그림은 이쪽에 붙인다.
            nodes += [f'[node name="{name}Sprite" type="Sprite2D" parent="{bone_path(name)}"]',
                      f"z_index = {z}",
                      f"position = Vector2({cx:.1f}, {cy:.1f})",
                      "visible = false",
                      ""]
        if name == "Weapon":
            pts = ", ".join(f"{x}, {y}" for x, y in WEAPON_BLADE[0])
            nodes += ['[node name="WeaponBlade" type="Polygon2D" parent="%s"]' % bone_path("Weapon"),
                      "z_index = 4",
                      f"color = {color_literal(WEAPON_BLADE[1])}",
                      f"polygon = PackedVector2Array({pts})",
                      ""]

    nodes += ['[node name="AnimationPlayer" type="AnimationPlayer" parent="."]',
              'libraries = {',
              '&"": SubResource("AnimationLibrary_rig")',
              '}',
              ""]

    header = (f'[gd_scene load_steps={len(subs) + 2} format=3]\n\n'
              '[ext_resource type="Script" path="res://entities/characters/rigged_character.gd" id="1_rig"]\n')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join([header, "\n\n".join(subs), "", "\n".join(library), "", "\n".join(nodes)]),
                   encoding="utf-8")
    print(f"{OUT} 생성 — 뼈 {len(BONES)}개, 애니메이션 {len(ANIMATIONS)}개")


if __name__ == "__main__":
    main()
