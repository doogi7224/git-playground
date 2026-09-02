extends Control
## 표창장 게시판. 받은 것은 빨간 인장이, 아직인 것은 진행률이 붙는다.
##
## 목록과 조건은 data/commendations/*.tres 에 있다.

signal back_requested()

var _list: VBoxContainer = null
var _summary: Label = null


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build()
	EventBus.meta_changed.connect(_refresh)


func _build() -> void:
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side: StringName in [&"margin_left", &"margin_right"]:
		margin.add_theme_constant_override(side, 180)
	for side: StringName in [&"margin_top", &"margin_bottom"]:
		margin.add_theme_constant_override(side, 60)
	add_child(margin)

	var panel: PanelContainer = MetaUI.panel()
	margin.add_child(panel)

	var col := VBoxContainer.new()
	col.add_theme_constant_override(&"separation", 12)
	panel.add_child(col)

	col.add_child(MetaUI.title("표     창     장", 40))
	_summary = MetaUI.label("", 24, MetaUI.INK)
	_summary.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col.add_child(_summary)
	col.add_child(MetaUI.rule())

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	col.add_child(scroll)

	_list = VBoxContainer.new()
	_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_list.add_theme_constant_override(&"separation", 8)
	scroll.add_child(_list)

	col.add_child(MetaUI.rule())
	var back: Button = MetaUI.button("돌아가기", 26)
	back.pressed.connect(func() -> void: back_requested.emit())
	col.add_child(back)

	_refresh()


func _refresh() -> void:
	for child: Node in _list.get_children():
		_list.remove_child(child)
		child.queue_free()

	var stats: Dictionary = SaveSystem.stats()
	var all: Array[CommendationData] = SaveSystem.commendations_table.commendations
	var owned: int = 0
	var dark: bool = false
	for c: CommendationData in all:
		if c == null:
			continue
		var has: bool = SaveSystem.has_commendation(c.id)
		if has:
			owned += 1
		_list.add_child(_row(c, has, stats, dark))
		dark = not dark
	_summary.text = tr("%d장 중 %d장 발급") % [all.size(), owned]


func _row(c: CommendationData, has: bool, stats: Dictionary, dark: bool) -> Control:
	var row: PanelContainer = MetaUI.panel(dark)
	var h := HBoxContainer.new()
	h.add_theme_constant_override(&"separation", 20)
	row.add_child(h)

	var text := VBoxContainer.new()
	text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(text)
	text.add_child(MetaUI.label(c.display_name, 26, MetaUI.INK if has else MetaUI.INK_FADED))
	# 아직 못 받은 표창장은 설명 대신 조건을 보여 준다. 뭘 하면 되는지가 먼저다.
	if has:
		text.add_child(MetaUI.label(c.description, 18, MetaUI.INK_FADED))
	elif c.condition != null:
		text.add_child(MetaUI.label(tr("조건 — %s (%d%%)") % [
				c.condition.describe(),
				int(round(c.condition.ratio(stats) * 100.0))], 18, MetaUI.INK_FADED))

	var right := VBoxContainer.new()
	right.custom_minimum_size = Vector2(200.0, 0.0)
	h.add_child(right)
	if has:
		right.add_child(MetaUI.stamp("발  급", 30))
	elif c.condition != null:
		var bar := ProgressBar.new()
		bar.max_value = 1.0
		bar.value = c.condition.ratio(stats)
		bar.show_percentage = false
		bar.custom_minimum_size = Vector2(0.0, 22.0)
		right.add_child(bar)
	if c.salary_reward > 0:
		right.add_child(MetaUI.label(tr("보상 %s") % MetaUI.won(c.salary_reward), 18, MetaUI.INK_FADED))
	return row
