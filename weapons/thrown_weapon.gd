extends BaseWeapon
class_name ThrownWeapon
## 포물선으로 던져서 터지는 무기. 연막탄, 다연장 발연통.
## reach = 던지는 거리, half_angle_deg 칸을 폭발 장판 지속시간으로 쓴다.

## 연기는 차가운 회색이다.
##
## 원래 (0.60, 0.72, 0.55) 였는데 이건 회복/획득 연녹(#8FE388 = 0.56,0.89,0.53)과
## 사실상 같은 색이다. 화면에서 짬 무더기와 구분이 안 됐다.
## 팔레트에 없는 색을 쓰면 규칙 6 의 색 분담이 통째로 무너진다.
##
## 알파도 0.75 는 너무 진했다 -- 연기 밑에 있는 적이 안 보여서
## "가독성 = 생존" 이 깨진다. 연막은 시야를 가리는 게 아니라 피해를 주는 무기다.
const COLOR_SMOKE: Color = Color(0.72, 0.78, 0.80, 0.42)
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
