extends Node2D
class_name AreaManager
## 장판(수통 물바닥, 연막탄 폭발, 행군화 발자국). 개별 Node로 만들지 않는다.
## 적과 같은 SoA + MultiMesh 방식. (CLAUDE.md 규칙 1)

const BUFFER_STRIDE: int = 16
const TICK: float = 0.25   ## 장판은 초당 4번만 판정한다. 60Hz로 훑을 이유가 없다.

var _px: PackedFloat32Array = PackedFloat32Array()
var _py: PackedFloat32Array = PackedFloat32Array()
var _radius: PackedFloat32Array = PackedFloat32Array()
var _dps: PackedFloat32Array = PackedFloat32Array()
var _life: PackedFloat32Array = PackedFloat32Array()
var _tick: PackedFloat32Array = PackedFloat32Array()
var _seed: PackedFloat32Array = PackedFloat32Array()
var _color: PackedColorArray = PackedColorArray()

var _count: int = 0
var _capacity: int = 0

var enemies: EnemyManager = null
var _renderer: MultiMeshInstance2D = null
var _buffer: PackedFloat32Array = PackedFloat32Array()


func _ready() -> void:
	z_index = -5   # 적 밑에 깔린다
	if _capacity == 0:
		set_capacity(256)


func set_capacity(p_capacity: int) -> void:
	_capacity = p_capacity
	_px.resize(p_capacity)
	_py.resize(p_capacity)
	_radius.resize(p_capacity)
	_dps.resize(p_capacity)
	_life.resize(p_capacity)
	_tick.resize(p_capacity)
	_seed.resize(p_capacity)
	_color.resize(p_capacity)
	_buffer.resize(p_capacity * BUFFER_STRIDE)
	_ensure_renderer()
	_renderer.multimesh.instance_count = p_capacity
	_renderer.multimesh.visible_instance_count = 0


func get_count() -> int:
	return _count


func spawn(pos: Vector2, radius: float, dps: float, duration: float, color: Color) -> void:
	if _count >= _capacity:
		_swap_remove(0)   # 가장 오래된 걸 밀어낸다
	var i: int = _count
	_px[i] = pos.x
	_py[i] = pos.y
	_radius[i] = radius
	_dps[i] = dps
	_life[i] = duration
	_tick[i] = 0.0
	_seed[i] = randf() * TAU
	_color[i] = color
	_count += 1


func clear() -> void:
	_count = 0


func _physics_process(delta: float) -> void:
	if GameState.phase != GameState.Phase.PLAYING or enemies == null:
		return
	var i: int = 0
	while i < _count:
		_life[i] -= delta
		if _life[i] <= 0.0:
			_swap_remove(i)
			continue
		_tick[i] += delta
		if _tick[i] >= TICK:
			_apply(i, _tick[i])
			_tick[i] = 0.0
		i += 1


func _apply(i: int, elapsed: float) -> void:
	var r: float = _radius[i]
	var dmg: float = _dps[i] * elapsed
	if dmg <= 0.0:
		return
	var n: int = enemies.query(_px[i], _py[i], r)
	var cand: PackedInt32Array = enemies.candidates()
	for k in n:
		var e: int = cand[k]
		var reach: float = r + enemies.radius_of(e)
		var dx: float = enemies.position_of(e).x - _px[i]
		var dy: float = enemies.position_of(e).y - _py[i]
		if dx * dx + dy * dy <= reach * reach:
			enemies.damage(e, dmg)


func _process(_delta: float) -> void:
	_update_buffer()


func _swap_remove(i: int) -> void:
	var last: int = _count - 1
	if i != last:
		_px[i] = _px[last]
		_py[i] = _py[last]
		_radius[i] = _radius[last]
		_dps[i] = _dps[last]
		_life[i] = _life[last]
		_tick[i] = _tick[last]
		_seed[i] = _seed[last]
		_color[i] = _color[last]
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
	_renderer.name = "AreaMultiMesh"
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
		var c: Color = _color[i]
		# 사라지기 직전 1초 동안 흐려진다
		var fade: float = clampf(_life[i], 0.0, 1.0)
		buf[b + 0] = d
		buf[b + 1] = 0.0
		buf[b + 2] = 0.0
		buf[b + 3] = _px[i]
		buf[b + 4] = 0.0
		buf[b + 5] = d
		buf[b + 6] = 0.0
		buf[b + 7] = _py[i]
		buf[b + 8] = c.r
		buf[b + 9] = c.g
		buf[b + 10] = c.b
		buf[b + 11] = c.a * fade
		buf[b + 12] = _seed[i]
		buf[b + 13] = 0.0
		buf[b + 14] = 0.0
		buf[b + 15] = 0.0
	_renderer.multimesh.buffer = buf
	_renderer.multimesh.visible_instance_count = _count
	_buffer = buf
