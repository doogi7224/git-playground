extends BaseWeapon
class_name GuardWeapon
## 방어 오라 + 근접 반사. 방탄모, 완전무장. 기획서 5.1 #9.
##
## 받는 피해를 줄이는 건 Player 가 무기 목록을 훑어서 계산한다(damage_reduction).
## 여기서는 주기적으로 붙어 있는 적을 밀어내고 반사 피해를 준다.

const COLOR_GUARD: Color = Color("#FFC94A")

var _pulse: float = 0.0


func _ready() -> void:
	super()
	top_level = true
	z_index = 3


func _fire() -> void:
	if enemies == null or player == null:
		return
	var origin: Vector2 = player.global_position
	var reach: float = current_reach()

	var n: int = enemies.query(origin.x, origin.y, reach)
	var cand: PackedInt32Array = enemies.candidates()
	var hits: int = 0
	for k in n:
		var i: int = cand[k]
		var r: float = reach + enemies.radius_of(i)
		if origin.distance_squared_to(enemies.position_of(i)) <= r * r:
			var hit: Array = roll_hit()
			enemies.damage(i, hit[0], hit[1])
			hits += 1
	if hits > 0:
		enemies.knockback_area(origin, reach, data.knockback)
	# 완전무장: 반사할 때마다 짧은 무적 프레임
	if data.invulnerability > 0.0:
		player.grant_invulnerability(data.invulnerability)
	_pulse = 1.0


func _process(delta: float) -> void:
	if player != null:
		global_position = player.global_position
	if _pulse > 0.0:
		_pulse = maxf(0.0, _pulse - delta * 3.0)
		queue_redraw()


func _draw() -> void:
	if data == null or _pulse <= 0.0:
		return
	var col: Color = COLOR_GUARD
	col.a = 0.30 * _pulse
	draw_arc(Vector2.ZERO, current_reach(), 0.0, TAU, 40, col, 3.0 + 5.0 * _pulse, true)
