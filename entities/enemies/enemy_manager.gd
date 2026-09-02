extends Node2D
class_name EnemyManager
## 적 전체를 배열(SoA)로 들고 MultiMesh 하나로 그린다. 개별 Node는 절대 만들지 않는다.
## (CLAUDE.md 규칙 1)
##
## ★ 기획서 6.2와의 의도적 차이: 기획서는 "타입별로 MultiMesh 1개"라고 적었지만
##   여기서는 **전체 적을 MultiMesh 하나**로 그린다. 타입 차이는 인스턴스 색과
##   CUSTOM_DATA의 아틀라스 UV 인덱스로 표현한다. 드로우콜이 타입 수와 무관하게 1이 되고
##   (M3에서 적 20종이면 20 → 1), 버퍼도 하나로 끝난다. GPU 애니메이션 방식은 그대로다.
##
## 인덱스는 프레임 사이에 유지되지 않는다(죽으면 swap-remove). 절대 인덱스를 저장하지 말 것.

const MAX_TYPES: int = 32
const BUFFER_STRIDE: int = 16   ## transform_2d(8) + color(4) + custom_data(4)
## 셀 크기는 분리 계산 기준으로 정한다. 무기 질의는 0.8초에 한 번이지만
## 분리는 적 1마리마다 매번 돌기 때문이다. 실측(3,000마리 기준 이동+분리 ms):
##   32px → 5.38 / 48px → 5.73 / 64px → 6.65 / 96px → 8.97
## 기획서 6.2는 64px이라고 적었지만 32px이 20% 빠르다.
const WHITEBOX_MATERIAL: String = "res://vfx/shaders/enemy_multimesh_material.tres"
const ATLAS_MATERIAL: String = "res://vfx/shaders/enemy_atlas_material.tres"

const CELL_SIZE: float = 32.0
const HIT_FLASH_TIME: float = 0.08

## 군집 분리. 이게 없으면 적이 전부 플레이어 뒤 한 줄로 겹쳐서, 전방 무기가
## 한 대도 못 맞히고 게임이 성립하지 않는다(실측: 사거리 안 7마리가 전부 정면 기준 98~178도).
## 비용을 묶기 위해 이웃은 MAX_NEIGHBORS개까지만 본다.
const SEPARATION_FORCE: float = 5.0
const MAX_NEIGHBORS: int = 6

## 분리 계산을 매 프레임 전부 돌리면 3,000마리에서 26ms가 나온다(60fps 예산의 162%).
## 세 프레임에 한 번씩만 하고 힘을 3배로 주면 평균 밀어내는 양은 같으면서 비용은 1/3이다.
const SEPARATION_INTERVAL: int = 3
## 화면 반대각이 약 1,100px이다. 그보다 훨씬 먼 적은 겹쳐 보여도 아무도 모른다.
const SEPARATION_MAX_DIST: float = 1300.0

## 넉백은 초당 이 비율로 줄어든다. 너무 오래 남으면 적이 둥둥 떠다닌다.
const KNOCKBACK_DECAY: float = 7.0
const KNOCKBACK_MAX_SPEED: float = 1400.0

## --- 적 상태 배열 (SoA) ---
var _px: PackedFloat32Array = PackedFloat32Array()
var _py: PackedFloat32Array = PackedFloat32Array()
var _hp: PackedFloat32Array = PackedFloat32Array()
var _flash: PackedFloat32Array = PackedFloat32Array()   ## 피격 흰 플래시 잔여 시간
var _seed: PackedFloat32Array = PackedFloat32Array()    ## 개체별 bob 위상
var _type: PackedByteArray = PackedByteArray()
var _dying: PackedByteArray = PackedByteArray()
## 보스처럼 "계속 지목해야 하는" 개체용 핸들. 0이면 추적 안 함.
## 인덱스는 swap-remove 때문에 프레임 사이에 유지되지 않는다.
var _handle: PackedInt64Array = PackedInt64Array()
## 상태 이상. 기상나팔(스턴), 트랙터/폭발(넉백)이 쓴다.
var _stun: PackedFloat32Array = PackedFloat32Array()
var _kx: PackedFloat32Array = PackedFloat32Array()
var _ky: PackedFloat32Array = PackedFloat32Array()

var _count: int = 0
var _capacity: int = 0

