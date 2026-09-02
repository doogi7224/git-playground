extends Control
## 메인 메뉴 = 「부대 정문」. 여기서 출두하거나 PX 에 가거나 표창장을 본다.
##
## 화면을 .tscn 으로 짜지 않고 코드로 짓는다. 항목이 데이터(.tres)에서 오기 때문에
## 어차피 런타임에 만들어야 하고, 씬 파일로 두면 목록이 두 군데로 갈라진다.

signal open_requested(screen: StringName)

var _box: VBoxContainer = null
var _salary_label: Label = null


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build()
	EventBus.meta_changed.connect(_refresh)


func _build() -> void:
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	var panel: PanelContainer = MetaUI.panel()
	center.add_child(panel)

	_box = VBoxContainer.new()
	_box.custom_minimum_size = Vector2(600.0, 0.0)
	_box.add_theme_constant_override(&"separation", 14)
	panel.add_child(_box)

	_box.add_child(MetaUI.title("전역까지 D-100"))
	var sub: Label = MetaUI.label("병력 운용 및 전역 관리 시스템", 20, MetaUI.INK_FADED)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_box.add_child(sub)
	_box.add_child(MetaUI.rule())

	_salary_label = MetaUI.label("", 26, MetaUI.INK)
	_salary_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_box.add_child(_salary_label)
	_box.add_child(MetaUI.spacer(12.0))

	_add_button("출     두", &"select")
	_add_button("P X   상 점", &"shop")
	_add_button("표  창  장", &"board")
	_add_button("설     정", &"options")
	_add_button("퇴     소", &"quit")
	_refresh()


func _add_button(text: String, screen: StringName) -> void:
	var b: Button = MetaUI.button(text, 30)
	b.pressed.connect(func() -> void: open_requested.emit(screen))
	_box.add_child(b)


func _refresh() -> void:
	var stats: Dictionary = SaveSystem.stats()
	_salary_label.text = "보유 월급  %s\n복무 %d회 · 전역 %d회 · 표창 %d장" % [
		MetaUI.won(SaveSystem.salary()),
		int(stats.get("total_runs", 0)),
		int(stats.get("runs_won", 0)),
		(SaveSystem.data["commendations"] as Array).size(),
	]


## 키보드만으로도 돌아가야 한다. 화면이 열릴 때 첫 버튼을 잡는다.
func focus_first() -> void:
	for child: Node in _box.get_children():
		if child is Button:
			(child as Button).grab_focus()
			return
