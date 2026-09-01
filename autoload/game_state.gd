extends Node
## 한 판(런)의 상태와 D-100 타이머.
## 한 판의 길이·경험치 곡선·계급표는 전부 data/progression.tres 에 있다. (CLAUDE.md 규칙 4)

const PROGRESSION_PATH: String = "res://data/progression.tres"

enum Phase { MENU, PLAYING, LEVEL_UP, PAUSED, RESULTS }

var progression: ProgressionData = null

var phase: Phase = Phase.MENU
var elapsed: float = 0.0
var level: int = 1
var xp: float = 0.0
var rank_id: StringName = &""
var run_stats: Dictionary = {}

var _last_days_left: int = 0


func _ready() -> void:
	progression = load(PROGRESSION_PATH) as ProgressionData
	assert(progression != null, "data/progression.tres 를 못 읽었다")
	rank_id = progression.rank_for_level(1)
	_last_days_left = progression.total_days
	set_process(false)
	EventBus.enemy_died.connect(_on_enemy_died)


func _on_enemy_died(_pos: Vector2, _xp: float, _enemy_type: StringName) -> void:
	run_stats["kills"] = int(run_stats.get("kills", 0)) + 1


func run_duration() -> float:
	return progression.run_duration_sec


func _process(delta: float) -> void:
	if phase != Phase.PLAYING:
		return
	elapsed = minf(elapsed + delta, progression.run_duration_sec)
	var days: int = days_left()
	if days != _last_days_left:
		_last_days_left = days
		EventBus.day_changed.emit(days)
	if elapsed >= progression.run_duration_sec:
		end_run(true)


## D-100 → D-0. 화면 상단 카운트다운에 그대로 쓴다.
func days_left() -> int:
	var ratio: float = 1.0 - (elapsed / progression.run_duration_sec)
	return int(ceil(ratio * float(progression.total_days)))


func rank_for_level(lv: int) -> StringName:
	return progression.rank_for_level(lv)


func rank_name(id: StringName) -> String:
	return progression.rank_name(id)


func xp_to_next(lv: int) -> float:
	return progression.xp_to_next(lv)


func start_run(character_id: StringName) -> void:
	phase = Phase.PLAYING
	elapsed = 0.0
	level = 1
	xp = 0.0
	rank_id = progression.rank_for_level(1)
	run_stats = {"kills": 0, "damage_dealt": 0.0, "salary": 0}
	_last_days_left = progression.total_days
	set_process(true)
	EventBus.run_started.emit(character_id)


func end_run(victory: bool) -> void:
	if phase == Phase.RESULTS:
		return
	phase = Phase.RESULTS
	set_process(false)
	EventBus.run_ended.emit(victory, run_stats)
