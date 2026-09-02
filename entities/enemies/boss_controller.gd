extends Node2D
class_name BossController
## 보스 1기의 행동. 기획서 5.3 보스 4종을 패턴 4개로 굴린다.
##
## ★ 보스도 몸통은 EnemyManager 배열 안에 있다.
##   개별 Node로 빼면 모든 무기가 "적 배열 + 보스"를 따로 때려야 해서 배선이 두 배가 된다.
##   그래서 몸은 배열에 두고(= 모든 무기·장판·투사체가 공짜로 맞힌다),
##   이 노드는 핸들로 그 개체를 지목해 위치와 상태만 조종한다.
##   EnemyData.speed = 0 이라 EnemyManager 는 보스를 밀지도 끌지도 않는다.

enum State { APPROACH, TELEGRAPH, CHARGE, RECOVER, SUMMON, VOLLEY, FAKE_DEATH }

const RECOVER_TIME: float = 0.9
const SUMMON_TIME: float = 1.1
const SUMMON_RADIUS: float = 150.0
const COLOR_TELEGRAPH: Color = Color("#C8102E")   ## 기획서 3.2: 진홍 = 무조건 피해야 함

var enemies: EnemyManager = null
var pickups: PickupManager = null
var hazards: HazardManager = null
var player: Node2D = null

var data: BossData = null
var boss_id: StringName = &""
var handle: int = 0

var _state: State = State.APPROACH
var _timer: float = 0.0
var _charge_dir: Vector2 = Vector2.RIGHT
var _minion_type: int = -1
var _last_ratio: float = -1.0
var _cycles: int = 0
var _field_left: float = 0.0
var _shockwave_left: float = 0.0
var _phase_two: bool = false


func setup(p_enemies: EnemyManager, p_player: Node2D, p_pickups: PickupManager,
		p_hazards: HazardManager, p_data: BossData, fallback_minion: StringName,
		spawn_pos: Vector2) -> bool:
	enemies = p_enemies
	player = p_player
	pickups = p_pickups
	hazards = p_hazards
	data = p_data
	if data == null or data.enemy == null:
		return false
	boss_id = data.id

	var type_index: int = enemies.type_index_of(data.enemy.id)
	if type_index < 0:
		push_warning("보스 %s 가 맵에 등록돼 있지 않다" % boss_id)
		return false
	handle = enemies.spawn_tracked(type_index, spawn_pos)
	if handle == 0:
		return false

	var minion_id: StringName = data.minion if data.minion != &"" else fallback_minion
	_minion_type = enemies.type_index_of(minion_id)
	_enter(State.APPROACH)
	EventBus.boss_spawned.emit(boss_id, data.display_name)
	EventBus.boss_hp_changed.emit(1.0)
	return true


func _physics_process(delta: float) -> void:
	if enemies == null or data == null or GameState.phase != GameState.Phase.PLAYING:
		return

	var i: int = enemies.index_of_handle(handle)
	if i < 0:
		_on_death()
		return

	var pos: Vector2 = enemies.position_of(i)
	global_position = pos
	if hazards != null:
		hazards.set_owner_position(pos)

	var ratio: float = enemies.hp_ratio(i)
	if absf(ratio - _last_ratio) > 0.005:
		_last_ratio = ratio
		EventBus.boss_hp_changed.emit(ratio)

	# 페이크 승리: 절반 아래로 떨어지면 한 번 쓰러진 척한다
	if data.pattern == BossData.Pattern.FINALE and not _phase_two \
			and ratio <= data.fake_death_hp_ratio and _state != State.FAKE_DEATH:
		_enter(State.FAKE_DEATH)

	_timer -= delta
	pos = _run_state(pos, delta)
	_run_passives(pos, delta)

	enemies.move_to(i, pos)
	queue_redraw()


func _run_state(pos: Vector2, delta: float) -> Vector2:
	match _state:
		State.APPROACH:
			pos = _step_toward(pos, data.approach_speed, delta)
			if _timer <= 0.0:
				_enter(_next_after_approach())
		State.TELEGRAPH:
			if player != null:
				_charge_dir = (player.global_position - pos).normalized()
			if _timer <= 0.0:
				_enter(State.CHARGE)
		State.CHARGE:
			pos += _charge_dir * data.charge_speed * delta
			if _timer <= 0.0:
				_enter(State.RECOVER)
		State.RECOVER:
			if _timer <= 0.0:
				_cycles += 1
				_enter(State.APPROACH)
		State.SUMMON:
			if _timer <= 0.0:
				_summon(pos)
				_cycles += 1
				_enter(State.APPROACH)
		State.VOLLEY:
			if _timer <= 0.0:
				_volley(pos)
				_cycles += 1
				_enter(State.APPROACH)
		State.FAKE_DEATH:
			# 잠깐 멈춰서 "이긴 줄 알았지" 를 만든다
			if _timer <= 0.0:
				_phase_two = true
				EventBus.screen_shake_requested.emit(6.0, 0.5)
				EventBus.boss_spawned.emit(boss_id, data.display_name)
				_enter(State.APPROACH)
	return pos


