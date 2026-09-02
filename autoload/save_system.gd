extends Node
## 메타 진행 저장. 월급, PX 상점 강화, 해금, 표창장.
##
## 값은 전부 .tres 에 있다 (CLAUDE.md 규칙 4). 여기 있는 건 배선과 저장 형식뿐이다.
##
## 딕셔너리 키는 전부 String 이다. StringName 으로 넣으면 저장 파일을 한 번 왕복한
## 뒤 String 으로 바뀌어, Godot 4 의 Dictionary 가 &"a" 와 "a" 를 다른 키로 보는 바람에
## 통계가 조용히 0으로 리셋된다.

const DEFAULT_SAVE_PATH: String = "user://savegame.cfg"
const SAVE_VERSION: int = 2

const PX_SHOP_PATH: String = "res://data/px/px_shop.tres"
const COMMENDATION_TABLE_PATH: String = "res://data/commendations/commendation_table.tres"
const UNLOCK_TABLE_PATH: String = "res://data/unlocks/unlock_table.tres"

## 표창장 보상이 월급을 올려서 다음 표창장 조건을 채우는 연쇄가 있다.
## 무한 루프를 막되 연쇄는 허용하는 상한.
const CASCADE_LIMIT: int = 8

var save_path: String = DEFAULT_SAVE_PATH
## 끄면 디스크에 쓰지 않는다. 테스트/스트레스 실행이 진짜 세이브를 덮어쓰지 않게.
var autosave: bool = true

var px_shop: PxShopTable = null
var commendations_table: CommendationTable = null
var unlock_table: UnlockTable = null

var data: Dictionary = {}


func _ready() -> void:
	px_shop = load(PX_SHOP_PATH) as PxShopTable
	commendations_table = load(COMMENDATION_TABLE_PATH) as CommendationTable
	unlock_table = load(UNLOCK_TABLE_PATH) as UnlockTable
	assert(px_shop != null, "data/px/px_shop.tres 를 못 읽었다")
	assert(commendations_table != null, "data/commendations/commendation_table.tres 를 못 읽었다")
	assert(unlock_table != null, "data/unlocks/unlock_table.tres 를 못 읽었다")
	data = _default_data()
	load_game()


# ---------------------------------------------------------------- 저장 형식

func _default_data() -> Dictionary:
	return {
		"version": SAVE_VERSION,
		"salary": 0,                              ## 지금 쓸 수 있는 월급
		"px_upgrades": {},                        ## {px_id: 레벨}
		"unlocked_characters": ["kim_private"],
		"unlocked_maps": ["parade_ground"],
		"commendations": [],                      ## 받은 표창장 id
		"last_character": "kim_private",
		"last_map": "parade_ground",
		"stats": _default_stats(),
		"settings": {},
	}


func _default_stats() -> Dictionary:
	return {
		"total_kills": 0,
		"total_runs": 0,
		"runs_won": 0,
		"best_level": 1,
		"best_survive_sec": 0.0,
		"total_salary": 0,        ## 누적으로 번 월급 (쓴 것 포함)
		"boss_kills": 0,
		"evolutions": 0,
		"best_run_kills": 0,
	}


func load_game() -> void:
	data = _default_data()
	var cfg := ConfigFile.new()
	if cfg.load(save_path) != OK:
		return  ## 첫 실행. 기본값 그대로 간다.
	for key: String in data.keys():
		if cfg.has_section_key("save", key):
			data[key] = cfg.get_value("save", key)
	_migrate()
	_ensure_shape()


func save_game() -> void:
	if not autosave:
		return
	var cfg := ConfigFile.new()
	data["version"] = SAVE_VERSION
	for key: String in data.keys():
		cfg.set_value("save", key, data[key])
	# 먼저 임시 파일에 쓰고 옮긴다. 저장 중에 꺼져도 기존 세이브가 남는다.
	var tmp: String = save_path + ".tmp"
	if cfg.save(tmp) != OK:
		push_warning("세이브 실패: %s" % tmp)
		return
	var dir := DirAccess.open(save_path.get_base_dir())
	if dir != null:
		if dir.file_exists(save_path.get_file()):
			dir.remove(save_path.get_file())
		dir.rename(tmp.get_file(), save_path.get_file())


