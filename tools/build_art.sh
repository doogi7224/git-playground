#!/usr/bin/env bash
# 아트 전체 빌드: art/raw → art/processed → art/atlas
#
# 적과 플레이어를 따로 돌리는 이유는 아틀라스를 따로 만들기 때문이다.
# 색 정책은 이제 양쪽이 같다 — 팔레트 강제 스냅을 폐기하고 원본 hue 를 지키는
# 보정으로 바꿨다. 예약색(시안·금색·진홍)은 그 구간에 들어온 픽셀만 12° 비켜
# 보내므로, 팔레트를 나눠서 색을 빼 버릴 필요가 없다.
# 경위: docs/00_먼저읽기_진단과_컬러정책.md
set -euo pipefail
PY="${PYTHON:-python3}"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "== 적 =="
# --max-size 512: AI 원본이 1024~2048px 로 나온다. 그대로 packing 하면 아틀라스가
# 1024x32768 이 되는데, 이건 흔한 GPU 최대 텍스처(16384)를 넘어서 실기에서 안 뜬다.
# 512 는 기획서의 "캐릭터 원본 512px" 기준이자 보스(인게임 1024px)의 2배 확대 한계다.
"$PY" tools/art_pipeline.py --input art/raw/enemies \
  --normal --atlas enemies --atlas-width 2048 --max-size 512 "$@"

echo "== 플레이어 =="
# 폭 1024: 파츠 하나가 아틀라스 폭보다 넓으면 통째로 빠진다 (kim_weapon 이 실제로 그랬다).
# --punch-holes-for kim_weapon: 삽 D링 안쪽 구멍은 그림자가 져서 배경(240)보다
# 어두운 226~233 이라 전역 허용오차(12)로는 안 뚫린다. 그렇다고 전역을 16까지
# 올리면 kim_head 의 흰 눈동자(252)가 깎이기 시작한다 — 그래서 이 파일만 올린다.
# 안 뚫으면 손 옆에 밝은 삼각형이 붙어 다니고 글로우까지 먹는다.
"$PY" tools/art_pipeline.py --input art/raw/player \
  --normal --atlas player --atlas-width 1024 --max-size 512 \
  --punch-holes-for kim_weapon=20 "$@"

# ★ Godot 은 임포트한 텍스처를 .godot/imported/ 에 캐시한다. 아틀라스 PNG 를
#   새로 만들어도 다시 임포트하지 않으면 **게임은 예전 그림을 계속 쓴다.**
#   파이프라인을 고치고 아틀라스를 확인해도 화면이 그대로라 한참 헤맸다 --
#   실제로는 캐시가 옛날 것이었다. 여기서 바로 갱신한다.
GODOT_BIN="${GODOT_BIN:-godot}"
if command -v "$GODOT_BIN" >/dev/null 2>&1; then
  echo "== 리임포트 (아틀라스가 바뀌었으므로) =="
  "$GODOT_BIN" --headless --path "$PWD" --import >/dev/null 2>&1 || true
else
  echo "경고: $GODOT_BIN 이 없어 리임포트를 못 했습니다. 게임이 예전 아틀라스를 쓸 수 있습니다." >&2
fi

echo "완료 — art/atlas/ 에 아틀라스와 .tres 가 들어 있습니다."
