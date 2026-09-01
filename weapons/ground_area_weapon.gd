extends BaseWeapon
class_name GroundAreaWeapon
## 발밑에 장판을 까는 무기. 수통, 행군화, 급수차.
## reach = 장판 반경, damage = 초당 피해, half_angle_deg 칸을 지속시간으로 쓴다.

const COLOR_WATER: Color = Color(0.247, 0.878, 0.816, 0.30)

var areas: AreaManager = null


func _fire() -> void:
	if areas == null or player == null:
		return
	areas.spawn(player.global_position, current_reach(), current_damage(),
			maxf(0.5, data.half_angle_deg), COLOR_WATER)
