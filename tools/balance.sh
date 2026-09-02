#!/usr/bin/env bash
# 밸런스 예산표: 맵별 스폰/짬 총량과 경험치 곡선 착지 레벨.
#
#   tools/balance.sh [--target=125]
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
ensure_class_cache
exec "$GODOT_BIN" --headless --path "$PROJECT_DIR" res://tests/balance_report.tscn -- "$@"
