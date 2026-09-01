#!/usr/bin/env bash
# 적 시뮬레이션 벤치마크 (헤드리스, CPU만).
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec "$GODOT_BIN" --headless --path "$PROJECT_DIR" res://tests/bench_runner.tscn
