extends Control
## 메타 화면 묶음. 게임을 켜면 여기가 먼저 뜬다 (project.godot 의 main_scene).
##
## 화면마다 씬을 갈아끼우지 않고 자식 넷을 켜고 끈다. 갈아끼우면 매번 다시 짓느라
## 스크롤 위치와 포커스가 날아가고, 뒤로 갈 때 상태가 사라진다.

const ARENA_SCENE: String = "res://maps/arena.tscn"

@onready var _main_menu: Control = $MainMenu
@onready var _select: Control = $CharacterSelect
@onready var _shop: Control = $PxShop
@onready var _board: Control = $CommendationBoard
@onready var _options: Control = $OptionsPanel

var _screens: Array[Control] = []


func _ready() -> void:
	_screens = [_main_menu, _select, _shop, _board, _options]
	_main_menu.open_requested.connect(_on_open_requested)
	_select.back_requested.connect(_go_main)
	_select.start_requested.connect(_on_start)
	_shop.back_requested.connect(_go_main)
	_board.back_requested.connect(_go_main)
	_go_main()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed(&"pause_game") and not _main_menu.visible:
		_go_main()
		get_viewport().set_input_as_handled()


func _show(target: Control) -> void:
	for screen: Control in _screens:
		screen.visible = screen == target


func _go_main() -> void:
	_show(_main_menu)
	_main_menu.focus_first()


func _on_open_requested(screen: StringName) -> void:
	match screen:
		&"select":
			_select.reload_selection()
			_show(_select)
		&"shop":
			_show(_shop)
		&"board":
			_show(_board)
		&"options":
			_show(_options)
			_options.show()
		&"quit":
			get_tree().quit()


func _on_start(_character_id: StringName, _map_id: StringName) -> void:
	# 무엇을 고르든 아레나가 SaveSystem 에서 다시 읽는다. 여기서 넘기지 않는 이유는,
	# 씬 전환 사이에 값을 들고 있을 자리가 없어서다 — 저장이 그 자리를 대신한다.
	get_tree().change_scene_to_file(ARENA_SCENE)
