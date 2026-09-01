extends Node
## 실제 렌더러로 게임을 잠깐 돌려 스크린샷을 뜬다. 화면을 못 보는 환경에서
## "정말 그려지고 있는지"를 확인하는 유일한 수단이다.
##
##   tools/screenshot.sh --out=/tmp/shot.png --seconds=90 --scale=6
##
## 레벨업 창이 뜨면 자동으로 첫 카드를 고른다(안 그러면 일시정지에서 영원히 멈춘다).

const ARENA: String = "res://maps/arena.tscn"

var _out: String = "user://shot.png"
var _seconds: float = 60.0
var _scale: float = 6.0
var _max_frames: int = 20000

var _drive: bool = true
var _auto: AutoPlayer = AutoPlayer.new()
var _arena: Node = null
var _levelups: int = 0


func _ready() -> void:
	for arg: String in OS.get_cmdline_user_args():
		if arg.begins_with("--out="):
			_out = arg.substr(6)
		elif arg.begins_with("--seconds="):
			_seconds = float(arg.substr(10))
		elif arg.begins_with("--scale="):
			_scale = float(arg.substr(8))
		elif arg == "--no-drive":
			_drive = false
	_run.call_deferred()


func _run() -> void:
	_arena = load(ARENA).instantiate()
	get_tree().root.add_child(_arena)
	await get_tree().process_frame

	Engine.time_scale = _scale
	var frames: int = 0
	while GameState.elapsed < _seconds and frames < _max_frames:
		await get_tree().process_frame
		frames += 1
		_auto_pick_upgrade()
		if _drive:
			_auto.drive(_arena.get_node("Player"), GameState.elapsed)

	Engine.time_scale = 1.0
	await get_tree().process_frame
	await RenderingServer.frame_post_draw

	var img: Image = get_viewport().get_texture().get_image()
	var err: int = img.save_png(_out)

	var enemies: EnemyManager = _arena.get_node("Enemies")
	var pickups: PickupManager = _arena.get_node("Pickups")
	var player: Player = _arena.get_node("Player")
	print("=== 스크린샷 ===")
	print("  경과      : %.1fs (D-%d)" % [GameState.elapsed, GameState.days_left()])
	print("  프레임    : %d" % frames)
	print("  적        : %d마리" % enemies.get_count())
	print("  픽업      : %d개" % pickups.get_count())
	print("  플레이어  : Lv.%d  HP %.0f/%.0f  (진급 %d회)" % [player.level, player.hp, player.max_hp, _levelups])
	print("  처치      : %d" % int(GameState.run_stats.get("kills", 0)))
	print("  이미지    : %s (%dx%d, err=%d)" % [_out, img.get_width(), img.get_height(), err])
	get_tree().quit(0 if err == OK else 1)


func _auto_pick_upgrade() -> void:
	var screen: Control = _arena.get_node_or_null("UI/LevelUpScreen") as Control
	if screen == null or not screen.visible:
		return
	var cards: Node = screen.get_node_or_null("Center/Panel/Margin/VBox/Cards")
	if cards == null or cards.get_child_count() == 0:
		return
	_levelups += 1
	(cards.get_child(0) as Button).pressed.emit()
