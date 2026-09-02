#!/usr/bin/env bash
# 20분 한 판을 헤드리스로 끝까지 자동 플레이하고 결과를 보고한다 (밸런싱용).
#   tools/playthrough.sh --runs=3 --scale=20
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
ensure_class_cache
exec "$GODOT_BIN" --headless --path "$PROJECT_DIR" res://tests/playthrough_runner.tscn -- "$@"
