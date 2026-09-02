extends Node
class_name SpawnDirector
## 웨이브 디렉터. 1분 구간 테이블(WaveTable.tres)만 보고 돈다. (기획서 5.4)
## 밀도 곡선을 바꾸고 싶으면 코드가 아니라 .tres를 고친다.

## 화면 밖에서 스폰. **원이 아니라 화면 사각형을 따라간다.**
##
## 예전에는 반지름 하나(700)짜리 원이었다. 반대각선(612)에 맞춘 값이라 대각선
## 방향은 맞았지만, 세로 화면에서 보이는 가로 반경은 300밖에 안 된다 -- 좌우로
## 스폰된 적은 화면 밖 2.3배 거리에서 걸어와야 했다. 실제로 초반 스크린샷이
## "적 7마리인데 전부 화면 밖"이라 빈 격자만 나왔다.
##
## 지금은 각도를 받아서 **보이는 사각형과 만나는 점**까지 쏜다. 어느 방향이든
## 화면 가장자리 바로 밖이다. 각도를 균등하게 뽑으면 긴 변(세로 화면의 좌우)에
## 더 많이 떨어지는데, 그게 둘레 비율(64%)과도 거의 맞는다.
@export var spawn_ring_margin: float = 1.12
## 카메라를 못 찾을 때 쓰는 값(헤드리스 도구). 원래의 원 반지름이다.
@export var spawn_ring_fallback: float = 700.0
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
	# 배열 용량과 품질 설정 상한 둘 다 지킨다.
	# 용량은 절대 넘으면 안 되는 선이고, 설정 상한은 기기가 감당할 수 있는 선이다.
	if enemies.get_count() >= mini(enemies.get_capacity(), Settings.max_enemies):
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
	enemies.spawn(type_index, target.global_position + ring_offset(angle, randf_range(0.98, 1.10)))


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
	# 보스는 덩치가 커서 경계에 딱 붙이면 스폰 순간 반쯤 보인다. 조금 더 밖에서.
	var pos: Vector2 = target.global_position + ring_offset(angle, 1.3)
	var minion: StringName = _current.enemy_ids[0] if not _current.enemy_ids.is_empty() else &""
	if not boss.setup(enemies, target, pickups, hazards, boss_data, minion, pos):
		boss.queue_free()


## 그 각도로 화면 밖까지 나가는 벡터. 보이는 사각형의 경계에 margin 을 곱한 점이다.
func ring_offset(angle: float, jitter: float = 1.0) -> Vector2:
	var dir := Vector2(cos(angle), sin(angle))
	var half: Vector2 = visible_half_extents()
	# 그 방향으로 사각형 경계에 닿을 때까지의 배율. 0 나눗셈을 피하려고 축을 나눠 본다.
	var scale: float = INF
	if absf(dir.x) > 0.0001:
		scale = minf(scale, half.x / absf(dir.x))
	if absf(dir.y) > 0.0001:
		scale = minf(scale, half.y / absf(dir.y))
	if not is_finite(scale):
		scale = spawn_ring_fallback
	return dir * scale * spawn_ring_margin * jitter


## 카메라 줌까지 반영한, 지금 실제로 보이는 범위의 절반.
func visible_half_extents() -> Vector2:
	var vp: Viewport = get_viewport()
	if vp == null:
		return Vector2.ONE * spawn_ring_fallback
	var cam: Camera2D = vp.get_camera_2d()
	var zoom: Vector2 = cam.zoom if cam != null else Vector2.ONE
	if zoom.x <= 0.0 or zoom.y <= 0.0:
		zoom = Vector2.ONE
	return (vp.get_visible_rect().size / zoom) * 0.5


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
