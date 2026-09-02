#!/usr/bin/env bash
# 헤드리스 자체 검증. 실패하면 종료 코드 1.
#
#   tools/test.sh          더미 렌더러 (빠름, MultiMesh 읽기 검사는 건너뜀)
#   tools/test.sh --gl     Xvfb + OpenGL 실제 렌더러 (MultiMesh 검사까지 전부)
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
ensure_class_cache
SCENE="res://tests/test_runner.tscn"

if [[ "${1:-}" == "--gl" ]]; then
  command -v xvfb-run >/dev/null || { echo "xvfb-run 이 필요합니다." >&2; exit 1; }
  exec xvfb-run -a --server-args="-screen 0 1080x1920x24" \
    "$GODOT_BIN" --path "$PROJECT_DIR" --rendering-driver opengl3 "$SCENE"
fi

exec "$GODOT_BIN" --headless --path "$PROJECT_DIR" "$SCENE"
