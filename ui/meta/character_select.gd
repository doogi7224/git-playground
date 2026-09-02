extends Control
## 출두 신고 = 캐릭터/훈련장 선택. 해금 상태도 여기서 본다.
##
## 무엇이 있고 무엇으로 열리는지는 data/unlocks/*.tres 가 정한다.
## 해금표에 없는 캐릭터는 여기 안 뜬다 — 목록이 두 군데로 갈라지지 않게 일부러 그렇게 뒀다.
## (tests/run_tests.gd 가 data/characters 전부에 해금 항목이 있는지 검사한다)

signal back_requested()
signal start_requested(character_id: StringName, map_id: StringName)

const CHARACTER_DIR: String = "res://data/characters/%s.tres"

var _character_id: StringName = &"kim_private"
var _map_id: StringName = &"parade_ground"

var _char_list: VBoxContainer = null
var _map_list: VBoxContainer = null
var _salary_label: Label = null
var _start_button: Button = null


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build()
	EventBus.meta_changed.connect(_refresh)


## 화면이 열릴 때마다 저장된 선택을 다시 읽는다.
func reload_selection() -> void:
	_character_id = SaveSystem.last_character()
	_map_id = SaveSystem.last_map()
	if not SaveSystem.is_character_unlocked(_character_id):
		_character_id = &"kim_private"
	if not SaveSystem.is_map_unlocked(_map_id):
		_map_id = &"parade_ground"
	_refresh()


func _build() -> void:
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side: StringName in [&"margin_left", &"margin_right"]:
		margin.add_theme_constant_override(side, 120)
	for side: StringName in [&"margin_top", &"margin_bottom"]:
		margin.add_theme_constant_override(side, 50)
	add_child(margin)

	var panel: PanelContainer = MetaUI.panel()
	margin.add_child(panel)

	var col := VBoxContainer.new()
	col.add_theme_constant_override(&"separation", 12)
	panel.add_child(col)

	col.add_child(MetaUI.title("출  두  신  고", 40))
	_salary_label = MetaUI.label("", 22, MetaUI.INK)
	_salary_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col.add_child(_salary_label)
	col.add_child(MetaUI.rule())

	var columns := HBoxContainer.new()
	columns.size_flags_vertical = Control.SIZE_EXPAND_FILL
	columns.add_theme_constant_override(&"separation", 24)
	col.add_child(columns)
	_char_list = _column(columns, "병      력", 2)
	_map_list = _column(columns, "훈  련  장", 1)

	col.add_child(MetaUI.rule())
	var footer := HBoxContainer.new()
	footer.add_theme_constant_override(&"separation", 16)
	col.add_child(footer)

	var back: Button = MetaUI.button("돌아가기", 26)
	back.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	back.pressed.connect(func() -> void: back_requested.emit())
	footer.add_child(back)

	_start_button = MetaUI.button("출  두", 30)
	_start_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_start_button.pressed.connect(_on_start)
	footer.add_child(_start_button)

	reload_selection()


func _column(parent: HBoxContainer, heading: String, stretch: int) -> VBoxContainer:
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.size_flags_stretch_ratio = float(stretch)
	col.add_theme_constant_override(&"separation", 8)
	parent.add_child(col)

	var head: Label = MetaUI.label(heading, 24, MetaUI.INK)
	head.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col.add_child(head)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)

	var list := VBoxContainer.new()
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override(&"separation", 6)
	scroll.add_child(list)
	return list


func _on_start() -> void:
	SaveSystem.remember_selection(_character_id, _map_id)
	start_requested.emit(_character_id, _map_id)


func _refresh() -> void:
	_salary_label.text = "보유 월급  %s" % MetaUI.won(SaveSystem.salary())
	for list: VBoxContainer in [_char_list, _map_list]:
		for child: Node in list.get_children():
			list.remove_child(child)
			child.queue_free()

	var stats: Dictionary = SaveSystem.stats()
	var dark: bool = false
	for u: UnlockData in SaveSystem.unlock_table.unlocks:
		if u == null:
			continue
		var is_char: bool = u.target == UnlockData.Target.CHARACTER
		(_char_list if is_char else _map_list).add_child(_row(u, stats, dark))
		dark = not dark
	_start_button.disabled = not (SaveSystem.is_character_unlocked(_character_id)
			and SaveSystem.is_map_unlocked(_map_id))


func _row(u: UnlockData, stats: Dictionary, dark: bool) -> Control:
	var unlocked: bool = SaveSystem.is_unlocked(u)
	var is_char: bool = u.target == UnlockData.Target.CHARACTER
	var chosen: bool = unlocked and u.target_id == (_character_id if is_char else _map_id)

	var row: PanelContainer = MetaUI.panel(dark or chosen)
	var h := HBoxContainer.new()
	h.add_theme_constant_override(&"separation", 16)
	row.add_child(h)

	var text := VBoxContainer.new()
	text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(text)
	var name_color: Color = MetaUI.INK if unlocked else MetaUI.INK_FADED
	text.add_child(MetaUI.label(("▶ " if chosen else "") + u.display_name, 24, name_color))
	if unlocked:
		text.add_child(MetaUI.label(u.description, 17, MetaUI.INK_FADED))
	else:
		text.add_child(MetaUI.label("조건 — %s" % u.condition.describe(), 17, MetaUI.INK_FADED))

	if unlocked:
		if chosen:
			h.add_child(MetaUI.stamp("선  택", 24))
		else:
			var pick: Button = MetaUI.button("선택", 22)
			pick.custom_minimum_size = Vector2(120.0, 44.0)
			var id: StringName = u.target_id
			pick.pressed.connect(func() -> void: _choose(is_char, id))
			h.add_child(pick)
	elif u.is_free():
		# 조건만 채우면 열린다. 아직 못 채웠다는 뜻이므로 진행률만 보여 준다.
		h.add_child(MetaUI.label("%d%%" % int(round(u.condition.ratio(stats) * 100.0)),
				22, MetaUI.INK_FADED))
	else:
		# 구매형. 조건을 아직 못 채웠으면 값만 흐리게 띄우지 말고 얼마나 남았는지도 보여 준다 —
		# 값이 없어서 못 사는 건지 조건이 모자라서 못 사는 건지 구분이 안 됐다.
		var right := VBoxContainer.new()
		right.custom_minimum_size = Vector2(140.0, 0.0)
		h.add_child(right)
		var buy: Button = MetaUI.button(MetaUI.won(u.price), 22)
		buy.custom_minimum_size = Vector2(140.0, 44.0)
		buy.disabled = not SaveSystem.can_buy_unlock(u.id)
		var unlock_id: StringName = u.id
		buy.pressed.connect(func() -> void: SaveSystem.buy_unlock(unlock_id))
		right.add_child(buy)
		if not u.condition_met(stats):
			var note: Label = MetaUI.label(
					"조건 %d%%" % int(round(u.condition.ratio(stats) * 100.0)),
					16, MetaUI.INK_FADED)
			note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			right.add_child(note)
	return row


func _choose(is_char: bool, id: StringName) -> void:
	if is_char:
		_character_id = id
	else:
		_map_id = id
	_refresh()
