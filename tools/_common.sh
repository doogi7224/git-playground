# 도구 스크립트가 공통으로 쓰는 준비 절차. source 로 불러 쓴다.
#
#   source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
#   ensure_class_cache

## Godot 은 class_name 을 .godot/global_script_class_cache.cfg 에 캐시한다.
## 이 폴더는 .gitignore 에 있어서 갓 클론한 저장소나 새로 뜬 컨테이너에는 없다.
## 없는 채로 씬을 열면 "Could not find type ..." 이 수십 개 쏟아지고 오토로드가
## 통째로 컴파일에 실패한다. 실제로 겪었다 — 원인이 코드에 있는 줄 알고 한참 봤다.
##
## ★ 캐시가 "있기만" 하면 넘어가던 시절에 또 당했다. class_name 을 새로 붙이면
##   캐시는 그대로 낡아 있고, 그 타입을 쓰는 스크립트가 파싱에 실패한다.
##   그러면 테스트 러너가 **아무 것도 출력하지 않고 그대로 멈춘다** — 실패도
##   아니고 에러도 아니라서 원인을 찾는 데 가장 오래 걸리는 종류다.
##   그래서 캐시보다 새로운 class_name 선언이 있으면 다시 임포트한다.
ensure_class_cache() {
  local cache="$PROJECT_DIR/.godot/global_script_class_cache.cfg"
  local reason=""

  if [[ ! -f "$cache" ]]; then
    reason="캐시 없음"
  elif find "$PROJECT_DIR" -name '*.gd' -newer "$cache" -print0 2>/dev/null \
       | xargs -0 -r grep -l '^class_name' 2>/dev/null | grep -q .; then
    reason="캐시보다 새로운 class_name 선언이 있음"
  fi

  [[ -z "$reason" ]] && return 0
  echo "== 리소스 임포트 ($reason) ==" >&2
  "$GODOT_BIN" --headless --path "$PROJECT_DIR" --import >/dev/null 2>&1 || true
  [[ -f "$cache" ]] || echo "경고: 클래스 캐시를 못 만들었습니다." >&2
}
