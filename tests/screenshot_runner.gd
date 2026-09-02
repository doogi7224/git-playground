extends Node
## 실제 렌더러로 게임을 잠깐 돌려 스크린샷을 뜬다. 화면을 못 보는 환경에서
## "정말 그려지고 있는지"를 확인하는 유일한 수단이다.
##
##   tools/screenshot.sh --out=/tmp/shot.png --seconds=90 --scale=6
##   tools/screenshot.sh --out=/tmp/lv.png --seconds=600 --hold-levelup
##   tools/screenshot.sh --seq=/tmp/frames --seq-seconds=12 --from=300
##
## 레벨업 창이 뜨면 자동으로 첫 카드를 고른다(안 그러면 일시정지에서 영원히 멈춘다).
## --hold-levelup 을 주면 반대로 그 창이 뜨는 순간을 기다렸다가 찍는다.

const ARENA: String = "res://maps/arena.tscn"

var _out: String = "user://shot.png"
var _seconds: float = 60.0
var _scale: float = 6.0
var _max_frames: int = 20000

var _drive: bool = true
## 시계를 여기서부터 시작한다. 후반 웨이브나 보스를 보려고 20분을 기다릴 수는 없다.
var _from: float = 0.0
## 맵을 지정한다. 아레나는 저장된 선택을 읽으므로 그쪽에 심어 준다.
var _map: String = ""
## 명령서(레벨업) 창이 뜬 순간을 잡는다. 이때 게임은 일시정지라 시계가 멈추므로
## _seconds 로는 못 끝난다 — 창을 보면 바로 찍고 끝낸다.
var _hold_levelup: bool = false
## 적이 이만큼 모이면 바로 찍는다. 자동 플레이 봇은 중반에 죽어 버려서
## "--seconds 까지 돌린다" 로는 결과 화면만 찍힌다 -- 살아 있을 때 잡아야 한다.
var _until_enemies: int = 0
## 연속 프레임을 뽑아 동영상으로 만든다. --fixed-fps 와 같이 써야 델타가 일정하다.
var _seq_dir: String = ""
var _seq_seconds: float = 12.0

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
		elif arg.begins_with("--from="):
			_from = float(arg.substr(7))
		elif arg.begins_with("--map="):
			_map = arg.substr(6)
		elif arg.begins_with("--until-enemies="):
			_until_enemies = int(arg.substr(16))
		elif arg == "--hold-levelup":
			_hold_levelup = true
		elif arg.begins_with("--seq-seconds="):
			_seq_seconds = float(arg.substr(14))
		elif arg.begins_with("--seq="):
			_seq_dir = arg.substr(6)
	_run.call_deferred()


func _run() -> void:
	if _map != "":
		SaveSystem.remember_selection(SaveSystem.last_character(), StringName(_map))
	_arena = load(ARENA).instantiate()
	get_tree().root.add_child(_arena)
	await get_tree().process_frame

	if _from > 0.0:
		GameState.elapsed = _from
	Engine.time_scale = _scale
	var frames: int = 0
	while GameState.elapsed < _seconds and frames < _max_frames:
		await get_tree().process_frame
		frames += 1
		if _hold_levelup:
			if _levelup_cards() != null:
				break
		else:
			_auto_pick_upgrade()
		if _until_enemies > 0 and (_arena.get_node("Enemies") as EnemyManager).get_count() >= _until_enemies:
			break
		if _drive:
			_auto.drive(_arena.get_node("Player"), GameState.elapsed)

	Engine.time_scale = 1.0
	var img: Image = await ScreenGrab.grab(self)
	var err: int = img.save_png(_out)
	if _seq_dir != "":
		err = await _capture_sequence()

	var enemies: EnemyManager = _arena.get_node("Enemies")
	var pickups: PickupManager = _arena.get_node("Pickups")
	var player: Player = _arena.get_node("Player")
	print("=== 스크린샷 ===")
	print("  맵        : %s" % SaveSystem.last_map())
	print("  경과      : %.1fs (D-%d)" % [GameState.elapsed, GameState.days_left()])
	print("  프레임    : %d" % frames)
	print("  적        : %d마리" % enemies.get_count())
	print("  픽업      : %d개" % pickups.get_count())
	print("  플레이어  : Lv.%d  HP %.0f/%.0f  (진급 %d회)" % [player.level, player.hp, player.max_hp, _levelups])
	print("  처치      : %d" % int(GameState.run_stats.get("kills", 0)))
	print("  이미지    : %s (%dx%d, err=%d)" % [_out, img.get_width(), img.get_height(), err])
	get_tree().quit(0 if err == OK else 1)


## 매 프레임 한 장씩 뽑는다. --fixed-fps 로 델타를 고정해 두면 실제 걸린 시간과
## 무관하게 일정한 속도의 영상이 된다(소프트웨어 렌더러라 실시간은 훨씬 느리다).
func _capture_sequence() -> int:
	DirAccess.make_dir_recursive_absolute(_seq_dir)
	var start: float = GameState.elapsed
	var i: int = 0
	while GameState.elapsed - start < _seq_seconds and i < 4000:
		_auto_pick_upgrade()
		if _drive:
			_auto.drive(_arena.get_node("Player"), GameState.elapsed)
		var img: Image = await ScreenGrab.grab(self, 1)
		var err: int = img.save_png("%s/f%04d.png" % [_seq_dir, i])
		if err != OK:
			return err
		i += 1
	print("  연속컷    : %d장 → %s" % [i, _seq_dir])
	return OK


func _levelup_cards() -> Node:
	var screen: Control = _arena.get_node_or_null("UI/LevelUpScreen") as Control
	if screen == null or not screen.visible:
		return null
	var cards: Node = screen.get_node_or_null("Center/Panel/Margin/VBox/Cards")
	if cards == null or cards.get_child_count() == 0:
		return null
	return cards


func _auto_pick_upgrade() -> void:
	var cards: Node = _levelup_cards()
	if cards == null:
		return
	_levelups += 1
	(cards.get_child(0) as Button).pressed.emit()