## --- 타입 스탯 ---
## 원본은 EnemyData(.tres). 여기 있는 Packed 배열은 매 프레임 3,000번 읽는 값만
## 뽑아둔 캐시다. Resource 프로퍼티를 루프 안에서 읽으면 그것만으로 느려진다.
var _t_data: Array[EnemyData] = []
var _t_id: Array[StringName] = []
var _t_speed: PackedFloat32Array = PackedFloat32Array()
var _t_max_hp: PackedFloat32Array = PackedFloat32Array()
var _t_radius: PackedFloat32Array = PackedFloat32Array()
var _t_contact_dps: PackedFloat32Array = PackedFloat32Array()
var _t_xp: PackedFloat32Array = PackedFloat32Array()
var _t_color: PackedColorArray = PackedColorArray()
var _t_atlas: PackedInt32Array = PackedInt32Array()
var _t_aura_dps: PackedFloat32Array = PackedFloat32Array()
var _t_aura_radius: PackedFloat32Array = PackedFloat32Array()
var _t_draw_size: PackedFloat32Array = PackedFloat32Array()   ## 그릴 높이(px)
var _t_aspect: PackedFloat32Array = PackedFloat32Array()      ## 가로/세로 비
var _type_count: int = 0
var _max_radius: float = 0.0
var _max_aura: float = 0.0

## --- 렌더 / 질의 ---
var hash_grid: SpatialHash = null
var atlas: SpriteAtlas = null
var _renderer: MultiMeshInstance2D = null
var _buffer: PackedFloat32Array = PackedFloat32Array()
var _reap_list: PackedInt32Array = PackedInt32Array()
var _reap_count: int = 0
var _reap_scheduled: bool = false
var _scratch: PackedInt32Array = PackedInt32Array()
var _sep_scratch: PackedInt32Array = PackedInt32Array()
var _sep_parity: int = 0

## 핸들 → 현재 인덱스. 추적 대상(보스/엘리트)만 들어가므로 3,000개가 들어올 일은 없다.
var _tracked: Dictionary = {}
var _next_handle: int = 1

## 디버그 오버레이용 계측 (프레임당 Time 호출 2번, 무시할 수준)
var last_sim_usec: int = 0
var last_buffer_usec: int = 0

var target_position: Vector2 = Vector2.ZERO


func _ready() -> void:
	if _capacity == 0:
		set_capacity(4096)


## 런 시작 전에 한 번만 호출한다. 런 중 재할당은 하지 않는다.
func set_capacity(p_capacity: int) -> void:
	_capacity = p_capacity
	_px.resize(p_capacity)
	_py.resize(p_capacity)
	_hp.resize(p_capacity)
	_flash.resize(p_capacity)
	_seed.resize(p_capacity)
	_type.resize(p_capacity)
	_dying.resize(p_capacity)
	_handle.resize(p_capacity)
	_stun.resize(p_capacity)
	_kx.resize(p_capacity)
	_ky.resize(p_capacity)
	_reap_list.resize(p_capacity)
	_scratch.resize(p_capacity)
	_sep_scratch.resize(64)
	_buffer.resize(p_capacity * BUFFER_STRIDE)
	hash_grid = SpatialHash.new(CELL_SIZE, p_capacity)
	_ensure_renderer()
	_renderer.multimesh.instance_count = p_capacity
	_renderer.multimesh.visible_instance_count = 0


## EnemyData 하나를 등록하고 타입 인덱스를 돌려준다. 런 시작 전에만 호출한다.
func register_enemy(data: EnemyData) -> int:
	assert(data != null, "EnemyData가 null이다")
	assert(_type_count < MAX_TYPES, "적 타입이 MAX_TYPES를 넘었다")
	var existing: int = _t_id.find(data.id)
	if existing >= 0:
		return existing
	_t_data.append(data)
	_t_id.append(data.id)
	_t_speed.append(data.speed)
	_t_max_hp.append(data.max_hp)
	_t_radius.append(data.radius)
	_t_contact_dps.append(data.contact_dps)
	_t_xp.append(data.xp)
	_t_color.append(data.color)
	_t_atlas.append(0)
	_t_aura_dps.append(data.aura_dps)
	_t_aura_radius.append(data.aura_radius)
	_max_aura = maxf(_max_aura, data.aura_radius)
	_t_draw_size.append(data.radius * 2.0)
	_t_aspect.append(1.0)
	_max_radius = maxf(_max_radius, data.radius)
	_type_count += 1
	return _type_count - 1


