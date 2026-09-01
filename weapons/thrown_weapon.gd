extends BaseWeapon
class_name ThrownWeapon
## 포물선으로 던져서 터지는 무기. 연막탄, 다연장 발연통.
## reach = 던지는 거리, half_angle_deg 칸을 폭발 장판 지속시간으로 쓴다.

const COLOR_SMOKE: Color = Color(0.60, 0.72, 0.55, 0.75)
const FLIGHT_TIME: float = 0.55
const AREA_RADIUS_RATIO: float = 0.55

var projectiles: ProjectileManager = null


func _fire() -> void:
	if projectiles == null or player == null or enemies == null:
		return
	var origin: Vector2 = player.global_position
	var reach: float = current_reach()
	var shots: int = data.projectiles_at(level) + (player.extra_projectiles if player != null else 0)
	var dmg: float = current_damage()
	var area_radius: float = reach * AREA_RADIUS_RATIO

	for s in shots:
		var target: Vector2 = _pick_target(origin, reach, s, shots)
		projectiles.lob(origin, target, FLIGHT_TIME, dmg, 9.0, COLOR_SMOKE,
				area_radius, dmg * 0.6, maxf(0.5, data.half_angle_deg))


## 적이 많이 몰린 쪽을 대충 노린다. 후보를 훑어 평균 위치를 쓰되, 없으면 아무 데나 던진다.
func _pick_target(origin: Vector2, reach: float, index: int, total: int) -> Vector2:
	var n: int = enemies.query(origin.x, origin.y, reach)
	if n > 0:
		var cand: PackedInt32Array = enemies.candidates()
		var pick: int = cand[(index * 7 + randi()) % n]
		var pos: Vector2 = enemies.position_of(pick)
		if origin.distance_to(pos) <= reach:
			return pos
	var angle: float = TAU * float(index) / float(maxi(1, total)) + randf() * 0.6
	return origin + Vector2(cos(angle), sin(angle)) * reach * 0.7
