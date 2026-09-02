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
	# 메타 화면과 같은 갱지 톤. 옵션만 검은 대화상자로 남아 있으면 확 튄다.
	var panel: PanelContainer = $Center/Panel
	panel.add_theme_stylebox_override(&"panel", MetaUI.paper_box())
	_build()


func _build() -> void:
	_box.add_child(MetaUI.title("설     정", 40))
	_box.add_child(MetaUI.rule())

	for entry: Dictionary in TOGGLES:
		var check := CheckBox.new()
		check.text = tr(String(entry["label"]))
		check.button_pressed = bool(Settings.get(entry["key"]))
		check.add_theme_font_size_override(&"font_size", 24)
		_ink(check)
		var key: StringName = entry["key"]
		check.toggled.connect(func(on: bool) -> void: Settings.set_option(key, on))
		_box.add_child(check)

	_box.add_child(MetaUI.label("화면 흔들림 강도", 24))

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
	_ink(low)
	low.toggled.connect(_on_low_spec)
	_box.add_child(low)

	_box.add_child(MetaUI.rule())
	for entry: Dictionary in VOLUMES:
		_add_volume(entry["key"], String(entry["label"]))

	_box.add_child(MetaUI.rule())
	_add_language()

	_box.add_child(MetaUI.rule())
	var close: Button = MetaUI.button("닫기", 26)
	close.pressed.connect(func() -> void:
		AudioManager.play_sfx(&"ui_click")
		_close())
	_box.add_child(close)


## 갱지 위에서는 글자가 검정이어야 읽힌다. CheckBox 는 기본이 흰 글자다.
##
## ★ font_pressed_color 를 인장색으로 두면 안 된다. CheckBox 에서 "pressed" 는
##   누르는 중이 아니라 **체크된 상태**다. 그래서 켜진 항목이 전부 빨개진다.
##   진홍은 규칙 6 에서 "위험" 전용색이라 더 나쁘다 -- 설정 항목이 경고처럼 보인다.
func _ink(c: Control) -> void:
	c.add_theme_color_override(&"font_color", MetaUI.INK)
	c.add_theme_color_override(&"font_pressed_color", MetaUI.INK)
	c.add_theme_color_override(&"font_focus_color", MetaUI.INK)
	c.add_theme_color_override(&"font_hover_color", MetaUI.STAMP)


func _add_volume(key: StringName, label_text: String) -> void:
	var row := HBoxContainer.new()
	row.add_theme_constant_override(&"separation", 16)
	_box.add_child(row)

	var label: Label = MetaUI.label(label_text, 24)
	label.custom_minimum_size = Vector2(160.0, 0.0)
	row.add_child(label)

	var slider := HSlider.new()
	slider.min_value = 0.0
	slider.max_value = 1.0
	slider.step = 0.05
	slider.value = float(Settings.get(key))
	slider.custom_minimum_size = Vector2(280.0, 28.0)
	row.add_child(slider)

	# 지금 몇인지 숫자로도 보여 준다. 슬라이더만 있으면 0.05 단위가 안 읽힌다.
	var value_label: Label = MetaUI.label("%d%%" % int(round(slider.value * 100.0)), 22)
	value_label.custom_minimum_size = Vector2(60.0, 0.0)
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

	var label: Label = MetaUI.label("언어", 24)
	label.custom_minimum_size = Vector2(160.0, 0.0)
	row.add_child(label)

	var option := OptionButton.new()
	option.add_theme_font_size_override(&"font_size", 22)
	_ink(option)
	# 기본 회색 배경이 갱지 위에서 튄다.
	for state: StringName in [&"normal", &"hover", &"pressed", &"focus", &"disabled"]:
		option.add_theme_stylebox_override(state, MetaUI._button_box(MetaUI.PAPER, MetaUI.INK))
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
	if not event.is_action_pressed(&"pause_game"):
		return
	# 메타 화면 안에서는 부모(MetaRoot)가 Esc 를 처리한다. 여기서 또 잡으면
	# 트리를 멈춘 채로 화면만 사라져 게임이 얼어붙는다.
	# 타입 대신 메서드 유무로 본다 -- 결합을 덜 만든다.
	var parent: Node = get_parent()
	if parent != null and parent.has_method("show_screen_for_options"):
		return
	if visible:
		_close()
	else:
		show()
		get_tree().paused = true
	get_viewport().set_input_as_handled()


func _close() -> void:
	hide()
	get_tree().paused = false


## 이 화면은 트리를 멈춘다. 다른 경로로 사라져도 얼지 않게 떠날 때 푼다.
func _exit_tree() -> void:
	var tree: SceneTree = get_tree()
	if tree != null:
		tree.paused = false
