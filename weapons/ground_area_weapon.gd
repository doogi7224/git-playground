extends BaseWeapon
class_name GroundAreaWeapon
## 발밑에 장판을 까는 무기. 수통, 행군화, 급수차.
## reach = 장판 반경, damage = 초당 피해, half_angle_deg 칸을 지속시간으로 쓴다.

## 알파 0.30 으로는 어두운 배경 위에서 파랑 채널이 죽어 연녹으로 읽힌다 --
## 회복/획득 색(#8FE388)과 구분이 안 됐다. 알파를 올려 시안이 시안으로 보이게 한다.
const COLOR_WATER: Color = Color(0.247, 0.878, 0.816, 0.48)

var areas: AreaManager = null


func _fire() -> void:
	if areas == null or player == null:
		return
	areas.spawn(player.global_position, current_reach(), current_damage(),
			maxf(0.5, data.half_angle_deg), COLOR_WATER)
