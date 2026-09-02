extends BaseWeapon
class_name MeleeArcWeapon
## 부채꼴로 베는 무기 전부가 이 스크립트를 쓴다. 야전삽, 예초기 등.
## 정체성은 전부 WeaponData(.tres)에 있다 — 새 근접 무기 추가는 .tres 하나면 끝난다.
##
## ★ alternate_direction (앞뒤 교대)
##   플레이어가 적보다 빠르면 곁에 남는 적은 항상 "지나쳐 온 꼬리"다.
##   M0에서 500프레임 누적 측정: 사거리 안 적의 72%가 정면 기준 150~180도(등 뒤),
##   전방 140도 부채꼴에 들어온 건 5.2%뿐이었다. 전방 전용이면 28초에 1마리 잡는다.

const SWIPE_TIME: float = 0.14
const COLOR_SWIPE: Color = Color("#3FE0D0")   ## 기획서 3.2: 플레이어 이펙트는 시안/금색 독점

var _swipe_left: float = 0.0
var _swipe_dir: Vector2 = Vector2.RIGHT
var _swing_back: bool = false


func _ready() -> void:
	super()
	top_level = true   # 플레이어를 따라가되 회전은 따라가지 않는다


func _fire() -> void:
	if enemies == null or player == null:
		return

	player.on_attack()
	var facing: Vector2 = player.facing
	_swipe_dir = -facing if (_swing_back and data.alternate_direction) else facing
	_swing_back = not _swing_back
	_swipe_left = SWIPE_TIME

	var origin: Vector2 = player.global_position
	var reach: float = current_reach()
	var cos_limit: float = cos(deg_to_rad(data.half_angle_deg))

	var n: int = enemies.query(origin.x, origin.y, reach)
	var cand: PackedInt32Array = enemies.candidates()
	for k in n:
		var i: int = cand[k]
		var to: Vector2 = enemies.position_of(i) - origin
		var r: float = reach + enemies.radius_of(i)
		var len_sq: float = to.length_squared()
		if len_sq > r * r:
			continue
		if len_sq > 0.001 and to.normalized().dot(_swipe_dir) < cos_limit:
			continue
		var hit: Array = roll_hit()
		enemies.damage(i, hit[0], hit[1])
		if hit[1]:
			EventBus.hit_stop_requested.emit()

	EventBus.screen_shake_requested.emit(1.5, 0.06)


func _process(delta: float) -> void:
	if _swipe_left <= 0.0:
		return
	_swipe_left = maxf(0.0, _swipe_left - delta)
	if player != null:
		global_position = player.global_position
	queue_redraw()   # 0이 된 프레임에 한 번 더 그려서 잔상을 지운다


func _draw() -> void:
	if _swipe_left <= 0.0 or data == null:
		return
	var t: float = _swipe_left / SWIPE_TIME
	var base_angle: float = _swipe_dir.angle()
	var half: float = deg_to_rad(data.half_angle_deg)
	var col: Color = COLOR_SWIPE
	col.a = t * 0.85
	var radius: float = current_reach() * (0.75 + 0.25 * (1.0 - t))
	draw_arc(Vector2.ZERO, radius, base_angle - half, base_angle + half, 24, col, 6.0 * t + 1.0, true)
