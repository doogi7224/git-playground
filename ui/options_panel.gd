extends Control
## 그래픽/접근성 옵션. Esc 로 연다. 기획서 프롬프트 6 — "전부 설정에서 on/off. 저사양 프리셋도."
## 제대로 된 옵션 화면은 M5. 지금은 켜고 끄는 게 확인되는 최소한만 있다.

const TOGGLES: Array = [
	{"key": &"glow", "label": "글로우"},
	{"key": &"vignette", "label": "비네트"},
	{"key": &"chromatic_aberration", "label": "색수차"},
	{"key": &"damage_numbers", "label": "데미지 넘버"},
	{"key": &"hit_stop", "label": "히트스톱"},
	{"key": &"lighting", "label": "2D 라이팅"},
]

@onready var _box: VBoxContainer = $Center/Panel/Margin/VBox


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	hide()
	_build()


func _build() -> void:
	for entry: Dictionary in TOGGLES:
		var check := CheckBox.new()
		check.text = String(entry["label"])
		check.button_pressed = bool(Settings.get(entry["key"]))
		check.add_theme_font_size_override(&"font_size", 24)
		var key: StringName = entry["key"]
		check.toggled.connect(func(on: bool) -> void: Settings.set_option(key, on))
		_box.add_child(check)

	var shake_label := Label.new()
	shake_label.text = "화면 흔들림 강도"
	shake_label.add_theme_font_size_override(&"font_size", 24)
	_box.add_child(shake_label)

	var slider := HSlider.new()
	slider.min_value = 0.0
	slider.max_value = 1.5
	slider.step = 0.05
	slider.value = Settings.screen_shake
	slider.custom_minimum_size = Vector2(360, 28)
	slider.value_changed.connect(func(v: float) -> void: Settings.set_option(&"screen_shake", v))
	_box.add_child(slider)

	var low := CheckBox.new()
	low.text = "저사양 프리셋"
	low.button_pressed = Settings.low_spec
	low.add_theme_font_size_override(&"font_size", 24)
	low.toggled.connect(_on_low_spec)
	_box.add_child(low)


func _on_low_spec(on: bool) -> void:
	Settings.apply_low_spec(on)
	# 프리셋이 다른 값들을 한꺼번에 바꾸므로 체크박스를 다시 그린다
	for child: Node in _box.get_children():
		child.queue_free()
	await get_tree().process_frame
	_build()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed(&"pause_game"):
		visible = not visible
		get_tree().paused = visible
		get_viewport().set_input_as_handled()