## 맵의 적 목록을 통째로 등록한다.
func register_map(map: MapData) -> void:
	for e: EnemyData in map.enemies:
		register_enemy(e)
	set_atlas(map.sprite_atlas)


## 맵의 스프라이트 아틀라스를 물린다. null 이거나 비어 있으면 화이트박스 도형으로 남는다 —
## 아트가 아직 없어도 게임은 돌아야 한다.
func set_atlas(p_atlas: SpriteAtlas) -> void:
	atlas = p_atlas
	_ensure_renderer()
	if atlas == null or not atlas.is_valid():
		_renderer.material = load(WHITEBOX_MATERIAL)
		return

	var material: ShaderMaterial = (load(ATLAS_MATERIAL) as ShaderMaterial).duplicate()
	material.set_shader_parameter(&"atlas", atlas.texture)
	# 셰이더의 uniform 배열은 크기가 고정(MAX_TYPES)이다. 모자라면 채워서 넘긴다.
	if atlas.regions.size() > MAX_TYPES:
		push_error("아틀라스 그림이 %d장인데 셰이더 배열은 %d칸이다. enemy_atlas.gdshader 의 regions 크기를 늘려라."
				% [atlas.regions.size(), MAX_TYPES])
	var regions := PackedVector4Array(atlas.regions)
	regions.resize(MAX_TYPES)
	material.set_shader_parameter(&"regions", regions)
	if atlas.normal_texture != null:
		material.set_shader_parameter(&"normal_atlas", atlas.normal_texture)
		material.set_shader_parameter(&"use_normal", true)
	_renderer.material = material

	# 타입별로 아틀라스 어느 칸을 쓰는지 풀어둔다. 이름이 안 맞으면 화이트박스로 남겨야
	# "그림이 없다"가 눈에 보인다 — 조용히 0번 칸을 쓰면 전부 같은 그림이 된다.
	for t in _type_count:
		var data: EnemyData = _t_data[t]
		var index: int = atlas.index_of(data.sprite_name())
		if index < 0:
			push_warning("아틀라스에 '%s' 그림이 없다 — 화이트박스로 그린다" % data.sprite_name())
			_t_atlas[t] = 0
			_t_draw_size[t] = data.radius * 2.0
			_t_aspect[t] = 1.0
			continue
		_t_atlas[t] = index
		var pixel: Vector2 = atlas.size_of(index)
		_t_draw_size[t] = data.radius * 2.0 * data.sprite_scale
		_t_aspect[t] = 1.0 if pixel.y <= 0.0 else pixel.x / pixel.y


func data_of_type(type_index: int) -> EnemyData:
	return _t_data[type_index]


func type_count() -> int:
	return _type_count


func atlas_index_of(type_index: int) -> int:
	return _t_atlas[type_index]


func type_index_of(id: StringName) -> int:
	return _t_id.find(id)


func get_count() -> int:
	return _count


func get_capacity() -> int:
	return _capacity


func position_of(i: int) -> Vector2:
	return Vector2(_px[i], _py[i])


func radius_of(i: int) -> float:
	return _t_radius[_type[i]]


func contact_dps_of(i: int) -> float:
	return _t_contact_dps[_type[i]]


func aura_dps_of(i: int) -> float:
	return _t_aura_dps[_type[i]]


func aura_radius_of(i: int) -> float:
	return _t_aura_radius[_type[i]]


## 접촉 판정에 쓸 최대 사거리. 오라를 가진 적이 있으면 그만큼 넓게 훑어야 한다.
func max_threat_radius() -> float:
	return maxf(_max_radius, _max_aura)


func spawn(type_index: int, pos: Vector2) -> int:
	if _count >= _capacity:
		return -1
	var i: int = _count
	_px[i] = pos.x
	_py[i] = pos.y
	_hp[i] = _t_max_hp[type_index]
	_flash[i] = 0.0
	_seed[i] = randf() * TAU
	_type[i] = type_index
	_dying[i] = 0
	_handle[i] = 0
	_stun[i] = 0.0
	_kx[i] = 0.0
	_ky[i] = 0.0
	_count += 1
	return i


