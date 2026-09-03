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

## ★ 셰이더 컴파일 실패는 검사로 안 잡힌다. 엔진이 stderr 에 SHADER ERROR 를
##   찍고 그냥 넘어가므로, GDScript 쪽 검사는 전부 통과한 채로 화면만 틀어진다.
##   실제로 fragment() 안의 return 하나 때문에 투사체 셰이더가 통째로 컴파일에
##   실패했는데 602개 검사가 전부 초록이었다. 출력을 직접 본다.
run_and_check() {
  local log; log="$(mktemp)"
  set +e
  "$@" 2>&1 | tee "$log"
  local rc=${PIPESTATUS[0]}
  set -e
  if grep -q "SHADER ERROR" "$log"; then
    echo "" >&2
    echo "  [FAIL] 셰이더 컴파일 실패 — 위 SHADER ERROR 를 보세요." >&2
    grep -n "SHADER ERROR" "$log" | head -5 >&2
    rm -f "$log"
    exit 1
  fi
  rm -f "$log"
  exit "$rc"
}

if [[ "${1:-}" == "--gl" ]]; then
  command -v xvfb-run >/dev/null || { echo "xvfb-run 이 필요합니다." >&2; exit 1; }
  run_and_check xvfb-run -a --server-args="-screen 0 1080x1920x24" \
    "$GODOT_BIN" --path "$PROJECT_DIR" --rendering-driver opengl3 "$SCENE"
fi

run_and_check "$GODOT_BIN" --headless --path "$PROJECT_DIR" "$SCENE"
