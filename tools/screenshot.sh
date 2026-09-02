#!/usr/bin/env bash
# 실제 렌더러(Xvfb + OpenGL)로 게임을 돌려 스크린샷을 뜬다.
#
#   tools/screenshot.sh --out=/tmp/shot.png --seconds=90 --scale=6
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
ensure_class_cache
command -v xvfb-run >/dev/null || { echo "xvfb-run 이 필요합니다." >&2; exit 1; }
exec xvfb-run -a --server-args="-screen 0 1920x1080x24" \
  "$GODOT_BIN" --path "$PROJECT_DIR" --rendering-driver opengl3 \
  res://tests/screenshot_runner.tscn -- "$@"
