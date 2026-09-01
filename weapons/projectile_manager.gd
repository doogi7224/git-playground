extends Node2D
class_name ProjectileManager
## 투사체 전부. 적과 같은 이유로 개별 Node를 만들지 않는다. (CLAUDE.md 규칙 1)
## 총알(STRAIGHT)과 투척물(LOB)을 한 배열에서 같이 굴린다.

enum Mode { STRAIGHT, LOB }

const BUFFER_STRIDE: int = 16

var _px: PackedFloat32Array = PackedFloat32Array()
var _py: PackedFloat32Array = PackedFloat32Array()
var _vx: PackedFloat32Array = PackedFloat32Array()
var _vy: PackedFloat32Array = PackedFloat32Array()
var _damage: PackedFloat32Array = PackedFloat32Array()
var _radius: PackedFloat32Array = PackedFloat32Array()
var _life: PackedFloat32Array = PackedFloat32Array()
var _life0: PackedFloat32Array = PackedFloat32Array()   ## 던진 순간의 수명 (호 그리기용)
var _pierce: PackedInt32Array = PackedInt32Array()
var _mode: PackedByteArray = PackedByteArray()
var _seed: PackedFloat32Array = PackedFloat32Array()
var _color: PackedColorArray = PackedColorArray()
## LOB 전용 — 착탄 시 만들 장판
var _area_radius: PackedFloat32Array = PackedFloat32Array()
var _area_dps: PackedFloat32Array = PackedFloat32Array()
var _area_time: PackedFloat32Array = PackedFloat32Array()

var _count: int = 0
var _capacity: int = 0

var enemies: EnemyManager = null
var areas: AreaManager = null

var _renderer: MultiMeshInstance2D = null
var _buffer: PackedFloat32Array = PackedFloat32Array()
var _hit_scratch: PackedInt32Array = PackedInt32Array()


func _ready() -> void:
	z_index = 4
	if _capacity == 0:
		set_capacity(1024)


func set_capacity(p_capacity: int) -> void:
	_capacity = p_capacity
	_px.resize(p_capacity)
	_py.resize(p_capacity)
	_vx.resize(p_capacity)
	_vy.resize(p_capacity)
	_damage.resize(p_capacity)
	_radius.resize(p_capacity)
	_life.resize(p_capacity)
	_life0.resize(p_capacity)
	_pierce.resize(p_capacity)
	_mode.resize(p_capacity)
	_seed.resize(p_capacity)
	_color.resize(p_capacity)
	_area_radius.resize(p_capacity)
	_area_dps.resize(p_capacity)
	_area_time.resize(p_capacity)
	_buffer.resize(p_capacity * BUFFER_STRIDE)
	_hit_scratch.resize(64)
	_ensure_renderer()
	_renderer.multimesh.instance_count = p_capacity
	_renderer.multimesh.visible_instance_count = 0


func get_count() -> int:
	return _count


## 직선으로 날아가는 총알.
func fire(pos: Vector2, velocity: Vector2, damage: float, radius: float,
		lifetime: float, pierce: int, color: Color) -> void:
	var i: int = _alloc()
	if i < 0:
		return
	_px[i] = pos.x
	_py[i] = pos.y
	_vx[i] = velocity.x
	_vy[i] = velocity.y
	_damage[i] = damage
	_radius[i] = radius
	_life[i] = lifetime
	_life0[i] = lifetime
	_pierce[i] = pierce
	_mode[i] = Mode.STRAIGHT
	_seed[i] = randf() * TAU
	_color[i] = color
	_area_radius[i] = 0.0
	_area_dps[i] = 0.0
	_area_time[i] = 0.0


## 목표 지점까지 날아가 터지는 투척물. 착탄하면 장판을 남긴다.
func lob(pos: Vector2, target: Vector2, flight_time: float, damage: float, radius: float,
		color: Color, area_radius: float, area_dps: float, area_time: float) -> void:
	var i: int = _alloc()
	if i < 0:
		return
	var t: float = maxf(0.05, flight_time)
	_px[i] = pos.x
	_py[i] = pos.y
	_vx[i] = (target.x - pos.x) / t
	_vy[i] = (target.y - pos.y) / t
	_damage[i] = damage
	_radius[i] = radius
	_life[i] = t
	_life0[i] = t
	_pierce[i] = 0          # 날아가는 동안은 아무도 안 맞는다
	_mode[i] = Mode.LOB
	_seed[i] = randf() * TAU
	_color[i] = color
	_area_radius[i] = area_radius
	_area_dps[i] = area_dps
	_area_time[i] = area_time


