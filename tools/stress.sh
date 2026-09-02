#!/usr/bin/env bash
# 3,000마리 스트레스 테스트.
#   tools/stress.sh                 실제 렌더러(Xvfb), 600프레임 후 리포트
#   tools/stress.sh --count=4000
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
ensure_class_cache
command -v xvfb-run >/dev/null || { echo "xvfb-run 이 필요합니다." >&2; exit 1; }
exec xvfb-run -a --server-args="-screen 0 1920x1080x24" \
  "$GODOT_BIN" --path "$PROJECT_DIR" --rendering-driver opengl3 \
  res://tests/stress_test.tscn -- --frames=600 "$@"
