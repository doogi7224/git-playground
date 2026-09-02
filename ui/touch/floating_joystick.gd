extends Control
class_name FloatingJoystick
## 플로팅 조이스틱. 화면 아무 데나 손가락을 대면 그 자리가 중심이 되고,
## 끌면 그 방향으로 움직인다.
##
## ★ Player 를 건드리지 않는다. AutoPlayer 와 똑같이 move_* 액션을 눌러서
##   Input.get_vector 경로를 그대로 태운다. 그래서 키보드/자동플레이/터치가
##   전부 같은 코드로 흐르고, 기존 테스트도 손댈 필요가 없다.
##
## 손가락이 캐릭터를 가리지 않게 화면 아래쪽 절반에서만 잡는다.
## 위쪽은 UI(일시정지 등) 몫으로 남긴다.

const ACTIONS: Array[StringName] = [&"move_right", &"move_left", &"move_down", &"move_up"]

## 이 반경까지 끌면 최대 속도. 작으면 예민하고 크면 둔하다.
@export var max_radius: float = 160.0
## 이보다 덜 움직이면 입력으로 치지 않는다. 손떨림 방지.
@export var dead_zone: float = 18.0
## 화면 세로에서 이 비율 아래쪽만 조이스틱 영역. 위는 UI 가 쓴다.
@export var active_area_top: float = 0.35

var _touch_index: int = -1
var _origin: Vector2 = Vector2.ZERO
var _current: Vector2 = Vector2.ZERO
var _active: bool = false

## 시각화 색. 손가락 밑이라 진하면 방해된다.
const RING_COLOR: Color = Color(1.0, 1.0, 1.0, 0.22)
const KNOB_COLOR: Color = Color(1.0, 1.0, 1.0, 0.38)


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	# 마우스로도 잡히게 해 두면 PC 에서 그대로 확인할 수 있다
	# (project.godot 의 emulate_touch_from_mouse).
	set_process_unhandled_input(true)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if touch.pressed:
			if _touch_index < 0 and _in_active_area(touch.position):
				_touch_index = touch.index
				_origin = touch.position
				_current = touch.position
				_active = true
				queue_redraw()
		elif touch.index == _touch_index:
			_release()
	elif event is InputEventScreenDrag:
		var drag := event as InputEventScreenDrag
		if drag.index == _touch_index:
			_current = drag.position
			_apply()
			queue_redraw()


func _in_active_area(pos: Vector2) -> bool:
	return pos.y >= size.y * active_area_top


func _apply() -> void:
	var delta: Vector2 = _current - _origin
	if delta.length() < dead_zone:
		_release_actions()
		return
	# max_radius 를 넘으면 1.0 으로 자른다. 더 끈다고 더 빨라지지는 않는다.
	var strength: Vector2 = delta / max_radius
	if strength.length() > 1.0:
		strength = strength.normalized()
	_press(&"move_right", maxf(strength.x, 0.0))
	_press(&"move_left", maxf(-strength.x, 0.0))
	_press(&"move_down", maxf(strength.y, 0.0))
	_press(&"move_up", maxf(-strength.y, 0.0))


func _press(action: StringName, strength: float) -> void:
	if strength > 0.001:
		Input.action_press(action, strength)
	else:
		Input.action_release(action)


func _release_actions() -> void:
	for action: StringName in ACTIONS:
		Input.action_release(action)


func _release() -> void:
	_touch_index = -1
	_active = false
	_release_actions()
	queue_redraw()


## 화면이 사라져도 손가락이 눌린 채로 남으면 안 된다.
## (레벨업 창이 뜨거나 판이 끝날 때)
func _notification(what: int) -> void:
	if what == NOTIFICATION_EXIT_TREE or what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		_release_actions()


func _draw() -> void:
	if not _active:
		return
	var delta: Vector2 = _current - _origin
	if delta.length() > max_radius:
		delta = delta.normalized() * max_radius
	draw_circle(_origin, max_radius, RING_COLOR, false, 4.0)
	draw_circle(_origin + delta, max_radius * 0.34, KNOB_COLOR)


## 지금 잡혀 있는가. 테스트와 튜토리얼이 본다.
func is_active() -> bool:
	return _active
