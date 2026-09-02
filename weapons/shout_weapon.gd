extends BaseWeapon
class_name ShoutWeapon
## 화면 전체를 흔들어 적을 멈춘다. 기상나팔, 국기하강식. 기획서 5.1 #10.
##
## reach = 효과 반경(화면 반대각 정도), half_angle_deg 칸 = 스턴 지속(초).

const COLOR_SHOUT: Color = Color("#FFC94A")
const RING_TIME: float = 0.45

var _ring: float = 0.0


func _ready() -> void:
	super()
	top_level = true
	z_index = 3


func _fire() -> void:
	if enemies == null or player == null:
		return
	var origin: Vector2 = player.global_position
	var reach: float = current_reach()
	var duration: float = maxf(0.2, data.half_angle_deg)

	var stunned: int = enemies.stun_area(origin, reach, duration)
	enemies.knockback_area(origin, reach, data.knockback)
	if data.damage > 0.0:
		var n: int = enemies.query(origin.x, origin.y, reach)
		var cand: PackedInt32Array = enemies.candidates()
		for k in n:
			var i: int = cand[k]
			var r: float = reach + enemies.radius_of(i)
			if origin.distance_squared_to(enemies.position_of(i)) <= r * r:
				enemies.damage(i, current_damage())

	if stunned > 0:
		EventBus.screen_shake_requested.emit(3.0, 0.2)
	_ring = RING_TIME


func _process(delta: float) -> void:
	if player != null:
		global_position = player.global_position
	if _ring > 0.0:
		_ring = maxf(0.0, _ring - delta)
		queue_redraw()


func _draw() -> void:
	if data == null or _ring <= 0.0:
		return
	var t: float = 1.0 - _ring / RING_TIME
	var col: Color = COLOR_SHOUT
	col.a = (1.0 - t) * 0.6
	draw_arc(Vector2.ZERO, current_reach() * t, 0.0, TAU, 48, col, 8.0 * (1.0 - t) + 1.0, true)
