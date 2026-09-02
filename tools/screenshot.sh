#!/usr/bin/env bash
# 실제 렌더러(Xvfb + OpenGL)로 게임을 돌려 스크린샷을 뜬다.
#
#   tools/screenshot.sh --out=/tmp/shot.png --seconds=90 --scale=6
#   tools/screenshot.sh --seq=/tmp/frames --seq-seconds=12 --fixed-fps=30
#
# --fixed-fps 는 엔진 인자다. 델타를 고정해서 실제로 몇 초 걸리든 일정한 속도의
# 프레임열이 나온다 — 소프트웨어 렌더러에서 영상을 뽑는 유일한 방법이다.
set -euo pipefail
GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
ensure_class_cache
command -v xvfb-run >/dev/null || { echo "xvfb-run 이 필요합니다." >&2; exit 1; }

ENGINE_ARGS=()
USER_ARGS=()
for arg in "$@"; do
  case "$arg" in
    --fixed-fps=*) ENGINE_ARGS+=(--fixed-fps "${arg#*=}") ;;
    *) USER_ARGS+=("$arg") ;;
  esac
done

exec xvfb-run -a --server-args="-screen 0 1080x1920x24" \
  "$GODOT_BIN" --path "$PROJECT_DIR" --rendering-driver opengl3 \
  "${ENGINE_ARGS[@]}" \
  res://tests/screenshot_runner.tscn -- "${USER_ARGS[@]}"
