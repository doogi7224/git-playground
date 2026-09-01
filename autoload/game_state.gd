extends Node
## 한 판(런)의 상태와 D-100 타이머. 수치는 여기에 하드코딩하지 않고 .tres에서 읽어온다.
##
## TODO(M0): run_timer 구동, XP/레벨 처리
## TODO(M3): 캐릭터별 시작 스탯을 CharacterData.tres에서 로드

const RUN_DURATION_SEC: float = 20.0 * 60.0   ## 20분 = D-100 → D-DAY
const TOTAL_DAYS: int = 100

## 레벨 → 계급. 기획서 1장 "진급 = 레벨" 표.
const RANK_THRESHOLDS: Array = [
	{"min_level": 1, "id": &"private_2"},    ## 이등병
	{"min_level": 6, "id": &"private_1"},    ## 일병
	{"min_level": 16, "id": &"corporal"},    ## 상병
	{"min_level": 31, "id": &"sergeant"},    ## 병장
	{"min_level": 51, "id": &"veteran"},     ## 말년
]

enum Phase { MENU, PLAYING, LEVEL_UP, PAUSED, RESULTS }

var phase: Phase = Phase.MENU
var elapsed: float = 0.0
var level: int = 1
var xp: float = 0.0
var rank_id: StringName = &"private_2"
var run_stats: Dictionary = {}

var _last_days_left: int = TOTAL_DAYS


func _ready() -> void:
	set_process(false)
	EventBus.enemy_died.connect(_on_enemy_died)


func _on_enemy_died(_pos: Vector2, _xp: float, _enemy_type: StringName) -> void:
	run_stats["kills"] = int(run_stats.get("kills", 0)) + 1


func _process(delta: float) -> void:
	if phase != Phase.PLAYING:
		return
	elapsed = minf(elapsed + delta, RUN_DURATION_SEC)
	var days: int = days_left()
	if days != _last_days_left:
		_last_days_left = days
		EventBus.day_changed.emit(days)
	if elapsed >= RUN_DURATION_SEC:
		end_run(true)


## D-100 → D-0. 화면 상단 카운트다운에 그대로 쓴다.
func days_left() -> int:
	var ratio: float = 1.0 - (elapsed / RUN_DURATION_SEC)
	return int(ceil(ratio * float(TOTAL_DAYS)))


func rank_for_level(lv: int) -> StringName:
	var result: StringName = RANK_THRESHOLDS[0]["id"]
	for entry: Dictionary in RANK_THRESHOLDS:
		if lv >= int(entry["min_level"]):
			result = entry["id"]
	return result


func start_run(character_id: StringName) -> void:
	phase = Phase.PLAYING
	elapsed = 0.0
	level = 1
	xp = 0.0
	rank_id = rank_for_level(level)
	run_stats = {"kills": 0, "damage_dealt": 0.0, "salary": 0}
	_last_days_left = TOTAL_DAYS
	set_process(true)
	EventBus.run_started.emit(character_id)


func end_run(victory: bool) -> void:
	if phase == Phase.RESULTS:
		return
	phase = Phase.RESULTS
	set_process(false)
	EventBus.run_ended.emit(victory, run_stats)
