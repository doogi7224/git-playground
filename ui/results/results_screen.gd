extends Control
## 전역증(승리) / 전역 연기(패배). 한 판의 결산을 보여 준다.
##
## 월급·표창장·해금 정산은 GameState.end_run 에서 이미 끝났다 (SaveSystem.record_run).
## 여기서 다시 부르면 월급이 두 번 들어간다 — 결과만 읽어서 찍는다.

const META_SCENE: String = "res://ui/meta/meta_root.tscn"

@onready var title: Label = $Center/Panel/Margin/VBox/Title
@onready var body: Label = $Center/Panel/Margin/VBox/Body
@onready var again: Button = $Center/Panel/Margin/VBox/Again

var _rewards: Label = null
var _to_menu: Button = null


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	hide()
	_build_meta_rows()
	EventBus.run_ended.connect(_on_run_ended)
	again.pressed.connect(_on_again)


func _build_meta_rows() -> void:
	var box: VBoxContainer = again.get_parent()
	_rewards = Label.new()
	_rewards.add_theme_font_size_override(&"font_size", 22)
	_rewards.add_theme_color_override(&"font_color", MetaUI.GOLD)
	_rewards.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(_rewards)
	box.move_child(_rewards, again.get_index())

	_to_menu = Button.new()
	_to_menu.text = "부대 복귀"
	_to_menu.custom_minimum_size = Vector2(280.0, 64.0)
	_to_menu.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	_to_menu.add_theme_font_size_override(&"font_size", 28)
	_to_menu.pressed.connect(_on_to_menu)
	box.add_child(_to_menu)


func _on_run_ended(victory: bool, stats: Dictionary) -> void:
	if victory:
		title.text = "전 역 증"
		body.text = "귀하는 위 기간 성실히 복무하였기에\n이 증서를 수여함.\n\n처치 %d" % int(stats.get("kills", 0))
	else:
		title.text = "전 역 연 기"
		body.text = "D-%d 에서 쓰러졌다.\n\n처치 %d" % [GameState.days_left(), int(stats.get("kills", 0))]
	_rewards.text = _reward_text(stats)
	show()
	get_tree().paused = true
	again.grab_focus()


## 이번 판에 번 월급과, 이번 판에 새로 열린 것들.
func _reward_text(stats: Dictionary) -> String:
	var meta: Dictionary = stats.get("meta", {})
	var lines: Array[String] = ["월급  %s" % MetaUI.won(int(meta.get("salary", 0)))]

	var awarded: Array = meta.get("commendations", [])
	for id: Variant in awarded:
		var c: CommendationData = SaveSystem.commendations_table.find(StringName(id))
		if c != null:
			lines.append("표창장 발급 — %s" % c.display_name)

	var opened: Array = meta.get("unlocks", [])
	for u: Variant in opened:
		var unlock := u as UnlockData
		if unlock != null:
			lines.append("해금 — %s" % unlock.display_name)
	return "\n".join(lines)


func _on_again() -> void:
	get_tree().paused = false
	get_tree().reload_current_scene()


func _on_to_menu() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file(META_SCENE)


## 이 화면은 트리 전체를 멈춘다. 두 버튼 말고 다른 경로로 씬이 사라지면
## 일시정지가 그대로 남아서 게임이 통째로 얼어붙는다 -- 자동 플레이가 두 번째 판을
## 0초 만에 끝내면서 이걸 드러냈다. 떠날 때는 무조건 푼다.
func _exit_tree() -> void:
	var tree: SceneTree = get_tree()
	if tree != null:
		tree.paused = false
