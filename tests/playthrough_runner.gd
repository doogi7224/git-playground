extends Node
## 한 판(20분)을 헤드리스로 끝까지 자동 플레이하고 결과를 보고한다.
## 밸런싱용 — "20분을 버틸 수 있는 판인가"를 사람이 앉아 있지 않고 확인한다.
##
##   tools/playthrough.sh [--scale=8] [--runs=3]
##
## ★ 배속을 너무 올리지 말 것. time_scale 20이면 물리 1틱 델타가 0.33초라
##   플레이어가 한 틱에 67px씩 순간이동한다. 획득 반경 18px짜리 '짬'을 그냥 통과해서,
##   5,600마리를 잡고도 Lv.6에서 끝나는 가짜 결과가 나온다. 8 이하를 쓸 것.

const ARENA: String = "res://maps/arena.tscn"

var _scale: float = 8.0
var _runs: int = 1
var _auto: AutoPlayer = AutoPlayer.new()


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for arg: String in OS.get_cmdline_user_args():
		if arg.begins_with("--scale="):
			_scale = float(arg.substr(8))
		elif arg.begins_with("--runs="):
			_runs = int(arg.substr(7))
	_go.call_deferred()


func _go() -> void:
	print("=== 20분 자동 플레이 (%d판) ===" % _runs)
	print("%3s | %8s | %6s | %5s | %6s | %s" % ["#", "생존", "처치", "Lv", "무기", "결과"])
	print("----|----------|--------|-------|--------|--------")
	var wins: int = 0
	for run in _runs:
		var result: Dictionary = await _play_once()
		if bool(result["victory"]):
			wins += 1
		print("%3d | %6.1fs | %6d | %5d | %6d | %s" % [
			run + 1, result["elapsed"], result["kills"], result["level"],
			result["weapons"], "전역" if result["victory"] else "전역 연기 (D-%d)" % result["days_left"]])
	print("--- %d판 중 %d판 전역 ---" % [_runs, wins])
	get_tree().quit(0)


func _play_once() -> Dictionary:
	var arena: Node = (load(ARENA) as PackedScene).instantiate()
	get_tree().root.add_child(arena)
	await get_tree().process_frame

	var player: Player = arena.get_node("Player")
	var level_up: Control = arena.get_node("UI/LevelUpScreen")
	var cards: Node = level_up.get_node("Center/Panel/Margin/VBox/Cards")

	Engine.time_scale = _scale
	var guard: int = 0
	while GameState.phase == GameState.Phase.PLAYING and guard < 200000:
		await get_tree().process_frame
		guard += 1
		_auto.drive(player, GameState.elapsed)
		if cards.get_child_count() > 0:
			# 무작위로 고른다. 항상 첫 장만 고르면 한 가지 빌드만 검증하게 된다.
			(cards.get_child(randi() % cards.get_child_count()) as Button).pressed.emit()
	Engine.time_scale = 1.0
	_auto.release_all()

	var result: Dictionary = {
		"victory": GameState.elapsed >= GameState.run_duration() - 0.5,
		"elapsed": GameState.elapsed,
		"days_left": GameState.days_left(),
		"kills": int(GameState.run_stats.get("kills", 0)),
		"level": player.level,
		"weapons": player.weapon_ids().size(),
	}
	arena.queue_free()
	await get_tree().process_frame
	GameState.phase = GameState.Phase.MENU
	GameState.elapsed = 0.0
	return result
