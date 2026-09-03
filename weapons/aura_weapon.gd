extends BaseWeapon
class_name AuraWeapon
## 플레이어 주변을 상시 훑는 무기. 예초기, 트랙터, 방탄모 오라.
## cooldown 은 "몇 초마다 한 번 훑는가"다.

const COLOR_AURA: Color = Color("#3FE0D0")

var _pulse: float = 0.0


func _fire() -> void:
	if enemies == null or player == null:
		return
	var origin: Vector2 = player.global_position
	var reach: float = current_reach()
	var n: int = enemies.query(origin.x, origin.y, reach)
	var cand: PackedInt32Array = enemies.candidates()
	for k in n:
		var i: int = cand[k]
		var r: float = reach + enemies.radius_of(i)
		if origin.distance_squared_to(enemies.position_of(i)) <= r * r:
			var hit: Array = roll_hit()
			enemies.damage(i, hit[0], hit[1])
	_pulse = 1.0


func _process(delta: float) -> void:
	if player != null:
		global_position = player.global_position
	if _pulse > 0.0:
		_pulse = maxf(0.0, _pulse - delta * 4.0)
	queue_redraw()


func _ready() -> void:
	super()
	top_level = true
	z_index = 3


## 상시 범위를 알려 주는 얇은 링 + 훑을 때마다 퍼져 나가는 펄스 링.
##
## 예전에는 같은 자리의 링 하나가 굵어졌다 얇아지기만 했다 -- 사거리 표시로는
## 읽히는데 "지금 훑었다" 가 안 보였다. 퍼져 나가는 링이 그 신호다.
func _draw() -> void:
	if data == null:
		return
	var reach: float = current_reach()

	# 상시 링: 여기까지가 사거리다. 항상 옅게.
	var base: Color = COLOR_AURA
	base.a = 0.13
	draw_arc(Vector2.ZERO, reach, 0.0, TAU, 48, base, 2.0, true)

	if _pulse <= 0.0:
		return
	# 펄스: 안에서 밖으로 퍼지며 사라진다
	var p: float = 1.0 - _pulse                     # 0 → 1
	var col: Color = COLOR_AURA
	col.a = 0.55 * _pulse
	draw_arc(Vector2.ZERO, reach * (0.35 + 0.65 * p), 0.0, TAU, 48, col, 2.0 + 6.0 * _pulse, true)