## 패턴마다 접근 다음에 뭘 하는지가 다르다.
func _next_after_approach() -> State:
	match data.pattern:
		BossData.Pattern.BARRAGE:
			return State.VOLLEY
		BossData.Pattern.FIELD:
			return State.SUMMON if _cycles % 3 == 2 else State.TELEGRAPH
		BossData.Pattern.FINALE:
			if _phase_two:
				return State.VOLLEY if _cycles % 2 == 0 else State.TELEGRAPH
			return State.TELEGRAPH if _cycles % 2 == 0 else State.SUMMON
		_:
			return State.SUMMON if _cycles % 2 == 1 else State.TELEGRAPH


## 상태와 무관하게 계속 도는 것 — 둔화 필드, PT 충격파.
func _run_passives(pos: Vector2, delta: float) -> void:
	if hazards == null:
		return
	var wants_field: bool = data.pattern == BossData.Pattern.FIELD \
			or (data.pattern == BossData.Pattern.FINALE and _phase_two)
	if wants_field:
		_field_left -= delta
		if _field_left <= 0.0:
			_field_left = 0.4
			# 짧은 수명으로 계속 새로 깐다 — 보스를 따라다니는 장판이 된다
			hazards.spawn_field(pos, data.field_radius, data.field_dps, 0.5,
					data.field_slow, true)
		_shockwave_left -= delta
		if _shockwave_left <= 0.0:
			_shockwave_left = data.shockwave_interval
			hazards.spawn_shockwave(pos, 40.0, data.shockwave_grow,
					data.shockwave_dps, 1.1)
			EventBus.screen_shake_requested.emit(2.0, 0.15)


func _enter(next: State) -> void:
	_state = next
	match next:
		State.APPROACH:
			_timer = data.approach_time
		State.TELEGRAPH:
			_timer = data.telegraph_time
			EventBus.screen_shake_requested.emit(1.0, 0.15)
		State.CHARGE:
			_timer = data.charge_time
			EventBus.screen_shake_requested.emit(4.0, 0.2)
		State.RECOVER:
			_timer = RECOVER_TIME
		State.SUMMON:
			_timer = SUMMON_TIME
		State.VOLLEY:
			_timer = data.volley_interval
		State.FAKE_DEATH:
			_timer = data.fake_death_time
			EventBus.screen_shake_requested.emit(3.0, 0.4)


func _step_toward(pos: Vector2, speed: float, delta: float) -> Vector2:
	if player == null:
		return pos
	var to: Vector2 = player.global_position - pos
	if to.length() < 1.0:
		return pos
	return pos + to.normalized() * speed * delta


func _summon(pos: Vector2) -> void:
	if _minion_type < 0:
		return
	for k in data.summon_count:
		var a: float = TAU * float(k) / float(maxi(1, data.summon_count)) + randf() * 0.2
		enemies.spawn(_minion_type, pos + Vector2(cos(a), sin(a)) * SUMMON_RADIUS)


## 서류 탄막. 사방으로 고르게 뿌리고 매번 각도를 조금씩 돌려서 틈이 생기게 한다.
func _volley(pos: Vector2) -> void:
	if hazards == null:
		return
	var count: int = maxi(1, data.bullets_per_volley)
	var base: float = randf() * TAU
	for k in count:
		var a: float = base + TAU * float(k) / float(count)
		hazards.spawn_bullet(pos, Vector2(cos(a), sin(a)) * data.bullet_speed,
				data.bullet_radius, data.bullet_dps, 4.0)
	EventBus.screen_shake_requested.emit(1.5, 0.12)


func _on_death() -> void:
	EventBus.boss_died.emit(boss_id)
	EventBus.boss_hp_changed.emit(0.0)
	EventBus.hit_stop_requested.emit(0.12, 0.04)
	EventBus.screen_shake_requested.emit(6.0, 0.4)
	if pickups != null:
		# 기획서 5.1: 진화는 보물상자에서 나온다
		pickups.spawn_chest(global_position)
	queue_free()


func _draw() -> void:
	match _state:
		State.TELEGRAPH:
			var t: float = 1.0 - _timer / maxf(data.telegraph_time, 0.01)
			var col: Color = COLOR_TELEGRAPH
			col.a = 0.25 + 0.5 * t
			draw_line(Vector2.ZERO, _charge_dir * 520.0, col, 6.0 + 10.0 * t)
		State.SUMMON:
			var col2: Color = COLOR_TELEGRAPH
			col2.a = 0.35
			draw_arc(Vector2.ZERO, SUMMON_RADIUS, 0.0, TAU, 40, col2, 4.0, true)
		State.VOLLEY:
			var col3: Color = COLOR_TELEGRAPH
			col3.a = 0.30
			draw_arc(Vector2.ZERO, 70.0, 0.0, TAU, 28, col3, 5.0, true)
		_:
			pass
