#!/usr/bin/env bash
# 아트 전체 빌드: art/raw → art/processed → art/atlas
#
# 적과 플레이어는 팔레트가 다르다. 적은 시안·금색을 못 쓰고(플레이어 이펙트 독점색),
# 플레이어는 진홍을 못 쓴다(위험 표시 독점색). 그래서 따로 돌린다.
set -euo pipefail
PY="${PYTHON:-python3}"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "== 적 =="
# --max-size 512: AI 원본이 1024~2048px 로 나온다. 그대로 packing 하면 아틀라스가
# 1024x32768 이 되는데, 이건 흔한 GPU 최대 텍스처(16384)를 넘어서 실기에서 안 뜬다.
# 512 는 기획서의 "캐릭터 원본 512px" 기준이자 보스(인게임 1024px)의 2배 확대 한계다.
"$PY" tools/art_pipeline.py --input art/raw/enemies --palette enemy \
  --normal --atlas enemies --atlas-width 2048 --max-size 512 "$@"

echo "== 플레이어 =="
# 폭 1024: 파츠 하나가 아틀라스 폭보다 넓으면 통째로 빠진다 (kim_weapon 이 실제로 그랬다).
"$PY" tools/art_pipeline.py --input art/raw/player --palette player \
  --normal --atlas player --atlas-width 1024 --max-size 512 "$@"

echo "완료 — art/atlas/ 에 아틀라스와 .tres 가 들어 있습니다."
