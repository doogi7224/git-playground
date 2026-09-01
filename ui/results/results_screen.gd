extends Control
## 전역증(승리) / 전역 연기(패배). 기획서 3.4의 도장 연출은 M2에서.

@onready var title: Label = $Center/Panel/Margin/VBox/Title
@onready var body: Label = $Center/Panel/Margin/VBox/Body
@onready var again: Button = $Center/Panel/Margin/VBox/Again


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	hide()
	EventBus.run_ended.connect(_on_run_ended)
	again.pressed.connect(_on_again)


func _on_run_ended(victory: bool, stats: Dictionary) -> void:
	if victory:
		title.text = "전 역 증"
		body.text = "귀하는 위 기간 성실히 복무하였기에\n이 증서를 수여함.\n\n처치 %d" % int(stats.get("kills", 0))
	else:
		title.text = "전 역 연 기"
		body.text = "D-%d 에서 쓰러졌다.\n\n처치 %d" % [GameState.days_left(), int(stats.get("kills", 0))]
	show()
	get_tree().paused = true
	again.grab_focus()


func _on_again() -> void:
	get_tree().paused = false
	get_tree().reload_current_scene()
