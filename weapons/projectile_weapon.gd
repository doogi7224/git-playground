extends BaseWeapon
class_name ProjectileWeapon
## 가장 가까운 적에게 자동 사격. K-2식 소총, 분대지원화기.
## 여러 발이면 부채꼴로 퍼뜨린다(탄띠 패시브로 발수가 늘어난다).

const COLOR_BULLET: Color = Color("#FFC94A")   ## 기획서 3.2: 플레이어 이펙트는 시안/금색 독점
const SPREAD_DEG: float = 7.0

var projectiles: ProjectileManager = null


func _fire() -> void:
	if enemies == null or player == null or projectiles == null:
		return

	var origin: Vector2 = player.global_position
	var dir: Vector2 = _aim(origin)
	var shots: int = data.projectiles_at(level) + (player.extra_projectiles if player != null else 0)
	var speed: float = maxf(50.0, data.reach_at(level) * 4.0)
	var lifetime: float = data.reach_at(level) / speed
	var hit: Array = roll_hit()
	var dmg: float = hit[0]
	var is_crit: bool = hit[1]
	if is_crit:
		EventBus.hit_stop_requested.emit()
	var pierce: int = int(data.knockback)   # knockback 칸을 관통 횟수로 쓴다(진화형 관통용)

	for s in shots:
		var offset: float = 0.0 if shots == 1 else deg_to_rad(SPREAD_DEG) * (float(s) - float(shots - 1) * 0.5)
		projectiles.fire(origin, dir.rotated(offset) * speed, dmg, 7.0, lifetime, pierce, COLOR_BULLET)


## 사거리 안에서 가장 가까운 적. 없으면 바라보는 방향으로 쏜다.
func _aim(origin: Vector2) -> Vector2:
	var reach: float = current_reach()
	var n: int = enemies.query(origin.x, origin.y, reach)
	var cand: PackedInt32Array = enemies.candidates()
	var best: float = INF
	var best_dir: Vector2 = player.facing
	for k in n:
		var i: int = cand[k]
		var to: Vector2 = enemies.position_of(i) - origin
		var d: float = to.length_squared()
		if d < best and d > 0.001:
			best = d
			best_dir = to.normalized()
	return best_dir
