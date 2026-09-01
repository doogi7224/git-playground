#!/usr/bin/env bash
# godot --headless --export-release 래퍼.
#
#   tools/build.sh <preset> [출력경로]
#   tools/build.sh "Windows Desktop" build/d100.exe
#
# 프리셋은 Godot 에디터의 Project > Export 에서 만들고,
# export_presets.cfg 는 머신마다 경로가 달라 .gitignore 대상이다.
set -euo pipefail

GODOT_BIN="${GODOT_BIN:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRESET="${1:-}"
OUTPUT="${2:-}"

if ! command -v "$GODOT_BIN" >/dev/null 2>&1; then
  echo "godot 실행 파일을 찾을 수 없습니다. GODOT_BIN 환경변수로 경로를 지정하세요." >&2
  echo "  예: GODOT_BIN=/opt/godot/godot tools/build.sh 'Linux/X11' build/d100.x86_64" >&2
  exit 1
fi

if [[ -z "$PRESET" ]]; then
  echo "사용법: tools/build.sh <preset> [출력경로]" >&2
  if [[ -f "$PROJECT_DIR/export_presets.cfg" ]]; then
    echo "" >&2
    echo "사용 가능한 프리셋:" >&2
    grep -oP '(?<=^name=").*(?="$)' "$PROJECT_DIR/export_presets.cfg" | sed 's/^/  - /' >&2
  else
    echo "export_presets.cfg 가 없습니다. 에디터에서 Project > Export 로 프리셋을 먼저 만드세요." >&2
  fi
  exit 1
fi

if [[ -z "$OUTPUT" ]]; then
  OUTPUT="$PROJECT_DIR/build/$(echo "$PRESET" | tr ' /' '__')"
fi

mkdir -p "$(dirname "$OUTPUT")"

echo "==> 빌드: preset='$PRESET' → '$OUTPUT'"
"$GODOT_BIN" --headless --path "$PROJECT_DIR" --export-release "$PRESET" "$OUTPUT"
echo "==> 완료: $OUTPUT"
