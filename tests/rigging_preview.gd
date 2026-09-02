extends Node
## 리깅 템플릿을 눈으로 확인하는 미리보기. 걷기/공격/피격/사망을 나란히 돌리고
## 여러 시점의 스크린샷을 찍는다 — 정지 화면 한 장으로는 "움직이는지"를 못 본다.
##
##   tools/rigging_preview.sh --out=/tmp/rig --shots=4
##   tools/rigging_preview.sh --out=/tmp/rig --character=kim_private --zoom=4
##
## --character 를 주면 실제 아트를 끼운 상태로 본다. 도형만 보고 "맞겠지" 하면
## 목이 몸에서 떠 있는 것 같은 문제를 못 잡는다 -- 실제로 못 잡았다.

const TEMPLATE: String = "res://entities/characters/rigged_character.tscn"
const LABELS: Array[String] = ["걷기 walk", "공격 attack", "피격 hit", "사망 die"]
const ANIMS: Array[StringName] = [&"walk", &"attack", &"hit", &"die"]

var _out: String = "user://rig"
var _shots: int = 4
var _interval: float = 0.16
## 실제 아트를 끼울 캐릭터 id. 비우면 화이트박스 도형 그대로 본다.
var _character: String = ""
## 인게임 크기(96~128px)로는 이음새가 안 보인다. 크게 키워서 본다.
var _zoom: float = 1.0
var _rigs: Array[RiggedCharacter] = []


func _ready() -> void:
	for arg: String in OS.get_cmdline_user_args():
		if arg.begins_with("--out="):
			_out = arg.substr(6)
		elif arg.begins_with("--shots="):
			_shots = int(arg.substr(8))
		elif arg.begins_with("--interval="):
			_interval = float(arg.substr(11))
		elif arg.begins_with("--character="):
			_character = arg.substr(12)
		elif arg.begins_with("--zoom="):
			_zoom = maxf(0.2, float(arg.substr(7)))
	_run.call_deferred()


func _run() -> void:
	var scene: PackedScene = load(TEMPLATE) as PackedScene
	var root := Node2D.new()
	get_tree().root.add_child(root)

	var background := ColorRect.new()
	background.color = Color("#2A3222")
	background.size = Vector2(1920, 1080)
	# ★ 다리(z -2)와 왼팔(z -1)은 몸통보다 뒤에 있다. 배경을 기본 z(0)로 두면
	#   **배경이 그것들을 덮어 버린다** -- 실제로 "다리가 사라졌다" 고 한참 헤맸다.
	#   인게임 바닥은 z -100 이라 이 문제가 없다. 미리보기만 맞춰 준다.
	background.z_index = -100
	root.add_child(background)

	var character: CharacterData = null
	if _character != "":
		var path: String = "res://data/characters/%s.tres" % _character
		character = load(path) as CharacterData if ResourceLoader.exists(path) else null
		if character == null:
			push_warning("그런 캐릭터가 없다: %s" % _character)

	var spacing: float = 460.0 * _zoom
	for i in ANIMS.size():
		var rig: RiggedCharacter = scene.instantiate()
		rig.scale = Vector2.ONE * _zoom
		rig.position = Vector2(160.0 + spacing * 0.5 + float(i) * spacing, 640.0)
		root.add_child(rig)
		_rigs.append(rig)
		if character != null:
			for part: StringName in character.parts:
				rig.set_part(part, character.parts[part])

		var label := Label.new()
		label.text = LABELS[i]
		label.position = rig.position + Vector2(-90, 130.0 * _zoom)
		label.add_theme_font_size_override(&"font_size", 30)
		root.add_child(label)

	await get_tree().process_frame
	for i in ANIMS.size():
		_play(_rigs[i], ANIMS[i])

	for shot in _shots:
		# 애니메이션이 끝난 것은 다시 돌려서 매 컷마다 다른 자세가 나오게 한다
		await get_tree().create_timer(_interval).timeout
		for i in ANIMS.size():
			if not _rigs[i].anim.is_playing():
				_rigs[i].revive()
				_play(_rigs[i], ANIMS[i])
		var image: Image = await ScreenGrab.grab(self)
		image.save_png("%s_%d.png" % [_out, shot])
		print("  컷 %d 저장" % shot)

	print("리깅 미리보기 %d컷 저장 → %s_*.png" % [_shots, _out])
	get_tree().quit(0)


func _play(rig: RiggedCharacter, name: StringName) -> void:
	rig._locked = false
	match name:
		&"walk": rig.play_walk()
		&"attack": rig.play_attack()
		&"hit": rig.play_hit()
		&"die": rig.play_die()