## 스폰 후 계속 지목해야 하는 개체(보스)를 위한 핸들 발급.
func spawn_tracked(type_index: int, pos: Vector2) -> int:
	var i: int = spawn(type_index, pos)
	if i < 0:
		return 0
	var handle: int = _next_handle
	_next_handle += 1
	_handle[i] = handle
	_tracked[handle] = i
	return handle


## 핸들에 해당하는 현재 인덱스. 이미 죽었으면 -1.
func index_of_handle(handle: int) -> int:
	return int(_tracked.get(handle, -1))


func is_alive(handle: int) -> bool:
	return _tracked.has(handle)


## Node2D.set_position 과 이름이 겹치면 안 된다.
func move_to(i: int, pos: Vector2) -> void:
	_px[i] = pos.x
	_py[i] = pos.y


func hp_ratio(i: int) -> float:
	var max_hp: float = _t_max_hp[_type[i]]
	return 0.0 if max_hp <= 0.0 else clampf(_hp[i] / max_hp, 0.0, 1.0)


## 피해를 준다. 죽더라도 바로 지우지 않고 프레임 끝에 한꺼번에 정리한다(_reap).
## 프레임 중 인덱스가 흔들리면 같은 적을 두 번 때리는 버그가 난다.
func damage(i: int, amount: float, is_crit: bool = false) -> void:
	if _dying[i] == 1:
		return
	_hp[i] -= amount
	_flash[i] = HIT_FLASH_TIME
	# 피격 사실과 그걸 어떻게 연출하느냐는 다른 이야기다.
	# damage_number_requested 는 데미지 넘버 전용 훅이라 설정으로 꺼진다 --
	# 거기에 소리를 얹으면 "데미지 넘버 끔" 이 "타격음 끔" 이 돼 버린다.
	EventBus.enemy_damaged.emit(Vector2(_px[i], _py[i]), amount, is_crit)
	if Settings.damage_numbers:
		EventBus.damage_number_requested.emit(Vector2(_px[i], _py[i]), amount, is_crit)
	if _hp[i] <= 0.0:
		_dying[i] = 1
		_reap_list[_reap_count] = i
		_reap_count += 1
		if not _reap_scheduled:
			# 물리 스텝이 전부 끝난 뒤에 정리한다. 무기 노드가 EnemyManager보다 먼저
			# 도는지 나중에 도는지에 의존하지 않기 위해 deferred로 미룬다.
			_reap_scheduled = true
			reap.call_deferred()


## --- 상태 이상 ---

## 반경 안의 적을 duration 초 동안 멈춘다. 기상나팔·국기하강식.
## 몇 마리에게 걸었는지 돌려준다.
func stun_area(center: Vector2, radius: float, duration: float) -> int:
	var affected: int = 0
	var n: int = query(center.x, center.y, radius)
	var cand: PackedInt32Array = candidates()
	for k in n:
		var i: int = cand[k]
		var reach: float = radius + _t_radius[_type[i]]
		if center.distance_squared_to(Vector2(_px[i], _py[i])) > reach * reach:
			continue
		_stun[i] = maxf(_stun[i], duration)
		affected += 1
	return affected


## 반경 안의 적을 중심에서 바깥으로 밀어낸다. 트랙터·폭발.
## **force 가 음수면 안쪽으로 빨아들인다** — 잔반차의 "적 흡인"이 그거다.
func knockback_area(center: Vector2, radius: float, force: float) -> int:
	if is_zero_approx(force):
		return 0
	var affected: int = 0
	var n: int = query(center.x, center.y, radius)
	var cand: PackedInt32Array = candidates()
	for k in n:
		var i: int = cand[k]
		var away := Vector2(_px[i] - center.x, _py[i] - center.y)
		var dist: float = away.length()
		var reach: float = radius + _t_radius[_type[i]]
		if dist > reach:
			continue
		var dir: Vector2 = Vector2.RIGHT.rotated(randf() * TAU) if dist < 0.001 else away / dist
		# 가까울수록 세게 밀린다
		var falloff: float = 1.0 - clampf(dist / maxf(radius, 1.0), 0.0, 1.0) * 0.6
		_kx[i] += dir.x * force * falloff
		_ky[i] += dir.y * force * falloff
		affected += 1
	return affected


func is_stunned(i: int) -> bool:
	return _stun[i] > 0.0


func query(px: float, py: float, radius: float) -> int:
	return hash_grid.query_circle(px, py, radius + _max_radius, _scratch)


## query() 직후에만 유효한 후보 인덱스 버퍼.
func candidates() -> PackedInt32Array:
	return _scratch


