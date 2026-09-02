extends BaseWeapon
class_name TrailWeapon
## 지나온 자리에 장판을 흘린다. 행군화, 완전군장 행군. 기획서 5.1 #6.
##
## cooldown 을 "몇 초마다 한 칸 남기는가"로 쓴다. 가만히 서 있으면 같은 자리에 겹치므로
## 최소 이동 거리를 넘겼을 때만 남긴다 — 안 그러면 제자리에서 무한 장판이 된다.

const COLOR_FOOTPRINT: Color = Color(0.42, 0.36, 0.24, 0.34)
const MIN_STEP: float = 34.0

var areas: AreaManager = null

var _last_drop: Vector2 = Vector2.INF


func _fire() -> void:
	if areas == null or player == null:
		return
	var here: Vector2 = player.global_position
	if _last_drop.is_finite() and here.distance_to(_last_drop) < MIN_STEP:
		return
	_last_drop = here
	areas.spawn(here, current_reach(), current_damage(),
			maxf(0.5, data.half_angle_deg), COLOR_FOOTPRINT)
