#!/usr/bin/env bash
# 아트 전체 빌드: art/raw → art/processed → art/atlas
#
# 적과 플레이어는 팔레트가 다르다. 적은 시안·금색을 못 쓰고(플레이어 이펙트 독점색),
# 플레이어는 진홍을 못 쓴다(위험 표시 독점색). 그래서 따로 돌린다.
set -euo pipefail
PY="${PYTHON:-python3}"
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "== 적 =="
"$PY" tools/art_pipeline.py --input art/raw/enemies --palette enemy \
  --normal --atlas enemies --atlas-width 1024 "$@"

echo "== 플레이어 =="
"$PY" tools/art_pipeline.py --input art/raw/player --palette player \
  --normal --atlas player --atlas-width 512 "$@"

echo "완료 — art/atlas/ 에 아틀라스와 .tres 가 들어 있습니다."
