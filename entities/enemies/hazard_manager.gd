extends Node2D
class_name HazardManager
## 적이 만드는 위험물 — 탄막, 장판, 충격파. **플레이어를 아프게 하는 쪽**이다.
## (ProjectileManager/AreaManager 는 반대로 적을 아프게 한다.)
##
## 적과 같은 SoA + MultiMesh. 개별 Node 를 만들지 않는다. (CLAUDE.md 규칙 1)
## 색은 전부 진홍 계열이어야 한다 — 기획서 3.2: "이 색 = 무조건 피해야 함".

const BUFFER_STRIDE: int = 16
const COLOR_DANGER: Color = Color("#C8102E")

var _px: PackedFloat32Array = PackedFloat32Array()
var _py: PackedFloat32Array = PackedFloat32Array()
var _vx: PackedFloat32Array = PackedFloat32Array()
var _vy: PackedFloat32Array = PackedFloat32Array()
var _radius: PackedFloat32Array = PackedFloat32Array()
var _grow: PackedFloat32Array = PackedFloat32Array()     ## 초당 반경 증가 (충격파)
var _dps: PackedFloat32Array = PackedFloat32Array()
var _life: PackedFloat32Array = PackedFloat32Array()
var _slow: PackedFloat32Array = PackedFloat32Array()     ## 0이면 둔화 없음
var _alpha: PackedFloat32Array = PackedFloat32Array()
var _follow: PackedByteArray = PackedByteArray()         ## 1이면 주인을 따라다닌다
var _owner_x: float = 0.0
var _owner_y: float = 0.0

var _count: int = 0
var _capacity: int = 0

var player: Player = null
var _renderer: MultiMeshInstance2D = null
var _buffer: PackedFloat32Array = PackedFloat32Array()


func _ready() -> void:
	z_index = 5
	if _capacity == 0:
		set_capacity(512)


func set_capacity(p_capacity: int) -> void:
	_capacity = p_capacity
	_px.resize(p_capacity); _py.resize(p_capacity); _vx.resize(p_capacity); _vy.resize(p_capacity)
	_radius.resize(p_capacity); _grow.resize(p_capacity); _dps.resize(p_capacity)
	_life.resize(p_capacity); _slow.resize(p_capacity); _alpha.resize(p_capacity)
	_follow.resize(p_capacity)
	_buffer.resize(p_capacity * BUFFER_STRIDE)
	_ensure_renderer()
	_renderer.multimesh.instance_count = p_capacity
	_renderer.multimesh.visible_instance_count = 0


func get_count() -> int:
	return _count


## 날아가는 탄막 한 발.
func spawn_bullet(pos: Vector2, velocity: Vector2, radius: float, dps: float,
		lifetime: float) -> void:
	_spawn(pos, velocity, radius, 0.0, dps, lifetime, 0.0, 0.9, false)


## 그 자리에 남는 장판. slow < 1 이면 플레이어를 느리게 만든다.
func spawn_field(pos: Vector2, radius: float, dps: float, lifetime: float,
		slow: float = 0.0, follow_owner: bool = false) -> void:
	_spawn(pos, Vector2.ZERO, radius, 0.0, dps, lifetime, slow, 0.30, follow_owner)


## 퍼져나가는 충격파. PT 카운트 같은 것.
func spawn_shockwave(pos: Vector2, radius: float, grow: float, dps: float,
		lifetime: float) -> void:
	_spawn(pos, Vector2.ZERO, radius, grow, dps, lifetime, 0.0, 0.45, false)


func set_owner_position(pos: Vector2) -> void:
	_owner_x = pos.x
	_owner_y = pos.y


func clear() -> void:
	_count = 0


