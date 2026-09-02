#!/usr/bin/env bash
# 메타 화면 4종을 실제 렌더러로 찍는다. 화면이 비어 있으면 종료 코드 1.
#
#   tools/menu_shot.sh --out-dir=/tmp/menu --salary=99999 --fake-progress
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
ensure_class_cache
command -v xvfb-run >/dev/null || { echo "xvfb-run 이 필요합니다." >&2; exit 1; }
exec xvfb-run -a --server-args="-screen 0 1920x1080x24" \
  "$GODOT_BIN" --path "$PROJECT_DIR" --rendering-driver opengl3 \
  res://tests/menu_shot.tscn -- "$@"
