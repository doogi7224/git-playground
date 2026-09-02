# 도구 스크립트가 공통으로 쓰는 준비 절차. source 로 불러 쓴다.
#
#   source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
#   ensure_class_cache

## Godot 은 class_name 을 .godot/global_script_class_cache.cfg 에 캐시한다.
## 이 폴더는 .gitignore 에 있어서 갓 클론한 저장소나 새로 뜬 컨테이너에는 없다.
## 없는 채로 씬을 열면 "Could not find type ..." 이 수십 개 쏟아지고 오토로드가
## 통째로 컴파일에 실패한다. 실제로 겪었다 — 원인이 코드에 있는 줄 알고 한참 봤다.
ensure_class_cache() {
  local cache="$PROJECT_DIR/.godot/global_script_class_cache.cfg"
  [[ -f "$cache" ]] && return 0
  echo "== 최초 실행: 리소스 임포트 (class_name 캐시 생성) ==" >&2
  "$GODOT_BIN" --headless --path "$PROJECT_DIR" --import >/dev/null 2>&1 || true
  [[ -f "$cache" ]] || echo "경고: 클래스 캐시를 못 만들었습니다." >&2
}
