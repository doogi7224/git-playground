extends Node2D
class_name BossController
## 보스 1기의 행동을 굴린다. 기획서 5.3 — 5분 '대대장 순시' (돌진 + 소환).
##
## ★ 보스도 몸통은 EnemyManager 배열 안에 있다.
##   개별 Node로 빼면 모든 무기가 "적 배열 + 보스"를 따로 때려야 해서 배선이 두 배가 된다.
##   그래서 몸은 배열에 두고(= 모든 무기·장판·투사체가 공짜로 맞힌다),
##   이 노드는 핸들로 그 개체를 지목해 위치와 상태만 조종한다.
##   EnemyData.speed = 0 이라 EnemyManager는 보스를 밀지도 끌지도 않는다.

enum State { APPROACH, TELEGRAPH, CHARGE, RECOVER, SUMMON }

const APPROACH_SPEED: float = 108.0
const CHARGE_SPEED: float = 780.0
const TELEGRAPH_TIME: float = 0.75
const CHARGE_TIME: float = 0.62
const RECOVER_TIME: float = 0.9
const SUMMON_TIME: float = 1.1
const APPROACH_TIME: float = 3.4
const SUMMON_COUNT: int = 14
const SUMMON_RADIUS: float = 150.0
const COLOR_TELEGRAPH: Color = Color("#C8102E")   ## 기획서 3.2: 진홍 = 무조건 피해야 함

var enemies: EnemyManager = null
var pickups: PickupManager = null
var player: Node2D = null

var boss_id: StringName = &""
var handle: int = 0

var _state: State = State.APPROACH
var _timer: float = 0.0
var _charge_dir: Vector2 = Vector2.RIGHT
var _minion_type: int = -1
var _last_ratio: float = -1.0
var _cycles: int = 0


func setup(p_enemies: EnemyManager, p_player: Node2D, p_pickups: PickupManager,
		p_boss_id: StringName, minion_id: StringName, spawn_pos: Vector2) -> bool:
	enemies = p_enemies
	player = p_player
	pickups = p_pickups
	boss_id = p_boss_id

	var type_index: int = enemies.type_index_of(boss_id)
	if type_index < 0:
		push_warning("보스 %s 가 맵에 등록돼 있지 않다" % boss_id)
		return false
	handle = enemies.spawn_tracked(type_index, spawn_pos)
	if handle == 0:
		return false

	_minion_type = enemies.type_index_of(minion_id)
	_state = State.APPROACH
	_timer = APPROACH_TIME
	EventBus.boss_spawned.emit(boss_id)
	EventBus.boss_hp_changed.emit(1.0)
	return true


func _physics_process(delta: float) -> void:
	if enemies == null or GameState.phase != GameState.Phase.PLAYING:
		return

	var i: int = enemies.index_of_handle(handle)
	if i < 0:
		_on_death()
		return

	var pos: Vector2 = enemies.position_of(i)
	global_position = pos

	var ratio: float = enemies.hp_ratio(i)
	if absf(ratio - _last_ratio) > 0.005:
		_last_ratio = ratio
		EventBus.boss_hp_changed.emit(ratio)

	_timer -= delta
	match _state:
		State.APPROACH:
			pos = _step_toward(pos, APPROACH_SPEED, delta)
			if _timer <= 0.0:
				_enter(State.SUMMON if _cycles % 2 == 1 else State.TELEGRAPH)
		State.TELEGRAPH:
			if player != null:
				_charge_dir = (player.global_position - pos).normalized()
			if _timer <= 0.0:
				_enter(State.CHARGE)
		State.CHARGE:
			pos += _charge_dir * CHARGE_SPEED * delta
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

	enemies.move_to(i, pos)
	queue_redraw()


func _enter(next: State) -> void:
	_state = next
	match next:
		State.APPROACH:
			_timer = APPROACH_TIME
		State.TELEGRAPH:
			_timer = TELEGRAPH_TIME
			EventBus.screen_shake_requested.emit(1.0, 0.15)
		State.CHARGE:
			_timer = CHARGE_TIME
			EventBus.screen_shake_requested.emit(4.0, 0.2)
		State.RECOVER:
			_timer = RECOVER_TIME
		State.SUMMON:
			_timer = SUMMON_TIME


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
	for k in SUMMON_COUNT:
		var a: float = TAU * float(k) / float(SUMMON_COUNT) + randf() * 0.2
		enemies.spawn(_minion_type, pos + Vector2(cos(a), sin(a)) * SUMMON_RADIUS)


func _on_death() -> void:
	EventBus.boss_died.emit(boss_id)
	EventBus.boss_hp_changed.emit(0.0)
	if pickups != null:
		# 기획서 5.1: 진화는 보물상자에서 나온다
		pickups.spawn_chest(global_position)
	queue_free()


func _draw() -> void:
	# 화이트박스 텔레그래프. 진홍 = 피해야 함 (기획서 3.2)
	match _state:
		State.TELEGRAPH:
			var t: float = 1.0 - _timer / TELEGRAPH_TIME
			var col: Color = COLOR_TELEGRAPH
			col.a = 0.25 + 0.5 * t
			draw_line(Vector2.ZERO, _charge_dir * 520.0, col, 6.0 + 10.0 * t)
		State.SUMMON:
			var col2: Color = COLOR_TELEGRAPH
			col2.a = 0.35
			draw_arc(Vector2.ZERO, SUMMON_RADIUS, 0.0, TAU, 40, col2, 4.0, true)
		_:
			pass
