extends Node2D
class_name PickupManager
## '짬'(경험치) 픽업. 적과 같은 이유로 개별 Node를 만들지 않는다. (CLAUDE.md 규칙 1)
##
## 픽업은 플레이어 한 명하고만 상호작용하므로 공간 해시가 필요 없다. 선형 스캔이면 충분하다.

const BUFFER_STRIDE: int = 16
enum Kind { XP, CHEST }

const RADIUS: float = 7.0
const CHEST_RADIUS: float = 18.0
const COLOR_XP: Color = Color("#8FE388")     ## 기획서 3.2: 회복/획득 = 연녹
const COLOR_CHEST: Color = Color("#FFC94A")  ## 보물상자는 금색

@export var magnet_accel: float = 1800.0
@export var magnet_max_speed: float = 900.0
@export var collect_radius: float = 18.0
## 자석 범위 밖의 짬이 천천히 따라오는 속도.
## 이게 없으면 20분에 16,000마리를 잡고도 Lv.6에서 끝난다 — 짬이 전부 필드에 버려지고
## 용량(2048)이 차서 오래된 것부터 사라진다. 맵에 벽이 없어서 플레이어가 되돌아오지 않는다.
@export var drift_speed: float = 70.0
@export var drift_accel: float = 260.0

var _px: PackedFloat32Array = PackedFloat32Array()
var _py: PackedFloat32Array = PackedFloat32Array()
var _vx: PackedFloat32Array = PackedFloat32Array()
var _vy: PackedFloat32Array = PackedFloat32Array()
var _value: PackedFloat32Array = PackedFloat32Array()
var _seed: PackedFloat32Array = PackedFloat32Array()
var _kind: PackedByteArray = PackedByteArray()

var _count: int = 0
var _capacity: int = 0

var _renderer: MultiMeshInstance2D = null
var _buffer: PackedFloat32Array = PackedFloat32Array()

var target_position: Vector2 = Vector2.ZERO
var magnet_radius: float = 90.0

signal collected(value: float)
signal chest_collected()


func _ready() -> void:
	if _capacity == 0:
		set_capacity(2048)
	EventBus.enemy_died.connect(_on_enemy_died)


func set_capacity(p_capacity: int) -> void:
	_capacity = p_capacity
	_px.resize(p_capacity)
	_py.resize(p_capacity)
	_vx.resize(p_capacity)
	_vy.resize(p_capacity)
	_value.resize(p_capacity)
	_seed.resize(p_capacity)
	_kind.resize(p_capacity)
	_buffer.resize(p_capacity * BUFFER_STRIDE)
	_ensure_renderer()
	_renderer.multimesh.instance_count = p_capacity
	_renderer.multimesh.visible_instance_count = 0


func get_count() -> int:
	return _count


## 보스가 떨구는 보물상자. 자석에 안 끌리고 직접 밟아야 한다.
func spawn_chest(pos: Vector2) -> void:
	spawn(pos, 0.0)
	_kind[_count - 1] = Kind.CHEST
	_vx[_count - 1] = 0.0
	_vy[_count - 1] = 0.0
	EventBus.chest_dropped.emit(pos)


func spawn(pos: Vector2, value: float) -> void:
	if _count >= _capacity:
		# 가장 오래된 걸 밀어낸다. 화면이 픽업으로 덮이는 것보다 낫다.
		_swap_remove(0)
	var i: int = _count
	_px[i] = pos.x
	_py[i] = pos.y
	# 튀어나오는 느낌
	var a: float = randf() * TAU
	_vx[i] = cos(a) * 60.0
	_vy[i] = sin(a) * 60.0
	_value[i] = value
	_seed[i] = randf() * TAU
	_kind[i] = Kind.XP
	_count += 1


func clear() -> void:
	_count = 0


func _on_enemy_died(pos: Vector2, xp: float, _enemy_type: StringName) -> void:
	if xp > 0.0:
		spawn(pos, xp)


func _physics_process(delta: float) -> void:
	if GameState.phase != GameState.Phase.PLAYING:
		return
	var tx: float = target_position.x
	var ty: float = target_position.y
	var magnet_sq: float = magnet_radius * magnet_radius
	var collect_sq: float = collect_radius * collect_radius
	var gathered: float = 0.0
	var chests: int = 0

	var i: int = 0
	while i < _count:
		var dx: float = tx - _px[i]
		var dy: float = ty - _py[i]
		var dist_sq: float = dx * dx + dy * dy

		var is_chest: bool = _kind[i] == Kind.CHEST
		var pickup_r: float = collect_radius + (CHEST_RADIUS if is_chest else 0.0)
		if dist_sq <= pickup_r * pickup_r:
			if is_chest:
				chests += 1
			else:
				gathered += _value[i]
			_swap_remove(i)
			continue

		if is_chest:
			# 보물상자는 자석에 안 끌린다. 직접 가서 밟아야 한다.
			i += 1
			continue

		if dist_sq <= magnet_sq:
			var dist: float = sqrt(dist_sq)
			_vx[i] += dx / dist * magnet_accel * delta
			_vy[i] += dy / dist * magnet_accel * delta
			var speed: float = sqrt(_vx[i] * _vx[i] + _vy[i] * _vy[i])
			if speed > magnet_max_speed:
				var k: float = magnet_max_speed / speed
				_vx[i] *= k
				_vy[i] *= k
		else:
			# 자석 범위 밖에서는 천천히 따라온다
			var dist2: float = sqrt(dist_sq)
			if dist2 > 1.0:
				_vx[i] = move_toward(_vx[i], dx / dist2 * drift_speed, drift_accel * delta)
				_vy[i] = move_toward(_vy[i], dy / dist2 * drift_speed, drift_accel * delta)

		_px[i] += _vx[i] * delta
		_py[i] += _vy[i] * delta
		i += 1

	if gathered > 0.0:
		collected.emit(gathered)
	for _c in chests:
		chest_collected.emit()


func _process(_delta: float) -> void:
	_update_buffer()


func _swap_remove(i: int) -> void:
	var last: int = _count - 1
	if i != last:
		_px[i] = _px[last]
		_py[i] = _py[last]
		_vx[i] = _vx[last]
		_vy[i] = _vy[last]
		_value[i] = _value[last]
		_seed[i] = _seed[last]
		_kind[i] = _kind[last]
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
	_renderer.name = "PickupMultiMesh"
	_renderer.multimesh = mm
	_renderer.material = load("res://vfx/shaders/pickup_multimesh_material.tres")
	add_child(_renderer)


func _update_buffer() -> void:
	if _renderer == null:
		return
	var buf: PackedFloat32Array = _buffer
	_buffer = PackedFloat32Array()

	for i in _count:
		var is_chest: bool = _kind[i] == Kind.CHEST
		var d: float = (CHEST_RADIUS if is_chest else RADIUS) * 2.0
		var c: Color = COLOR_CHEST if is_chest else COLOR_XP
		var b: int = i * BUFFER_STRIDE
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
		buf[b + 11] = 1.0
		buf[b + 12] = _seed[i]
		buf[b + 13] = 0.0
		buf[b + 14] = 0.0
		buf[b + 15] = 0.0

	_renderer.multimesh.buffer = buf
	_renderer.multimesh.visible_instance_count = _count
	_buffer = buf
