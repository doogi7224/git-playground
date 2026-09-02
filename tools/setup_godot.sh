#!/usr/bin/env bash
# Godot 엔진을 내려받아 ~/.local/bin/godot 에 놓는다.
#
# 컨테이너가 새로 뜨면 엔진이 사라진다. 그때마다 이걸 돌린다.
#   tools/setup_godot.sh          # 기본 버전
#   GODOT_VERSION=4.7.2 tools/setup_godot.sh
set -euo pipefail
VERSION="${GODOT_VERSION:-4.7.2}"
DEST="${GODOT_DEST:-$HOME/.local/bin}"
NAME="Godot_v${VERSION}-stable_linux.x86_64"
URL="https://github.com/godotengine/godot/releases/download/${VERSION}-stable/${NAME}.zip"

if [[ -x "$DEST/godot" ]] && "$DEST/godot" --version 2>/dev/null | grep -q "^${VERSION}"; then
  echo "이미 있음: $($DEST/godot --version)"
  exit 0
fi

mkdir -p "$DEST"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
echo "내려받는 중: $URL"
curl -fsSL -o "$TMP/godot.zip" "$URL"
unzip -q -o "$TMP/godot.zip" -d "$TMP"
install -m 0755 "$TMP/$NAME" "$DEST/godot"
echo "설치 완료: $("$DEST/godot" --version)  ($DEST/godot)"
echo "PATH 에 $DEST 가 없으면 추가하세요."
