extends Control
## 진급(레벨업) 시 게임을 멈추고 「병력 운용 명령서」 3장을 내민다.
##
## 겉모습은 메타 화면과 같은 갱지·인장이다 (MetaUI). 한 판에 서른 번 넘게 뜨는
## 창인데 M0 화이트박스 버튼 3개로 남아 있었다 — PX 상점·전역증만 서류가 되고
## 정작 제일 자주 보는 창이 대화상자였다.
##
## 배치는 세로 스택이다. 260x300 카드를 가로로 3장 늘어놓던 배치는 1920x1080
## 시절 것이라, 세로 폰에서는 폭이 모자라 글자가 줄바꿈으로 뭉개졌다.

const OFFER_COUNT: int = 3
## 카드 하나의 높이. 제목 한 줄 + 설명 두 줄이 들어가고, 터치 타깃(116)의 두 배가 넘는다.
## Button 은 자식 컨테이너 크기를 따라 자라지 않으므로 여기서 못박는다.
const CARD_HEIGHT: float = 196.0

@onready var cards: VBoxContainer = $Center/Panel/Margin/VBox/Cards
@onready var title: Label = $Center/Panel/Margin/VBox/Title
@onready var stamp: Label = $Center/Panel/Margin/VBox/Stamp

var player: Player = null
var upgrade_table: UpgradeTable = null

var _pending: int = 0


func _ready() -> void:
	# 일시정지 중에도 이 UI만 살아 있어야 한다.
	process_mode = Node.PROCESS_MODE_ALWAYS
	_dress()
	hide()
	EventBus.player_leveled.connect(_on_player_leveled)


## 갱지 톤. 전역증(results_screen)이 하는 것과 같다.
func _dress() -> void:
	var panel: PanelContainer = $Center/Panel
	panel.add_theme_stylebox_override(&"panel", MetaUI.paper_box())
	title.add_theme_font_size_override(&"font_size", MetaUI.FS_TITLE)
	title.add_theme_color_override(&"font_color", MetaUI.INK)
	stamp.add_theme_font_size_override(&"font_size", MetaUI.FS_SUB)
	stamp.add_theme_color_override(&"font_color", MetaUI.STAMP)
	($Center/Panel/Margin/VBox/Rule as ColorRect).color = MetaUI.INK


func _on_player_leveled(_level: int) -> void:
	_pending += 1
	if not visible:
		_show_next()


func _show_next() -> void:
	if _pending <= 0:
		_close()
		return
	_clear_cards()

	# 갱지 폭은 화면에 맞춰 벌린다. CenterContainer 는 자식을 최소 크기로 두므로
	# 여기서 못박지 않으면 글자 길이에 따라 카드 폭이 판마다 달라진다.
	var panel: PanelContainer = $Center/Panel
	panel.custom_minimum_size = Vector2(
			maxf(480.0, get_viewport_rect().size.x - MetaUI.SIDE_MARGIN * 2.0), 0.0)

	title.text = MetaUI.t("병력 운용 명령서")
	stamp.text = MetaUI.t("1장을 선택하시오") if _pending <= 1 \
			else MetaUI.t("1장을 선택하시오 (진급 %d회 대기)") % _pending

	var levels: Dictionary = player.upgrade_levels if player != null else {}
	var offered: Array[UpgradeData] = upgrade_table.roll(OFFER_COUNT, levels) if upgrade_table != null else []
	if offered.is_empty():
		# 더 고를 게 없으면 멈추지 말고 그냥 넘어간다
		_pending = 0
		_close()
		return

	for entry: UpgradeData in offered:
		cards.add_child(_make_card(entry, int(levels.get(entry.id, 0))))

	show()
	get_tree().paused = true
	EventBus.game_paused.emit(true)
	if cards.get_child_count() > 0:
		(cards.get_child(0) as Button).grab_focus()


## 카드 한 장. **Cards 의 직계 자식은 반드시 Button 이다** — 테스트와
## tests/screenshot_runner.gd 가 `cards.get_child(i) as Button` 으로 누른다.
## 그래서 PanelContainer 로 감싸지 않고 Button 안에 내용을 넣는다.
func _make_card(entry: UpgradeData, level: int) -> Button:
	var card := Button.new()
	card.custom_minimum_size = Vector2(0.0, CARD_HEIGHT)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.add_theme_stylebox_override(&"normal", MetaUI._button_box(MetaUI.PAPER, MetaUI.INK))
	card.add_theme_stylebox_override(&"hover", MetaUI._button_box(MetaUI.PAPER_DARK, MetaUI.STAMP))
	card.add_theme_stylebox_override(&"pressed", MetaUI._button_box(MetaUI.PAPER_DARK, MetaUI.STAMP, 3))
	card.add_theme_stylebox_override(&"focus", MetaUI._button_box(Color(0, 0, 0, 0), MetaUI.STAMP, 3))

	# 글자는 자식 Label 로 그린다. Button.text 는 한 덩어리라 제목과 설명의
	# 크기·색을 못 나눈다 -- 예전에 "제목\n\n설명" 을 통째로 넣던 이유이자,
	# 세로 화면에서 뭉개지던 이유다.
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	for side: StringName in [&"margin_left", &"margin_right"]:
		margin.add_theme_constant_override(side, 22)
	for side: StringName in [&"margin_top", &"margin_bottom"]:
		margin.add_theme_constant_override(side, 18)
	card.add_child(margin)

	var row := HBoxContainer.new()
	row.add_theme_constant_override(&"separation", 16)
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.add_child(row)

	var text := VBoxContainer.new()
	text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	text.add_theme_constant_override(&"separation", 8)
	text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(text)

	var name_label: Label = MetaUI.label(entry.title, MetaUI.FS_HEAD, MetaUI.INK)
	name_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	text.add_child(name_label)

	var desc: Label = MetaUI.label(entry.description, MetaUI.FS_SUB, MetaUI.INK_FADED)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc.mouse_filter = Control.MOUSE_FILTER_IGNORE
	text.add_child(desc)

	# 오른쪽 도장 자리 — 처음 받는 것인지, 몇 번째 강화인지.
	var mark: Label = MetaUI.stamp("신 규" if level <= 0 else "Lv.%d" % (level + 1), MetaUI.FS_BODY)
	mark.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	mark.custom_minimum_size = Vector2(120.0, 0.0)
	mark.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(mark)

	card.pressed.connect(_on_card_picked.bind(entry))
	return card


## 카드를 즉시 떼어낸다. queue_free 만 하면 이번 프레임 동안 자식이 그대로 남아서
## get_child_count() 가 거짓말을 하고, 죽은 카드의 pressed 도 아직 연결돼 있다.
## 그 '유령 카드' 가 눌리면 _pending 이 음수로 내려가고, 그 뒤 진급이 전부
## _pending <= 0 에 걸려 삼켜진다 — 명령서가 다시는 안 뜬다.
## 자동 플레이가 Lv.13 에 무기 1개로 죽던 원인이 이거였다. 사람이 더블클릭해도 똑같다.
func _clear_cards() -> void:
	for child: Node in cards.get_children():
		cards.remove_child(child)
		child.queue_free()


func _on_card_picked(upgrade: UpgradeData) -> void:
	# 한 벌에서 두 장이 눌리는 걸 막는다.
	if not visible:
		return
	_clear_cards()
	if player != null:
		player.apply_upgrade(upgrade)
	_pending = maxi(0, _pending - 1)
	if _pending > 0:
		_show_next()
	else:
		_close()


func _close() -> void:
	hide()
	get_tree().paused = false
	EventBus.game_paused.emit(false)
