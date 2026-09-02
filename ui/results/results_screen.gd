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
	_dress()
	_build_meta_rows()
	EventBus.run_ended.connect(_on_run_ended)
	again.pressed.connect(_on_again)


## 메타 화면과 같은 갱지 톤. 결과 화면만 검은 대화상자로 남아 있으면
## 「전역증 발급」 이라는 컨셉이 안 산다 -- 서류인데 서류처럼 안 보인다.
func _dress() -> void:
	var panel: PanelContainer = $Center/Panel
	panel.add_theme_stylebox_override(&"panel", MetaUI.paper_box())
	body.add_theme_color_override(&"font_color", MetaUI.INK)
	body.add_theme_font_size_override(&"font_size", MetaUI.FS_BODY)
	title.add_theme_font_size_override(&"font_size", MetaUI.FS_TITLE)
	_style_button(again)


func _style_button(b: Button) -> void:
	b.add_theme_font_size_override(&"font_size", MetaUI.FS_HEAD)
	b.add_theme_color_override(&"font_color", MetaUI.INK)
	b.add_theme_color_override(&"font_hover_color", MetaUI.STAMP)
	b.add_theme_color_override(&"font_pressed_color", MetaUI.INK)
	# ★ 포커스 색을 빼먹으면 기본 흰색이 갱지 위에 얹혀 글자가 안 읽힌다.
	#   결과 화면은 열리자마자 「재입대」에 포커스를 주므로 바로 드러난다.
	b.add_theme_color_override(&"font_focus_color", MetaUI.INK)
	b.add_theme_stylebox_override(&"normal", MetaUI._button_box(MetaUI.PAPER, MetaUI.INK))
	b.add_theme_stylebox_override(&"hover", MetaUI._button_box(MetaUI.PAPER_DARK, MetaUI.STAMP))
	b.add_theme_stylebox_override(&"pressed", MetaUI._button_box(MetaUI.PAPER_DARK, MetaUI.STAMP, 3))
	b.add_theme_stylebox_override(&"focus", MetaUI._button_box(Color(0, 0, 0, 0), MetaUI.STAMP))
	b.custom_minimum_size = Vector2(0.0, MetaUI.TOUCH_MIN)
	b.size_flags_horizontal = Control.SIZE_EXPAND_FILL


func _build_meta_rows() -> void:
	var box: VBoxContainer = again.get_parent()
	_rewards = Label.new()
	_rewards.add_theme_font_size_override(&"font_size", MetaUI.FS_SUB)
	# 갱지 위에서는 금색이 안 읽힌다. 보상은 인장색(진홍)으로 -- 도장 찍힌 느낌이다.
	_rewards.add_theme_color_override(&"font_color", MetaUI.STAMP)
	_rewards.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(_rewards)
	box.move_child(_rewards, again.get_index())

	_to_menu = Button.new()
	_to_menu.text = tr("부대 복귀")
	_style_button(_to_menu)
	_to_menu.pressed.connect(_on_to_menu)
	box.add_child(_to_menu)


func _on_run_ended(victory: bool, stats: Dictionary) -> void:
	# 전역증은 금색 도장, 전역 연기는 빨간 도장. 서류에 찍히는 색 그대로다.
	title.add_theme_color_override(&"font_color",
			MetaUI.GOLD if victory else MetaUI.STAMP)
	if victory:
		title.text = tr("전 역 증")
		body.text = tr("귀하는 위 기간 성실히 복무하였기에\n이 증서를 수여함.\n\n처치 %d") % int(stats.get("kills", 0))
	else:
		title.text = tr("전 역 연 기")
		body.text = tr("D-%d 에서 쓰러졌다.\n\n처치 %d") % [GameState.days_left(), int(stats.get("kills", 0))]
	_rewards.text = _reward_text(stats)
	show()
	get_tree().paused = true
	again.grab_focus()


## 이번 판에 번 월급과, 이번 판에 새로 열린 것들.
func _reward_text(stats: Dictionary) -> String:
	var meta: Dictionary = stats.get("meta", {})
	var lines: Array[String] = [tr("월급  %s") % MetaUI.won(int(meta.get("salary", 0)))]

	var awarded: Array = meta.get("commendations", [])
	for id: Variant in awarded:
		var c: CommendationData = SaveSystem.commendations_table.find(StringName(id))
		if c != null:
			lines.append(tr("표창장 발급 — %s") % tr(c.display_name))

	var opened: Array = meta.get("unlocks", [])
	for u: Variant in opened:
		var unlock := u as UnlockData
		if unlock != null:
			lines.append(tr("해금 — %s") % tr(unlock.display_name))
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
