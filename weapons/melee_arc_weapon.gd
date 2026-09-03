extends BaseWeapon
class_name MeleeArcWeapon
## 부채꼴로 베는 무기 전부가 이 스크립트를 쓴다. 야전삽, 예초기 등.
## 정체성은 전부 WeaponData(.tres)에 있다 — 새 근접 무기 추가는 .tres 하나면 끝난다.
##
## ★ alternate_direction (앞뒤 교대)
##   플레이어가 적보다 빠르면 곁에 남는 적은 항상 "지나쳐 온 꼬리"다.
##   M0에서 500프레임 누적 측정: 사거리 안 적의 72%가 정면 기준 150~180도(등 뒤),
##   전방 140도 부채꼴에 들어온 건 5.2%뿐이었다. 전방 전용이면 28초에 1마리 잡는다.

const SWIPE_TIME: float = 0.14
const COLOR_SWIPE: Color = Color("#3FE0D0")   ## 기획서 3.2: 플레이어 이펙트는 시안/금색 독점
const COLOR_EDGE: Color = Color("#EAFFFB")    ## 날 끝. 시안보다 밝아야 "베였다" 로 읽힌다

## 휘두르는 궤적. 예전에는 부채꼴 전체에 draw_arc 로 얇은 선 하나를 긋고 알파만
## 줄였다 -- 시간이 지나도 **같은 자리에서 옅어지기만 해서** 휘두르는 것으로 안 보였다.
## 지금은 띠가 부채꼴을 실제로 훑고 지나간다.
const BAND_SPAN: float = 0.55      ## 띠가 덮는 부채꼴 비율. 1.0 이면 통째로 = 예전과 같다
const SWEEP_STEPS: int = 14        ## 띠를 몇 조각으로 나눠 그리나. 많을수록 곡선이 곱다
const THICKNESS: float = 0.30      ## 반지름 대비 띠 두께

var _swipe_left: float = 0.0
var _swipe_dir: Vector2 = Vector2.RIGHT
var _swing_back: bool = false


func _ready() -> void:
	super()
	top_level = true   # 플레이어를 따라가되 회전은 따라가지 않는다


func _fire() -> void:
	if enemies == null or player == null:
		return

	player.on_attack()
	var facing: Vector2 = player.facing
	_swipe_dir = -facing if (_swing_back and data.alternate_direction) else facing
	_swing_back = not _swing_back
	_swipe_left = SWIPE_TIME

	var origin: Vector2 = player.global_position
	var reach: float = current_reach()
	var cos_limit: float = cos(deg_to_rad(data.half_angle_deg))

	var n: int = enemies.query(origin.x, origin.y, reach)
	var cand: PackedInt32Array = enemies.candidates()
	for k in n:
		var i: int = cand[k]
		var to: Vector2 = enemies.position_of(i) - origin
		var r: float = reach + enemies.radius_of(i)
		var len_sq: float = to.length_squared()
		if len_sq > r * r:
			continue
		if len_sq > 0.001 and to.normalized().dot(_swipe_dir) < cos_limit:
			continue
		var hit: Array = roll_hit()
		enemies.damage(i, hit[0], hit[1])
		if hit[1]:
			EventBus.hit_stop_requested.emit()

	EventBus.screen_shake_requested.emit(1.5, 0.06)


func _process(delta: float) -> void:
	if _swipe_left <= 0.0:
		return
	_swipe_left = maxf(0.0, _swipe_left - delta)
	if player != null:
		global_position = player.global_position
	queue_redraw()   # 0이 된 프레임에 한 번 더 그려서 잔상을 지운다


## 부채꼴을 훑고 지나가는 띠. 앞쪽(날 끝)이 밝고 뒤로 갈수록 사라진다.
##
## draw_polygon 은 정점마다 색을 받는다. 삼각형 띠 하나를 폴리곤으로 만들고
## 정점 알파로 꼬리를 흐리면, 파티클 없이도 휘두른 궤적이 남는다.
func _draw() -> void:
	if _swipe_left <= 0.0 or data == null:
		return
	var t: float = _swipe_left / SWIPE_TIME          # 1 → 0
	var p: float = 1.0 - t                            # 0 → 1, 휘두른 진행도
	var half: float = deg_to_rad(data.half_angle_deg)
	var base_angle: float = _swipe_dir.angle()
	# 되돌아 베는 타이밍에는 반대로 훑는다 -- 방향이 늘 같으면 기계적으로 보인다.
	var dir: float = -1.0 if _swing_back else 1.0
	var span: float = half * 2.0

	# 띠의 앞머리가 부채꼴을 가로지른다. 뒤꼬리는 BAND_SPAN 만큼 뒤에 붙어 온다.
	var lead: float = lerpf(-half, half, p) * dir
	var tail: float = lead - span * BAND_SPAN * dir

	var radius: float = current_reach()
	var inner: float = radius * (1.0 - THICKNESS)

	var points := PackedVector2Array()
	var colors := PackedColorArray()
	points.resize((SWEEP_STEPS + 1) * 2)
	colors.resize((SWEEP_STEPS + 1) * 2)

	for i in SWEEP_STEPS + 1:
		var k: float = float(i) / float(SWEEP_STEPS)   # 0 = 꼬리, 1 = 날 끝
		var a: float = base_angle + lerpf(tail, lead, k)
		var v := Vector2(cos(a), sin(a))
		# ★ 초승달이므로 **양 끝이 다 뾰족**해야 한다. 날 끝만 뾰족하게 했더니
		#   반대쪽이 네모나게 잘려서 미완성으로 보였다. 가운데가 가장 두껍다.
		var fat: float = pow(sin(PI * k), 0.6)
		var r_in: float = lerpf(radius, inner, fat)

		var col: Color = COLOR_SWIPE.lerp(COLOR_EDGE, k * k)
		# 꼬리는 사라지고, 스윙이 끝나갈수록 전체가 옅어진다
		col.a = pow(k, 1.35) * (0.42 + 0.58 * t)

		points[i] = v * radius
		points[SWEEP_STEPS * 2 + 1 - i] = v * r_in
		colors[i] = col
		colors[SWEEP_STEPS * 2 + 1 - i] = Color(col.r, col.g, col.b, col.a * 0.15)

	draw_polygon(points, colors)

	# 날 끝의 밝은 점. 여기가 "지금 베고 있는 자리" 다.
	# 크면 마법 구슬처럼 보인다 -- 궤적의 끝을 찍는 정도로만 둔다.
	var tip := Vector2(cos(base_angle + lead), sin(base_angle + lead)) * radius * 0.97
	var tip_col: Color = COLOR_EDGE
	tip_col.a = t * 0.65
	draw_circle(tip, radius * 0.028 * (0.5 + t), tip_col)
