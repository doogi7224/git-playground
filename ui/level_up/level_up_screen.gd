extends Control
## 진급(레벨업) 시 게임을 멈추고 명령서 3장을 내민다.
## M0는 텍스트 버튼. 기획서 3.4의 갱지·도장 연출은 M2에서.

@onready var cards: HBoxContainer = $Center/Panel/Margin/VBox/Cards
@onready var title: Label = $Center/Panel/Margin/VBox/Title

var player: Player = null

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
	for child: Node in cards.get_children():
		child.queue_free()

	title.text = "병력 운용 명령서 — 진급 %d회 대기" % _pending if _pending > 1 else "병력 운용 명령서"

	for entry: Dictionary in UpgradePool.roll():
		var button := Button.new()
		button.custom_minimum_size = Vector2(260, 300)
		button.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		button.text = "%s\n\n%s" % [entry["title"], entry["desc"]]
		button.add_theme_font_size_override(&"font_size", 22)
		var id: StringName = entry["id"]
		button.pressed.connect(_on_card_picked.bind(id))
		cards.add_child(button)

	show()
	get_tree().paused = true
	EventBus.game_paused.emit(true)
	if cards.get_child_count() > 0:
		(cards.get_child(0) as Button).grab_focus()


func _on_card_picked(id: StringName) -> void:
	if player != null:
		player.apply_upgrade(id)
	_pending -= 1
	if _pending > 0:
		_show_next()
	else:
		_close()


func _close() -> void:
	hide()
	get_tree().paused = false
	EventBus.game_paused.emit(false)