## 옛 세이브를 현재 형식으로 끌어올린다. 버전을 올릴 때마다 여기에 한 칸씩 쌓는다.
func _migrate() -> void:
	var version: int = int(data.get("version", 1))
	if version < 2:
		# v1 에는 누적 통계가 없었다. 빈 통계로 시작하되 해금은 그대로 둔다.
		data["stats"] = _default_stats()
		data["last_character"] = "kim_private"
		data["last_map"] = "parade_ground"
	data["version"] = SAVE_VERSION


## 손으로 고친 세이브나 옛 형식 때문에 타입이 어긋나도 게임이 죽지 않게 한다.
func _ensure_shape() -> void:
	var defaults: Dictionary = _default_data()
	for key: String in defaults.keys():
		if not data.has(key) or typeof(data[key]) != typeof(defaults[key]):
			data[key] = defaults[key]
	var stats: Dictionary = data["stats"]
	for key: String in _default_stats().keys():
		if not stats.has(key):
			stats[key] = _default_stats()[key]
	# 기본 해금은 절대 빠지지 않는다.
	if not (data["unlocked_characters"] as Array).has("kim_private"):
		(data["unlocked_characters"] as Array).append("kim_private")
	if not (data["unlocked_maps"] as Array).has("parade_ground"):
		(data["unlocked_maps"] as Array).append("parade_ground")


## 세이브를 지운다. 옵션 화면의 "기록 초기화" 와 테스트가 쓴다.
func reset() -> void:
	data = _default_data()
	save_game()
	EventBus.meta_changed.emit()


# ---------------------------------------------------------------- 월급

func salary() -> int:
	return int(data.get("salary", 0))


func stats() -> Dictionary:
	return data["stats"]


func add_salary(amount: int) -> void:
	if amount == 0:
		return
	data["salary"] = salary() + amount
	if amount > 0:
		var s: Dictionary = stats()
		s["total_salary"] = int(s.get("total_salary", 0)) + amount
	# EventBus 로만 알린다. 여기서 다시 구독하면 이중 계산이 된다.
	EventBus.salary_earned.emit(amount)


func spend(amount: int) -> bool:
	if amount < 0 or salary() < amount:
		return false
	data["salary"] = salary() - amount
	return true


## 마지막에 고른 캐릭터/맵. 다음 실행 때 그대로 선택돼 있다.
func remember_selection(character_id: StringName, map_id: StringName) -> void:
	data["last_character"] = String(character_id)
	data["last_map"] = String(map_id)
	save_game()


func last_character() -> StringName:
	return StringName(data.get("last_character", "kim_private"))


func last_map() -> StringName:
	return StringName(data.get("last_map", "parade_ground"))


# ---------------------------------------------------------------- PX 상점

func px_level(id: StringName) -> int:
	return int((data["px_upgrades"] as Dictionary).get(String(id), 0))


## 다음 레벨 가격. 최대 레벨이거나 없는 항목이면 -1.
func px_next_cost(id: StringName) -> int:
	var item: PxUpgradeData = px_shop.find(id)
	if item == null:
		return -1
	return item.cost_for(px_level(id))


func can_buy_px(id: StringName) -> bool:
	var cost: int = px_next_cost(id)
	return cost >= 0 and salary() >= cost


func buy_px(id: StringName) -> bool:
	if not can_buy_px(id):
		return false
	if not spend(px_next_cost(id)):
		return false
	var levels: Dictionary = data["px_upgrades"]
	levels[String(id)] = px_level(id) + 1
	save_game()
	EventBus.meta_changed.emit()
	return true


## 산 PX 강화의 ADD 합계. 없으면 0.
func px_add(stat: StringName) -> float:
	return px_shop.total_add(stat, data["px_upgrades"])


## 산 PX 강화의 MULT 곱. 없으면 1.0.
func px_mult(stat: StringName) -> float:
	return px_shop.total_mult(stat, data["px_upgrades"])


# ---------------------------------------------------------------- 해금

func is_character_unlocked(id: StringName) -> bool:
	return (data["unlocked_characters"] as Array).has(String(id))


