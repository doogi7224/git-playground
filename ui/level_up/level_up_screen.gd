extends Control
## 진급(레벨업) 시 게임을 멈추고 명령서 3장을 내민다.
## M0는 텍스트 버튼. 기획서 3.4의 갱지·도장 연출은 M2에서.

const OFFER_COUNT: int = 3

@onready var cards: HBoxContainer = $Center/Panel/Margin/VBox/Cards
@onready var title: Label = $Center/Panel/Margin/VBox/Title

var player: Player = null
var upgrade_table: UpgradeTable = null

var _pending: int = 0


func _ready() -> void:
	# 일시정지 중에도 이 UI만 살아 있어야 한다.
	process_mode = Node.PROCESS_MODE_ALWAYS
	hide()
	EventBus.player_leveled.connect(_on_player_leveled)


func _on_player_leveled(_level: int) -> void:
	_pending += 1
	if not visible:
		_show_next()


func _show_next() -> void:
	if _pending <= 0:
		_close()
		return
	_clear_cards()

	title.text = tr("병력 운용 명령서 — 진급 %d회 대기") % _pending if _pending > 1 else tr("병력 운용 명령서")

	var levels: Dictionary = player.upgrade_levels if player != null else {}
	var offered: Array[UpgradeData] = upgrade_table.roll(OFFER_COUNT, levels) if upgrade_table != null else []
	if offered.is_empty():
		# 더 고를 게 없으면 멈추지 말고 그냥 넘어간다
		_pending = 0
		_close()
		return

	for entry: UpgradeData in offered:
		var button := Button.new()
		button.custom_minimum_size = Vector2(260, 300)
		button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		button.text = "%s\n\n%s" % [tr(entry.title), tr(entry.description)]
		button.add_theme_font_size_override(&"font_size", 22)
		button.pressed.connect(_on_card_picked.bind(entry))
		cards.add_child(button)

	show()
	get_tree().paused = true
	EventBus.game_paused.emit(true)
	if cards.get_child_count() > 0:
		(cards.get_child(0) as Button).grab_focus()


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
