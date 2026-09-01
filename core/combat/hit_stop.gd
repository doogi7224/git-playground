extends Node
class_name HitStop
## 강한 타격 시 Engine.time_scale 을 떨어뜨렸다가 되돌린다. 기획서 3.3 히트 필 3종 중 둘째.
##
## ★ 복귀 시각은 반드시 실시간으로 재야 한다.
##   time_scale 을 0.05로 만들어 놓고 _process 의 delta 로 0.04초를 세면 실제로는 0.8초가 걸린다.
##   게임이 멈춘 것처럼 보이는 그 버그를 피하려고 Time.get_ticks_usec() 를 쓴다.

const DEFAULT_SCALE: float = 0.05
const DEFAULT_DURATION: float = 0.04
## 크리티컬이 연달아 터지면 게임이 계속 느려진 채로 있게 된다. 실시간 최소 간격을 둔다.
const MIN_INTERVAL_USEC: int = 220_000

var _release_at_usec: int = 0
var _active: bool = false
var _base_scale: float = 1.0
var _last_start_usec: int = -1_000_000


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	EventBus.hit_stop_requested.connect(request)


## duration 은 실시간 초. time_scale 은 0~1.
func request(duration: float = DEFAULT_DURATION, scale: float = DEFAULT_SCALE) -> void:
	if not Settings.hit_stop:
		return
	if GameState.phase != GameState.Phase.PLAYING:
		return
	var now: int = Time.get_ticks_usec()
	if not _active:
		if now - _last_start_usec < MIN_INTERVAL_USEC:
			return
		_last_start_usec = now
		_base_scale = Engine.time_scale
	_active = true
	Engine.time_scale = _base_scale * clampf(scale, 0.01, 1.0)
	var until: int = now + int(maxf(0.0, duration) * 1_000_000.0)
	_release_at_usec = maxi(_release_at_usec, until)


func _process(_delta: float) -> void:
	if not _active:
		return
	if Time.get_ticks_usec() >= _release_at_usec:
		Engine.time_scale = _base_scale
		_active = false


func is_active() -> bool:
	return _active


## 씬을 바꾸거나 테스트에서 강제로 되돌릴 때.
func release() -> void:
	if _active:
		Engine.time_scale = _base_scale
		_active = false
