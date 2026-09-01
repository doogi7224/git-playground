extends Node
class_name SpawnDirector
## M0용 최소 웨이브 디렉터. 시간이 갈수록 스폰 속도가 오른다.
## 프롬프트 4에서 1분 구간 WaveData(.tres) 테이블 기반으로 교체된다.

@export var spawn_ring_radius: float = 980.0   ## 화면 밖 링에서 스폰
@export var start_rate: float = 1.5            ## 초당 스폰 수
@export var end_rate: float = 40.0

var enemies: EnemyManager = null
var target: Node2D = null
var enabled: bool = true

var _accum: float = 0.0
var _type_index: int = 0
var _last_minute: int = -1


func setup(p_enemies: EnemyManager, p_target: Node2D, p_type_index: int) -> void:
	enemies = p_enemies
	target = p_target
	_type_index = p_type_index


func _physics_process(delta: float) -> void:
	if not enabled or enemies == null or target == null:
		return
	if GameState.phase != GameState.Phase.PLAYING:
		return

	var minute: int = int(GameState.elapsed / 60.0)
	if minute != _last_minute:
		_last_minute = minute
		EventBus.wave_changed.emit(minute)

	var progress: float = clampf(GameState.elapsed / GameState.RUN_DURATION_SEC, 0.0, 1.0)
	var rate: float = lerpf(start_rate, end_rate, progress)
	_accum += rate * delta

	while _accum >= 1.0:
		_accum -= 1.0
		_spawn_one()


func _spawn_one() -> void:
	if enemies.get_count() >= enemies.get_capacity():
		return
	var angle: float = randf() * TAU
	var r: float = spawn_ring_radius * randf_range(0.95, 1.15)
	var pos: Vector2 = target.global_position + Vector2(cos(angle), sin(angle)) * r
	enemies.spawn(_type_index, pos)