func _physics_process(delta: float) -> void:
	if GameState.phase != GameState.Phase.PLAYING:
		return
	# 분리 계산은 지난 프레임 격자를 쓴다(한 프레임 낡아도 밀어내기엔 충분).
	# 이동이 끝난 뒤 다시 만들어서, 이번 프레임 무기 판정은 최신 위치로 한다.
	var t0: int = Time.get_ticks_usec()
	_move(delta)
	hash_grid.rebuild(_px, _py, _count)
	last_sim_usec = Time.get_ticks_usec() - t0


func _process(_delta: float) -> void:
	var t0: int = Time.get_ticks_usec()
	_update_buffer()
	last_buffer_usec = Time.get_ticks_usec() - t0


func _move(delta: float) -> void:
	var tx: float = target_position.x
	var ty: float = target_position.y

	# 해시 내부 배열을 지역 변수로 받아온다. 읽기만 하므로 CoW 복사는 일어나지 않고,
	# 적 1마리마다 query_circle()을 부르던 3,000번의 메서드 호출이 사라진다.
	var counts: PackedInt32Array = hash_grid.get_counts()
	var items: PackedInt32Array = hash_grid.get_items()
	var cell_keys: PackedInt64Array = hash_grid.get_cell_keys()
	var inv_cell: float = hash_grid.get_inv_cell()
	var has_grid: bool = hash_grid.get_count() > 0

	_sep_parity = (_sep_parity + 1) % SEPARATION_INTERVAL
	var far_sq: float = SEPARATION_MAX_DIST * SEPARATION_MAX_DIST
	var force: float = SEPARATION_FORCE * float(SEPARATION_INTERVAL)

	for i in _count:
		var t: int = _type[i]
		var speed: float = _t_speed[t]
		var px: float = _px[i]
		var py: float = _py[i]

		# 0) 넉백은 스턴 중에도 먹는다 (밀려나는 중에 멈춰 서면 어색하다)
		var vx: float = _kx[i]
		var vy: float = _ky[i]
		if vx != 0.0 or vy != 0.0:
			var decay: float = maxf(0.0, 1.0 - KNOCKBACK_DECAY * delta)
			_kx[i] = vx * decay
			_ky[i] = vy * decay
			if absf(_kx[i]) < 1.0 and absf(_ky[i]) < 1.0:
				_kx[i] = 0.0
				_ky[i] = 0.0

		var stunned: bool = _stun[i] > 0.0
		if stunned:
			_stun[i] = maxf(0.0, _stun[i] - delta)

		# 1) 플레이어 추격
		var dx: float = tx - px
		var dy: float = ty - py
		var to_player_sq: float = dx * dx + dy * dy
		if not stunned and to_player_sq > 0.000001:
			var inv: float = speed / sqrt(to_player_sq)
			vx += dx * inv
			vy += dy * inv

		# 2) 겹친 이웃 밀어내기 (격자 셀을 직접 훑는다)
		if has_grid and not stunned and to_player_sq < far_sq and (i % SEPARATION_INTERVAL) == _sep_parity:
			var want: float = _t_radius[t] * 2.0
			var want_sq: float = want * want
			var min_cx: int = int(floor((px - want) * inv_cell))
			var max_cx: int = int(floor((px + want) * inv_cell))
			var min_cy: int = int(floor((py - want) * inv_cell))
			var max_cy: int = int(floor((py + want) * inv_cell))
			var neighbors: int = 0
			var cy: int = min_cy
			while cy <= max_cy and neighbors < MAX_NEIGHBORS:
				var cx: int = min_cx
				while cx <= max_cx and neighbors < MAX_NEIGHBORS:
					var b: int = ((cx * 73856093) ^ (cy * 19349663)) & SpatialHash.BUCKET_MASK
					var key: int = cx * 4294967296 + cy
					var k: int = counts[b]
					var end: int = counts[b + 1]
					while k < end and neighbors < MAX_NEIGHBORS:
						var j: int = items[k]
						k += 1
						if j == i or cell_keys[j] != key:
							continue
						var ox: float = px - _px[j]
						var oy: float = py - _py[j]
						var d2: float = ox * ox + oy * oy
						if d2 >= want_sq:
							continue
						if d2 < 0.0001:
							# 완전히 겹쳤으면 개체별 위상으로 갈라놓는다
							ox = cos(_seed[i])
							oy = sin(_seed[i])
							d2 = 1.0
						var d: float = sqrt(d2)
						var push: float = (want - d) / want * speed * force / d
						vx += ox * push
						vy += oy * push
						neighbors += 1
					cx += 1
				cy += 1

		# 속도 상한이 없으면 밀림이 폭주한다. 넉백 중에는 상한을 풀어준다.
		var v2: float = vx * vx + vy * vy
		var cap: float = speed * 1.6
		if _kx[i] != 0.0 or _ky[i] != 0.0:
			cap = maxf(cap, KNOCKBACK_MAX_SPEED)
		if v2 > cap * cap:
			var k2: float = cap / sqrt(v2)
			vx *= k2
			vy *= k2

		_px[i] = px + vx * delta
		_py[i] = py + vy * delta

		if _flash[i] > 0.0:
			_flash[i] = maxf(0.0, _flash[i] - delta)


