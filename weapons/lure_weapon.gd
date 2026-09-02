extends BaseWeapon
class_name LureWeapon
## 뒤에 흘려서 적을 끌어당기고 갉는다. 짬통, 잔반차. 기획서 5.1 #7.
##
## 장판 자체는 AreaManager 가 굴리고, 끌어당기는 힘만 여기서 매 프레임 준다.
## EnemyManager.knockback_area 에 **음수 힘**을 주면 안쪽으로 빨려 들어간다.

const COLOR_SLOP: Color = Color(0.44, 0.38, 0.22, 0.40)
const DROP_BEHIND: float = 46.0

var areas: AreaManager = null

var _spot: Vector2 = Vector2.ZERO
var _left: float = 0.0


func _fire() -> void:
	if areas == null or player == null:
		return
	# 진행 방향 반대편에 흘린다 — 뒤따라오는 무리를 붙잡아 두는 게 목적이다
	_spot = player.global_position - player.facing * DROP_BEHIND
	_left = maxf(0.5, data.half_angle_deg)
	areas.spawn(_spot, current_reach(), current_damage(), _left, COLOR_SLOP)


func _physics_process(delta: float) -> void:
	super(delta)
	if _left <= 0.0 or enemies == null or data == null:
		return
	_left -= delta
	if data.pull_force > 0.0:
		# 음수 = 안쪽으로 흡인
		enemies.knockback_area(_spot, current_reach(), -data.pull_force * delta)
