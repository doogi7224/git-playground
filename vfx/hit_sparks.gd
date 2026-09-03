extends MultiMeshInstance2D
class_name HitSparks
## 타격 스파크. 적이 맞은 자리에서 파편이 사방으로 튄다.
##
## 여기까지 오기 전에는 타격 피드백이 **적의 흰 플래시 2프레임뿐**이었다.
## 무기 이펙트가 전부 단색 도형이라 "때렸다" 가 그림으로 안 받쳐졌다.
##
## 규칙 1·3 그대로다 — 개별 Node 도 GPUParticles 도 안 쓴다. 3,000마리가
## 서로 맞고 있으면 한 프레임에 수백 개가 튄다. SoA 배열 + MultiMesh, 드로우콜 1개.
##
## 크리티컬은 금색, 평타는 시안 (기획서 3.2 — 둘 다 플레이어 이펙트 독점색).

const BUFFER_STRIDE: int = 16
## 동시 상한. 데미지 넘버(120개)와 같은 이유로 못박는다 -- 몰릴 때 끝없이 늘면
## 화면이 하얗게 덮이고 버퍼도 커진다. 넘치면 오래된 것부터 밀어낸다.
const MAX_SPARKS: int = 240
## 한 방에 몇 조각. 크리티컬은 두 배.
const PER_HIT: int = 3
const PER_CRIT: int = 6

const LIFETIME: float = 0.22
const SPEED_MIN: float = 210.0
const SPEED_MAX: float = 430.0
const DRAG: float = 7.5
const LENGTH: float = 26.0      ## 속도 대비 늘어나는 길이 계수
const WIDTH: float = 7.0

const COLOR_HIT: Color = Color("#3FE0D0")
const COLOR_CRIT: Color = Color("#FFC94A")

var _px: PackedFloat32Array = PackedFloat32Array()
var _py: PackedFloat32Array = PackedFloat32Array()
var _vx: PackedFloat32Array = PackedFloat32Array()
var _vy: PackedFloat32Array = PackedFloat32Array()
var _life: PackedFloat32Array = PackedFloat32Array()
var _crit: PackedByteArray = PackedByteArray()
var _count: int = 0
var _buffer: PackedFloat32Array = PackedFloat32Array()


func _ready() -> void:
	z_index = 4
	_px.resize(MAX_SPARKS)
	_py.resize(MAX_SPARKS)
	_vx.resize(MAX_SPARKS)
	_vy.resize(MAX_SPARKS)
	_life.resize(MAX_SPARKS)
	_crit.resize(MAX_SPARKS)
	_buffer.resize(MAX_SPARKS * BUFFER_STRIDE)

	var quad := QuadMesh.new()
	quad.size = Vector2.ONE
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_2D
	mm.use_colors = true
	mm.use_custom_data = true
	mm.mesh = quad
	mm.instance_count = MAX_SPARKS
	mm.visible_instance_count = 0
	multimesh = mm
	material = load("res://vfx/shaders/spark_material.tres")

	EventBus.enemy_damaged.connect(_on_enemy_damaged)


func get_count() -> int:
	return _count


func clear() -> void:
	_count = 0
	if multimesh != null:
		multimesh.visible_instance_count = 0


## 데미지 넘버와 같은 스위치를 쓴다 -- 저사양에서 둘 다 꺼진다.
func _on_enemy_damaged(pos: Vector2, _amount: float, is_crit: bool) -> void:
	if not Settings.damage_numbers:
		return
	burst(pos, is_crit)


func burst(pos: Vector2, is_crit: bool) -> void:
	var n: int = PER_CRIT if is_crit else PER_HIT
	for _k in n:
		if _count >= MAX_SPARKS:
			_swap_remove(0)
		var i: int = _count
		var a: float = randf() * TAU
		var speed: float = randf_range(SPEED_MIN, SPEED_MAX) * (1.35 if is_crit else 1.0)
		_px[i] = pos.x
		_py[i] = pos.y
		_vx[i] = cos(a) * speed
		_vy[i] = sin(a) * speed
		_life[i] = LIFETIME
		_crit[i] = 1 if is_crit else 0
		_count += 1


func _physics_process(delta: float) -> void:
	var i: int = 0
	while i < _count:
		_life[i] -= delta
		if _life[i] <= 0.0:
			_swap_remove(i)
			continue
		# 공기 저항. 튀어나가다 멈추는 편이 등속으로 날아가는 것보다 파편 같다.
		var k: float = maxf(0.0, 1.0 - DRAG * delta)
		_vx[i] *= k
		_vy[i] *= k
		_px[i] += _vx[i] * delta
		_py[i] += _vy[i] * delta
		i += 1


func _process(_delta: float) -> void:
	_update_buffer()


func _swap_remove(i: int) -> void:
	var last: int = _count - 1
	if i != last:
		_px[i] = _px[last]
		_py[i] = _py[last]
		_vx[i] = _vx[last]
		_vy[i] = _vy[last]
		_life[i] = _life[last]
		_crit[i] = _crit[last]
	_count = last


## 쿼드를 속도 방향으로 회전시켜 늘린다. 셰이더는 UV.x 를 "머리에서 꼬리" 로만 보면 된다.
func _update_buffer() -> void:
	if multimesh == null:
		return
	var buf: PackedFloat32Array = _buffer
	_buffer = PackedFloat32Array()

	for i in _count:
		var vx: float = _vx[i]
		var vy: float = _vy[i]
		var speed: float = sqrt(vx * vx + vy * vy)
		var dx: float = 1.0
		var dy: float = 0.0
		if speed > 0.001:
			dx = vx / speed
			dy = vy / speed
		var length: float = maxf(10.0, speed / SPEED_MAX * LENGTH * 2.0)
		var t: float = clampf(_life[i] / LIFETIME, 0.0, 1.0)
		var c: Color = COLOR_CRIT if _crit[i] == 1 else COLOR_HIT

		# [ dx*L  -dy*W  px ]
		# [ dy*L   dx*W  py ]
		var b: int = i * BUFFER_STRIDE
		buf[b + 0] = dx * length
		buf[b + 1] = -dy * WIDTH
		buf[b + 2] = 0.0
		buf[b + 3] = _px[i]
		buf[b + 4] = dy * length
		buf[b + 5] = dx * WIDTH
		buf[b + 6] = 0.0
		buf[b + 7] = _py[i]
		buf[b + 8] = c.r
		buf[b + 9] = c.g
		buf[b + 10] = c.b
		buf[b + 11] = 1.0
		buf[b + 12] = t
		buf[b + 13] = 0.0
		buf[b + 14] = 0.0
		buf[b + 15] = 0.0

	multimesh.buffer = buf
	multimesh.visible_instance_count = _count
	_buffer = buf
