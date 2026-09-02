extends Control
## PX(매점) 상점. 월급으로 영구 강화를 산다.
##
## 항목·효과·가격은 전부 data/px/*.tres 에 있다 (CLAUDE.md 규칙 4).
## 여기 있는 건 그걸 줄 세워 보여 주고 SaveSystem.buy_px 를 부르는 배선뿐이다.

signal back_requested()

var _list: VBoxContainer = null
var _salary_label: Label = null


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	_build()
	EventBus.meta_changed.connect(_refresh)


func _build() -> void:
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	for side: StringName in [&"margin_left", &"margin_right"]:
		margin.add_theme_constant_override(side, MetaUI.SIDE_MARGIN)
	for side: StringName in [&"margin_top", &"margin_bottom"]:
		margin.add_theme_constant_override(side, 48)
	add_child(margin)

	var panel: PanelContainer = MetaUI.panel()
	margin.add_child(panel)

	var col := VBoxContainer.new()
	col.add_theme_constant_override(&"separation", 12)
	panel.add_child(col)

	col.add_child(MetaUI.title("P X   보  급  품"))
	_salary_label = MetaUI.label("", MetaUI.FS_SUB, MetaUI.INK)
	_salary_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col.add_child(_salary_label)
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
	var back: Button = MetaUI.button("돌아가기")
	back.pressed.connect(func() -> void: back_requested.emit())
	col.add_child(back)

	_refresh()


func _refresh() -> void:
	_salary_label.text = tr("보유 월급  %s") % MetaUI.won(SaveSystem.salary())
	for child: Node in _list.get_children():
		_list.remove_child(child)
		child.queue_free()
	var dark: bool = false
	for item: PxUpgradeData in SaveSystem.px_shop.items:
		if item == null:
			continue
		_list.add_child(_row(item, dark))
		dark = not dark


## 한 줄 = 이름/설명 + 레벨 눈금 + 구매 버튼. 서류 한 칸처럼 줄무늬를 준다.
func _row(item: PxUpgradeData, dark: bool) -> Control:
	var level: int = SaveSystem.px_level(item.id)
	var cost: int = SaveSystem.px_next_cost(item.id)
	var maxed: bool = cost < 0

	var row: PanelContainer = MetaUI.panel(dark)
	var h := HBoxContainer.new()
	h.add_theme_constant_override(&"separation", 20)
	row.add_child(h)

	var text := VBoxContainer.new()
	text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(text)
	text.add_child(MetaUI.label(item.display_name, MetaUI.FS_BODY))
	text.add_child(MetaUI.label(item.description, MetaUI.FS_TINY, MetaUI.INK_FADED))

	var status := VBoxContainer.new()
	status.custom_minimum_size = Vector2(180.0, 0.0)
	h.add_child(status)
	status.add_child(MetaUI.label(_pips(level, item.max_level), MetaUI.FS_SUB))
	status.add_child(MetaUI.label(tr("현재 %s") % item.describe_level(level), MetaUI.FS_TINY, MetaUI.INK_FADED))

	var buy: Button = MetaUI.button("완료" if maxed else MetaUI.won(cost), MetaUI.FS_SUB)
	buy.custom_minimum_size = Vector2(210.0, MetaUI.TOUCH_MIN_SMALL)
	buy.disabled = maxed or not SaveSystem.can_buy_px(item.id)
	if not maxed:
		var id: StringName = item.id
		buy.pressed.connect(func() -> void: SaveSystem.buy_px(id))
	h.add_child(buy)
	return row


## ■■■□□ — 레벨을 눈으로 세게 한다. 숫자보다 빠르다.
func _pips(level: int, max_level: int) -> String:
	var out: String = ""
	for i in max_level:
		out += "■" if i < level else "□"
	return out