func clear() -> void:
	_count = 0


func _alloc() -> int:
	if _count >= _capacity:
		return -1
	_count += 1
	return _count - 1


func _physics_process(delta: float) -> void:
	if GameState.phase != GameState.Phase.PLAYING or enemies == null:
		return
	var i: int = 0
	while i < _count:
		_px[i] += _vx[i] * delta
		_py[i] += _vy[i] * delta
		_life[i] -= delta

		if _life[i] <= 0.0:
			if _mode[i] == Mode.LOB:
				_detonate(i)
			_swap_remove(i)
			continue

		if _mode[i] == Mode.STRAIGHT and _hit(i):
			_swap_remove(i)
			continue
		i += 1


## 맞은 게 있으면 관통 횟수를 깎고, 다 쓰면 true(제거).
func _hit(i: int) -> bool:
	var r: float = _radius[i]
	var n: int = enemies.query(_px[i], _py[i], r)
	if n == 0:
		return false
	var cand: PackedInt32Array = enemies.candidates()
	for k in n:
		var e: int = cand[k]
		var reach: float = r + enemies.radius_of(e)
		var pos: Vector2 = enemies.position_of(e)
		var dx: float = pos.x - _px[i]
		var dy: float = pos.y - _py[i]
		if dx * dx + dy * dy > reach * reach:
			continue
		enemies.damage(e, _damage[i])
		_pierce[i] -= 1
		if _pierce[i] < 0:
			return true
	return false


func _detonate(i: int) -> void:
	var pos := Vector2(_px[i], _py[i])
	var r: float = _area_radius[i]
	# 폭발 순간의 즉발 피해
	if _damage[i] > 0.0 and r > 0.0:
		var n: int = enemies.query(pos.x, pos.y, r)
		var cand: PackedInt32Array = enemies.candidates()
		for k in n:
			var e: int = cand[k]
			var reach: float = r + enemies.radius_of(e)
			if pos.distance_squared_to(enemies.position_of(e)) <= reach * reach:
				enemies.damage(e, _damage[i])
	# 남는 장판
	if areas != null and _area_time[i] > 0.0:
		areas.spawn(pos, r, _area_dps[i], _area_time[i], _color[i])
	EventBus.screen_shake_requested.emit(2.5, 0.08)


func _process(_delta: float) -> void:
	_update_buffer()


func _swap_remove(i: int) -> void:
	var last: int = _count - 1
	if i != last:
		_px[i] = _px[last]
		_py[i] = _py[last]
		_vx[i] = _vx[last]
		_vy[i] = _vy[last]
		_damage[i] = _damage[last]
		_radius[i] = _radius[last]
		_life[i] = _life[last]
		_life0[i] = _life0[last]
		_pierce[i] = _pierce[last]
		_mode[i] = _mode[last]
		_seed[i] = _seed[last]
		_color[i] = _color[last]
		_area_radius[i] = _area_radius[last]
		_area_dps[i] = _area_dps[last]
		_area_time[i] = _area_time[last]
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
	_renderer.name = "ProjectileMultiMesh"
	_renderer.multimesh = mm
	_renderer.material = load("res://vfx/shaders/projectile_multimesh_material.tres")
	add_child(_renderer)


func _update_buffer() -> void:
	if _renderer == null:
		return
	var buf: PackedFloat32Array = _buffer
	_buffer = PackedFloat32Array()
	for i in _count:
		var b: int = i * BUFFER_STRIDE
		var d: float = _radius[i] * 2.0
		# 투척물은 날아가는 동안 커졌다 작아진다 (포물선 대신 쓰는 값싼 원근감)
		if _mode[i] == Mode.LOB:
			var progress: float = 1.0 - _life[i] / maxf(0.001, _life0[i])
			d *= 1.0 + 0.7 * sin(PI * clampf(progress, 0.0, 1.0))
		var c: Color = _color[i]
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
		buf[b + 11] = c.a
		buf[b + 12] = _seed[i]
		buf[b + 13] = 0.0
		buf[b + 14] = 0.0
		buf[b + 15] = 0.0
	_renderer.multimesh.buffer = buf
	_renderer.multimesh.visible_instance_count = _count
	_buffer = buf
