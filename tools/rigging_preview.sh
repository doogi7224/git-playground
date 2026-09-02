#!/usr/bin/env bash
# 리깅 템플릿 미리보기 — 걷기/공격/피격/사망을 여러 컷으로 찍는다.
#   tools/rigging_preview.sh --out=/tmp/rig --shots=4
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
ensure_class_cache
command -v xvfb-run >/dev/null || { echo "xvfb-run 이 필요합니다." >&2; exit 1; }
exec xvfb-run -a --server-args="-screen 0 1920x1080x24" \
  "$GODOT_BIN" --path "$PROJECT_DIR" --rendering-driver opengl3 \
  res://tests/rigging_preview.tscn -- "$@"
