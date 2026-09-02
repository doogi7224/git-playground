extends Node
## 3,000마리 동시 스트레스 씬. 기획서 프롬프트 2.
##
##   godot --path . res://tests/stress_test.tscn -- --count=3000
##   또는 에디터에서 이 씬을 직접 실행 (F3로 오버레이, +/- 로 500마리 증감)
##
## 스폰 디렉터를 끄고 죽은 만큼 즉시 다시 채워서 목표 마릿수를 계속 유지한다.
## 잠깐 3,000마리가 되는 게 아니라 3,000마리인 상태가 지속돼야 의미가 있다.

const DEFAULT_COUNT: int = 3000
const RING_MIN: float = 120.0
const RING_MAX: float = 1100.0

var _target_count: int = DEFAULT_COUNT
var _arena: Node = null
var _enemies: EnemyManager = null
var _player: Player = null
var _auto: AutoPlayer = AutoPlayer.new()
var _cards: Node = null
var _headless_frames: int = 0
var _headless_limit: int = 0
var _shot_path: String = ""


func _ready() -> void:
	# 결과 화면이 트리를 일시정지시키면 이 노드도 같이 멈춰서 리포트를 못 낸다.
	process_mode = Node.PROCESS_MODE_ALWAYS
	for arg: String in OS.get_cmdline_user_args():
		if arg.begins_with("--count="):
			_target_count = int(arg.substr(8))
		elif arg.begins_with("--frames="):
			_headless_limit = int(arg.substr(9))
		elif arg.begins_with("--shot="):
			_shot_path = arg.substr(7)
	_start.call_deferred()


func _start() -> void:
	_arena = (load("res://maps/arena.tscn") as PackedScene).instantiate()
	get_tree().root.add_child(_arena)
	await get_tree().process_frame

	_enemies = _arena.get_node("Enemies")
	_player = _arena.get_node("Player")
	# 3,000마리에 둘러싸이면 즉사한다. 측정하려는 건 전투 밸런스가 아니라 프레임이다.
	_player.invulnerable = true
	# 용량을 목표치보다 넉넉히
	_enemies.set_capacity(maxi(_target_count + 512, 4096))
	(_arena.get_node("SpawnDirector") as SpawnDirector).enabled = false

	_cards = _arena.get_node("UI/LevelUpScreen/Center/Panel/Margin/VBox/Cards")
	var overlay: Control = _arena.get_node("UI/DebugOverlay")
	overlay.enemies = _enemies
	overlay.pickups = _arena.get_node("Pickups")
	overlay.visible = true

	_top_up()
	set_physics_process(true)


func _physics_process(_delta: float) -> void:
	if _enemies == null:
		return
	# 레벨업 창이 뜨면 트리가 멈춘다. 멈춘 채로 측정하면 숫자가 전부 거짓말이 된다.
	if _cards != null and _cards.get_child_count() > 0:
		(_cards.get_child(0) as Button).pressed.emit()
	_top_up()
	_auto.drive(_player, GameState.elapsed)

	if _headless_limit > 0:
		_headless_frames += 1
		if _headless_frames >= _headless_limit:
			_report()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		var key: int = (event as InputEventKey).physical_keycode
		if key == KEY_EQUAL or key == KEY_KP_ADD:
			_target_count += 500
			_enemies.set_capacity(maxi(_target_count + 512, _enemies.get_capacity()))
		elif key == KEY_MINUS or key == KEY_KP_SUBTRACT:
			_target_count = maxi(0, _target_count - 500)


## 목표 마릿수까지 화면 밖 링에 다시 채운다.
func _top_up() -> void:
	var need: int = _target_count - _enemies.get_count()
	var origin: Vector2 = _player.global_position
	for _i in need:
		var a: float = randf() * TAU
		var r: float = randf_range(RING_MIN, RING_MAX)
		if _enemies.spawn(0, origin + Vector2(cos(a), sin(a)) * r) < 0:
			break


func _report() -> void:
	if not _shot_path.is_empty():
		var img: Image = await ScreenGrab.grab(self)
		img.save_png(_shot_path)
		print("  스크린샷: %s" % _shot_path)
	print("=== 스트레스 테스트 ===")
	print("  목표 %d마리 / 실제 %d마리" % [_target_count, _enemies.get_count()])
	print("  시뮬 %.2fms  버퍼 %.2fms  (물리 1틱)" % [
		float(_enemies.last_sim_usec) / 1000.0, float(_enemies.last_buffer_usec) / 1000.0])
	print("  FPS %.1f  드로우콜 %d" % [
		Engine.get_frames_per_second(),
		RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TOTAL_DRAW_CALLS_IN_FRAME)])
	get_tree().quit(0)
