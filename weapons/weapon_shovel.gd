extends BaseWeapon
class_name WeaponShovel
## 야전삽 — 부채꼴 베기를 앞뒤로 번갈아. 기획서 5.1 #1 "전방 회전 베기".
## 진화: +탄띠 → 굴삭기(전방위 광역). M1에서.
##
## ★ 왜 앞뒤 교대인가 (실측 근거)
##   플레이어(200)가 적(150)보다 빠르니, 곁에 남는 적은 항상 "지나쳐 온 꼬리"다.
##   500프레임 누적 측정: 사거리 안 적의 각도 분포가 150~180도에 72%로 몰렸고,
##   전방 140도 부채꼴에 들어온 건 5.2%뿐이었다. 전방 전용으로 두면 28초에 1마리 잡는다.
##   그래서 한 번은 앞, 한 번은 뒤로 휘두른다. "회전 베기"의 자연스러운 해석이기도 하고,
##   진화형 굴삭기(한 번에 전방위)와 정체성도 겹치지 않는다.

const SWIPE_TIME: float = 0.14
const COLOR_SWIPE: Color = Color("#3FE0D0")   ## 기획서 3.2: 플레이어 이펙트는 시안/금색 독점

@export var reach: float = 150.0
## 110도로 잡았더니 도망치는 동안 적이 전부 등 뒤로 몰려서 한 대도 안 맞았다.
## 140도로 넓혀 좌우까지 걷어낸다. (실측: tests/run_tests.gd 의 아레나 스모크 테스트)
@export var half_angle_deg: float = 70.0

var _swipe_left: float = 0.0
var _swipe_dir: Vector2 = Vector2.RIGHT
var _swing_back: bool = false


func _ready() -> void:
	weapon_id = &"shovel"
	display_name = "야전삽"
	cooldown = 0.8
	base_damage = 10.0
	top_level = true   # 부모(플레이어)와 같이 회전하지 않게


func _fire() -> void:
	if enemies == null or player == null:
		return
	_swipe_dir = -player.facing if _swing_back else player.facing
	_swing_back = not _swing_back
	_swipe_left = SWIPE_TIME

	var origin: Vector2 = player.global_position
	var dmg: float = damage_per_hit()
	var cos_limit: float = cos(deg_to_rad(half_angle_deg))
	var reach_sq: float = reach * reach

	var n: int = enemies.query(origin.x, origin.y, reach)
	var cand: PackedInt32Array = enemies.candidates()
	for k in n:
		var i: int = cand[k]
		var to: Vector2 = enemies.position_of(i) - origin
		var r: float = reach + enemies.radius_of(i)
		if to.length_squared() > r * r:
			continue
		if to.length_squared() > 0.001 and to.normalized().dot(_swipe_dir) < cos_limit:
			continue
		enemies.damage(i, dmg)

	EventBus.screen_shake_requested.emit(1.5, 0.06)


func _process(delta: float) -> void:
	if _swipe_left <= 0.0:
		return
	_swipe_left = maxf(0.0, _swipe_left - delta)
	if player != null:
		global_position = player.global_position
	queue_redraw()   # 0이 된 프레임에 한 번 더 그려서 잔상을 지운다


func _draw() -> void:
	if _swipe_left <= 0.0:
		return
	var t: float = _swipe_left / SWIPE_TIME
	var base_angle: float = _swipe_dir.angle()
	var half: float = deg_to_rad(half_angle_deg)
	var col: Color = COLOR_SWIPE
	col.a = t * 0.85
	draw_arc(Vector2.ZERO, reach * (0.75 + 0.25 * (1.0 - t)), base_angle - half, base_angle + half,
			24, col, 6.0 * t + 1.0, true)