func _spawn(pos: Vector2, velocity: Vector2, radius: float, grow: float, dps: float,
		lifetime: float, slow: float, alpha: float, follow_owner: bool) -> void:
	if _count >= _capacity:
		_swap_remove(0)
	var i: int = _count
	_px[i] = pos.x
	_py[i] = pos.y
	_vx[i] = velocity.x
	_vy[i] = velocity.y
	_radius[i] = radius
	_grow[i] = grow
	_dps[i] = dps
	_life[i] = lifetime
	_slow[i] = slow
	_alpha[i] = alpha
	_follow[i] = 1 if follow_owner else 0
	_count += 1


func _physics_process(delta: float) -> void:
	if GameState.phase != GameState.Phase.PLAYING:
		return
	var worst_dps: float = 0.0
	var worst_slow: float = 1.0
	var target: Vector2 = player.global_position if player != null else Vector2.ZERO

	var i: int = 0
	while i < _count:
		_life[i] -= delta
		if _life[i] <= 0.0:
			_swap_remove(i)
			continue
		if _follow[i] == 1:
			_px[i] = _owner_x
			_py[i] = _owner_y
		else:
			_px[i] += _vx[i] * delta
			_py[i] += _vy[i] * delta
		_radius[i] += _grow[i] * delta

		if player != null:
			var r: float = _radius[i] + player.body_radius
			if target.distance_squared_to(Vector2(_px[i], _py[i])) <= r * r:
				worst_dps = maxf(worst_dps, _dps[i])
				if _slow[i] > 0.0:
					worst_slow = minf(worst_slow, _slow[i])
		i += 1

	# 겹친 위험물 중 가장 아픈 것 하나만 적용한다. 장판 다섯 개에 5배로 아프면 게임이 안 된다.
	if player != null and worst_dps > 0.0:
		player.take_damage(worst_dps * delta)
	if player != null and worst_slow < 1.0:
		player.apply_slow(worst_slow, 0.25)


func _process(_delta: float) -> void:
	_update_buffer()


func _swap_remove(i: int) -> void:
	var last: int = _count - 1
	if i != last:
		_px[i] = _px[last]; _py[i] = _py[last]
		_vx[i] = _vx[last]; _vy[i] = _vy[last]
		_radius[i] = _radius[last]; _grow[i] = _grow[last]
		_dps[i] = _dps[last]; _life[i] = _life[last]
		_slow[i] = _slow[last]; _alpha[i] = _alpha[last]
		_follow[i] = _follow[last]
	_count = last


func _ensure_renderer() -> void:
	if _renderer != null:
		return
	var quad := QuadMesh.new()
	quad.size = Vector2.ONE
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_2D
	mm.use_colors = true
	mm.use_custom_data = true
	mm.mesh = quad
	_renderer = MultiMeshInstance2D.new()
	_renderer.name = "HazardMultiMesh"
	_renderer.multimesh = mm
	_renderer.material = load("res://vfx/shaders/area_multimesh_material.tres")
	add_child(_renderer)


func _update_buffer() -> void:
	if _renderer == null:
		return
	var buf: PackedFloat32Array = _buffer
	_buffer = PackedFloat32Array()
	for i in _count:
		var b: int = i * BUFFER_STRIDE
		var d: float = _radius[i] * 2.0
		var fade: float = clampf(_life[i], 0.0, 1.0)
		buf[b + 0] = d
		buf[b + 1] = 0.0
		buf[b + 2] = 0.0
		buf[b + 3] = _px[i]
		buf[b + 4] = 0.0
		buf[b + 5] = d
		buf[b + 6] = 0.0
		buf[b + 7] = _py[i]
		buf[b + 8] = COLOR_DANGER.r
		buf[b + 9] = COLOR_DANGER.g
		buf[b + 10] = COLOR_DANGER.b
		buf[b + 11] = _alpha[i] * fade
		buf[b + 12] = 0.0
		buf[b + 13] = 0.0
		buf[b + 14] = 0.0
		buf[b + 15] = 0.0
	_renderer.multimesh.buffer = buf
	_renderer.multimesh.visible_instance_count = _count
	_buffer = buf
