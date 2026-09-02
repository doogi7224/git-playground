extends Node
class_name SpawnDirector
## 웨이브 디렉터. 1분 구간 테이블(WaveTable.tres)만 보고 돈다. (기획서 5.4)
## 밀도 곡선을 바꾸고 싶으면 코드가 아니라 .tres를 고친다.

@export var spawn_ring_radius: float = 980.0   ## 화면 밖 링에서 스폰
@export var wave_table: WaveTable = null

var enemies: EnemyManager = null
var target: Node2D = null
var pickups: PickupManager = null
var hazards: HazardManager = null
var boss_container: Node = null
var map: MapData = null
var enabled: bool = true

var _accum: float = 0.0
var _last_minute: int = -1
var _current: WaveData = null
var _type_cache: Dictionary = {}   ## StringName -> 타입 인덱스
var _wall_angle: float = 0.0


func setup(p_enemies: EnemyManager, p_target: Node2D, p_map: MapData,
		p_pickups: PickupManager = null, p_boss_container: Node = null,
		p_hazards: HazardManager = null) -> void:
	enemies = p_enemies
	target = p_target
	map = p_map
	wave_table = p_map.wave_table if p_map != null else null
	pickups = p_pickups
	boss_container = p_boss_container
	hazards = p_hazards
	_type_cache.clear()
	_last_minute = -1
	_wall_angle = randf() * TAU


func _physics_process(delta: float) -> void:
	if not enabled or enemies == null or target == null or wave_table == null:
		return
	if GameState.phase != GameState.Phase.PLAYING:
		return

	var minute: int = int(GameState.elapsed / 60.0)
	if minute != _last_minute:
		_last_minute = minute
		var previous: WaveData = _current
		_current = wave_table.wave_for_minute(minute)
		EventBus.wave_changed.emit(minute)
		# 구간이 실제로 바뀐 순간에만 보스를 부른다(같은 구간이 이어지면 다시 안 부른다)
		if _current != null and _current != previous and _current.boss_id != &"":
			_spawn_boss()
	if _current == null or _current.enemy_ids.is_empty():
		return

	# 벽 패턴은 방향이 천천히 돌아야 한 방향에서만 계속 오지 않는다
	_wall_angle += delta * 0.35

	_accum += _current.spawns_per_second * delta
	while _accum >= 1.0:
		_accum -= 1.0
		_spawn_one()


func _spawn_one() -> void:
	if enemies.get_count() >= enemies.get_capacity():
		return
	var id: StringName = _current.enemy_ids[randi() % _current.enemy_ids.size()]
	var type_index: int = _type_cache.get(id, -1)
	if type_index < 0:
		type_index = enemies.type_index_of(id)
		if type_index < 0:
			push_warning("웨이브 테이블이 등록되지 않은 적을 부른다: %s" % id)
			return
		_type_cache[id] = type_index

	var angle: float = _angle_for_pattern()
	var r: float = spawn_ring_radius * randf_range(0.95, 1.15)
	enemies.spawn(type_index, target.global_position + Vector2(cos(angle), sin(angle)) * r)


func _spawn_boss() -> void:
	if boss_container == null or target == null or map == null:
		return
	var boss_data: BossData = map.boss_by_id(_current.boss_id)
	if boss_data == null:
		push_warning("웨이브가 부르는 보스가 맵에 없다: %s" % _current.boss_id)
		return
	var boss := BossController.new()
	boss.name = "Boss_%s" % _current.boss_id
	boss_container.add_child(boss)
	var angle: float = randf() * TAU
	var pos: Vector2 = target.global_position + Vector2(cos(angle), sin(angle)) * 620.0
	var minion: StringName = _current.enemy_ids[0] if not _current.enemy_ids.is_empty() else &""
	if not boss.setup(enemies, target, pickups, hazards, boss_data, minion, pos):
		boss.queue_free()


func _angle_for_pattern() -> float:
	match _current.pattern:
		WaveData.Pattern.WALL:
			# 한쪽에서 벽처럼 밀려온다
			return _wall_angle + randf_range(-0.35, 0.35)
		WaveData.Pattern.PILLAR:
			# 네 방향에서 기둥처럼
			var lane: int = randi() % 4
			return _wall_angle + float(lane) * (TAU / 4.0) + randf_range(-0.12, 0.12)
		_:
			return randf() * TAU