## 프레임 끝에 죽은 적을 정리한다. 내림차순으로 지워야 swap-remove가 안전하다.
func reap() -> void:
	_reap_scheduled = false
	if _reap_count == 0:
		return
	var dead: PackedInt32Array = _reap_list.slice(0, _reap_count)
	dead.sort()
	for k in range(dead.size() - 1, -1, -1):
		var i: int = dead[k]
		EventBus.enemy_died.emit(Vector2(_px[i], _py[i]), _t_xp[_type[i]], _t_id[_type[i]])
		_swap_remove(i)
	_reap_count = 0


func _swap_remove(i: int) -> void:
	var last: int = _count - 1
	if _handle[i] != 0:
		_tracked.erase(_handle[i])
	if i != last:
		if _handle[last] != 0:
			_tracked[_handle[last]] = i
		_px[i] = _px[last]
		_py[i] = _py[last]
		_hp[i] = _hp[last]
		_flash[i] = _flash[last]
		_seed[i] = _seed[last]
		_type[i] = _type[last]
		_dying[i] = _dying[last]
		_handle[i] = _handle[last]
		_stun[i] = _stun[last]
		_kx[i] = _kx[last]
		_ky[i] = _ky[last]
	_count = last


func clear() -> void:
	_count = 0
	_reap_count = 0
	_reap_scheduled = false
	_tracked.clear()


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
	_renderer.name = "EnemyMultiMesh"
	_renderer.multimesh = mm
	_renderer.material = load(WHITEBOX_MATERIAL)
	add_child(_renderer)


## MultiMesh 버퍼를 통째로 갱신한다. set_instance_transform_2d를 3,000번 부르는 것보다
## buffer 한 번 대입이 훨씬 싸다.
func _update_buffer() -> void:
	if _renderer == null:
		return
	# 멤버를 비워 참조를 1개로 만든다. 이렇게 안 하면 첫 쓰기에서 CoW 복사가 한 번 더 난다.
	var buf: PackedFloat32Array = _buffer
	_buffer = PackedFloat32Array()

	var textured: bool = atlas != null and atlas.is_valid()
	for i in _count:
		var t: int = _type[i]
		var h: float = _t_draw_size[t]
		var w: float = h * _t_aspect[t]
		var b: int = i * BUFFER_STRIDE
		# 그림이 있으면 틴트를 흰색으로 둔다. 타입 색을 곱하면 그림이 갈색으로 물든다.
		var c: Color = Color.WHITE if textured else _t_color[t]
		buf[b + 0] = w
		buf[b + 1] = 0.0
		buf[b + 2] = 0.0
		buf[b + 3] = _px[i]
		buf[b + 4] = 0.0
		buf[b + 5] = h
		buf[b + 6] = 0.0
		buf[b + 7] = _py[i]
		buf[b + 8] = c.r
		buf[b + 9] = c.g
		buf[b + 10] = c.b
		buf[b + 11] = c.a
		buf[b + 12] = _seed[i]                              # bob 위상
		buf[b + 13] = _flash[i] / HIT_FLASH_TIME            # 흰 플래시 0~1
		buf[b + 14] = float(_t_atlas[t])                    # M2: 아틀라스 UV 인덱스
		buf[b + 15] = 0.0                                   # M2: 스쿼시 양

	_renderer.multimesh.buffer = buf
	_renderer.multimesh.visible_instance_count = _count
	_buffer = buf
