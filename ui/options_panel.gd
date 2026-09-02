extends Control
## 그래픽/오디오/접근성/언어 옵션. Esc 로 연다.
## 기획서 프롬프트 6 — "전부 설정에서 on/off. 저사양 프리셋도."

const TOGGLES: Array = [
	{"key": &"glow", "label": "글로우"},
	{"key": &"vignette", "label": "비네트"},
	{"key": &"chromatic_aberration", "label": "색수차"},
	{"key": &"damage_numbers", "label": "데미지 넘버"},
	{"key": &"hit_stop", "label": "히트스톱"},
	{"key": &"lighting", "label": "2D 라이팅"},
]

## 볼륨 3종. Settings 의 필드 이름과 붙여 둔다.
const VOLUMES: Array = [
	{"key": &"master_volume", "label": "전체 음량"},
	{"key": &"bgm_volume", "label": "배경음"},
	{"key": &"sfx_volume", "label": "효과음"},
]

@onready var _box: VBoxContainer = $Center/Panel/Margin/VBox


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	hide()
	_build()


func _build() -> void:
	for entry: Dictionary in TOGGLES:
		var check := CheckBox.new()
		check.text = tr(String(entry["label"]))
		check.button_pressed = bool(Settings.get(entry["key"]))
		check.add_theme_font_size_override(&"font_size", 24)
		var key: StringName = entry["key"]
		check.toggled.connect(func(on: bool) -> void: Settings.set_option(key, on))
		_box.add_child(check)

	var shake_label := Label.new()
	shake_label.text = tr("화면 흔들림 강도")
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
	low.text = tr("저사양 프리셋")
	low.button_pressed = Settings.low_spec
	low.add_theme_font_size_override(&"font_size", 24)
	low.toggled.connect(_on_low_spec)
	_box.add_child(low)

	_box.add_child(_rule())
	for entry: Dictionary in VOLUMES:
		_add_volume(entry["key"], String(entry["label"]))

	_box.add_child(_rule())
	_add_language()


func _rule() -> Control:
	var line := ColorRect.new()
	line.color = Color(1.0, 1.0, 1.0, 0.18)
	line.custom_minimum_size = Vector2(0.0, 2.0)
	return line


func _add_volume(key: StringName, label_text: String) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override(&"separation", 16)
	_box.add_child(row)

	var label := Label.new()
	label.text = tr(label_text)
	label.custom_minimum_size = Vector2(160.0, 0.0)
	label.add_theme_font_size_override(&"font_size", 24)
	row.add_child(label)

	var slider := HSlider.new()
	slider.min_value = 0.0
	slider.max_value = 1.0
	slider.step = 0.05
	slider.value = float(Settings.get(key))
	slider.custom_minimum_size = Vector2(280.0, 28.0)
	row.add_child(slider)

	# 지금 몇인지 숫자로도 보여 준다. 슬라이더만 있으면 0.05 단위가 안 읽힌다.
	var value_label := Label.new()
	value_label.text = "%d%%" % int(round(slider.value * 100.0))
	value_label.custom_minimum_size = Vector2(60.0, 0.0)
	value_label.add_theme_font_size_override(&"font_size", 22)
	row.add_child(value_label)

	slider.value_changed.connect(func(v: float) -> void:
		Settings.set_option(key, v)
		value_label.text = "%d%%" % int(round(v * 100.0))
		# 볼륨은 귀로 확인해야 한다. 슬라이더를 놓을 때마다 한 번씩 들려준다.
		AudioManager.play_sfx(&"ui_move"))


func _add_language() -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override(&"separation", 16)
	_box.add_child(row)

	var label := Label.new()
	label.text = tr("언어")
	label.custom_minimum_size = Vector2(160.0, 0.0)
	label.add_theme_font_size_override(&"font_size", 24)
	row.add_child(label)

	var option := OptionButton.new()
	option.add_theme_font_size_override(&"font_size", 22)
	for i in Settings.LOCALES.size():
		var code: String = Settings.LOCALES[i]
		# 언어 이름은 그 언어로 적는다. 번역하지 않는다 --
		# 한국어만 읽는 사람이 영어 화면에서 "한국어" 를 찾을 수 있어야 한다.
		option.add_item(Settings.locale_name(code), i)
		if code == Settings.locale:
			option.select(i)
	option.item_selected.connect(func(idx: int) -> void:
		Settings.set_locale(Settings.LOCALES[idx])
		_rebuild())
	row.add_child(option)


func _on_low_spec(on: bool) -> void:
	Settings.apply_low_spec(on)
	# 프리셋이 다른 값들을 한꺼번에 바꾸므로 전부 다시 그린다
	_rebuild()


## 화면을 다시 짓는다. 언어를 바꾸면 모든 글자가 바뀌어야 하고,
## 저사양 프리셋은 체크박스 여러 개를 한꺼번에 움직인다.
## queue_free 만 하면 이번 프레임에 자식이 남아 있어서 두 벌이 겹쳐 그려진다.
func _rebuild() -> void:
	for child: Node in _box.get_children():
		_box.remove_child(child)
		child.queue_free()
	_build()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed(&"pause_game"):
		visible = not visible
		get_tree().paused = visible
		get_viewport().set_input_as_handled()