func is_map_unlocked(id: StringName) -> bool:
	return (data["unlocked_maps"] as Array).has(String(id))


func is_unlocked(u: UnlockData) -> bool:
	if u == null:
		return false
	if u.target == UnlockData.Target.CHARACTER:
		return is_character_unlocked(u.target_id)
	return is_map_unlocked(u.target_id)


## 조건은 채웠는데 아직 값을 안 낸 상태인가.
func can_buy_unlock(id: StringName) -> bool:
	var u: UnlockData = unlock_table.find(id)
	if u == null or u.is_free() or is_unlocked(u):
		return false
	return u.condition_met(stats()) and salary() >= u.price


func buy_unlock(id: StringName) -> bool:
	if not can_buy_unlock(id):
		return false
	var u: UnlockData = unlock_table.find(id)
	if not spend(u.price):
		return false
	_grant(u)
	save_game()
	EventBus.meta_changed.emit()
	return true


func _grant(u: UnlockData) -> void:
	var list: Array = data["unlocked_characters"] if u.target == UnlockData.Target.CHARACTER \
			else data["unlocked_maps"]
	if not list.has(String(u.target_id)):
		list.append(String(u.target_id))


## 조건만 채우면 되는(무료) 해금을 훑어서 연다. 새로 열린 해금 목록을 돌려준다.
func refresh_unlocks() -> Array[UnlockData]:
	var opened: Array[UnlockData] = unlock_table.newly_opened(
			stats(), data["unlocked_characters"], data["unlocked_maps"])
	for u: UnlockData in opened:
		_grant(u)
	return opened


# ---------------------------------------------------------------- 표창장

func has_commendation(id: StringName) -> bool:
	return (data["commendations"] as Array).has(String(id))


## 조건을 채운 표창장을 발급하고 보상을 준다. 발급된 id 목록을 돌려준다.
## 보상 월급이 다시 조건을 채우는 연쇄가 있어서 안정될 때까지 돈다.
func check_commendations() -> Array[StringName]:
	var awarded: Array[StringName] = []
	for _pass in CASCADE_LIMIT:
		var fresh: Array[StringName] = commendations_table.newly_earned(
				stats(), data["commendations"])
		if fresh.is_empty():
			break
		for id: StringName in fresh:
			(data["commendations"] as Array).append(String(id))
			var c: CommendationData = commendations_table.find(id)
			if c != null and c.salary_reward > 0:
				add_salary(c.salary_reward)
			awarded.append(id)
			EventBus.commendation_unlocked.emit(id)
	return awarded


# ---------------------------------------------------------------- 런 결산

## 한 판이 끝나면 아레나/결과 화면이 한 번 부른다.
## 월급 → 누적 통계 → 표창장 → 해금 순서로 정산하고 저장한다.
## 돌려주는 딕셔너리를 결과 화면이 그대로 쓴다.
func record_run(victory: bool, run_stats: Dictionary) -> Dictionary:
	var earned: int = GameState.progression.salary_for(victory, run_stats)
	add_salary(earned)

	var s: Dictionary = stats()
	s["total_runs"] = int(s.get("total_runs", 0)) + 1
	s["total_kills"] = int(s.get("total_kills", 0)) + int(run_stats.get("kills", 0))
	s["boss_kills"] = int(s.get("boss_kills", 0)) + int(run_stats.get("boss_kills", 0))
	s["evolutions"] = int(s.get("evolutions", 0)) + int(run_stats.get("evolutions", 0))
	s["best_level"] = maxi(int(s.get("best_level", 1)), int(run_stats.get("level", 1)))
	s["best_run_kills"] = maxi(int(s.get("best_run_kills", 0)), int(run_stats.get("kills", 0)))
	s["best_survive_sec"] = maxf(float(s.get("best_survive_sec", 0.0)),
			float(run_stats.get("survived_sec", 0.0)))
	if victory:
		s["runs_won"] = int(s.get("runs_won", 0)) + 1

	var awarded: Array[StringName] = check_commendations()
	var opened: Array[UnlockData] = refresh_unlocks()
	save_game()
	EventBus.meta_changed.emit()
	return {
		"salary": earned,
		"commendations": awarded,
		"unlocks": opened,
	}
