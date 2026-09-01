extends Node2D
class_name Player
## 화이트박스 플레이어. CharacterBody2D를 쓰지 않는다 — 물리 엔진 대신 직접 계산한다.
## (CLAUDE.md 규칙 2. M0에는 벽이 없고, 벽이 생겨도 타일 기반으로 직접 푼다.)

const COLOR_BODY: Color = Color("#B7C77A")     ## 기획서 3.2: 플레이어는 항상 화면에서 가장 밝다
const COLOR_HIGHLIGHT: Color = Color("#FFFFFF")

@export var max_hp: float = 100.0
@export var move_speed: float = 200.0
@export var body_radius: float = 14.0
@export var magnet_radius: float = 90.0

## 업그레이드 배율 (프롬프트 3에서 StatBlock으로 이관)
var speed_mult: float = 1.0
var damage_mult: float = 1.0
var magnet_mult: float = 1.0

var hp: float = 100.0
var facing: Vector2 = Vector2.RIGHT
var level: int = 1
var xp: float = 0.0
var xp_to_next: float = 10.0

var enemies: EnemyManager = null
var _contact_accum: float = 0.0

@onready var weapons: Node2D = $Weapons


func _ready() -> void:
	hp = max_hp
	xp_to_next = _xp_curve(level)
	for w: Node in weapons.get_children():
		if w is BaseWeapon:
			(w as BaseWeapon).player = self
	queue_redraw()


func setup(p_enemies: EnemyManager) -> void:
	enemies = p_enemies
	for w: Node in weapons.get_children():
		if w is BaseWeapon:
			(w as BaseWeapon).enemies = p_enemies


func effective_magnet_radius() -> float:
	return magnet_radius * magnet_mult


func _physics_process(delta: float) -> void:
	if GameState.phase != GameState.Phase.PLAYING:
		return
	_move(delta)
	_contact_damage(delta)


func _move(delta: float) -> void:
	var dir: Vector2 = Input.get_vector(&"move_left", &"move_right", &"move_up", &"move_down")
	if dir.length_squared() > 0.0:
		dir = dir.normalized()
		facing = dir
		position += dir * move_speed * speed_mult * delta


## 겹친 적 중 가장 아픈 놈의 DPS만 받는다. 500마리에 둘러싸였다고 500배 아프면
## 게임이 성립하지 않는다. (기획서 "접촉 시 초당 5 피해"의 실용적 해석)
func _contact_damage(delta: float) -> void:
	if enemies == null or enemies.get_count() == 0:
		return
	var n: int = enemies.query(position.x, position.y, body_radius)
	if n == 0:
		return
	var cand: PackedInt32Array = enemies.candidates()
	var worst: float = 0.0
	for k in n:
		var i: int = cand[k]
		var reach: float = body_radius + enemies.radius_of(i)
		if position.distance_squared_to(enemies.position_of(i)) <= reach * reach:
			worst = maxf(worst, enemies.contact_dps_of(i))
	if worst > 0.0:
		take_damage(worst * delta)


func take_damage(amount: float) -> void:
	if hp <= 0.0:
		return
	hp = maxf(0.0, hp - amount)
	EventBus.player_damaged.emit(amount, hp / max_hp)
	if hp <= 0.0:
		EventBus.player_died.emit()
		GameState.end_run(false)


func heal(amount: float) -> void:
	hp = minf(max_hp, hp + amount)
	EventBus.player_healed.emit(amount, hp / max_hp)


func add_xp(amount: float) -> void:
	xp += amount
	var leveled: bool = false
	while xp >= xp_to_next:
		xp -= xp_to_next
		level += 1
		xp_to_next = _xp_curve(level)
		leveled = true
		GameState.level = level
		var new_rank: StringName = GameState.rank_for_level(level)
		if new_rank != GameState.rank_id:
			GameState.rank_id = new_rank
			EventBus.rank_changed.emit(new_rank)
		EventBus.player_leveled.emit(level)
	EventBus.xp_gained.emit(amount, xp, xp_to_next)
	if leveled:
		queue_redraw()


## M0 임시 곡선. 프롬프트 3에서 .tres로 뺀다.
func _xp_curve(lv: int) -> float:
	return 10.0 + float(lv - 1) * 8.0


func apply_upgrade(id: StringName) -> void:
	match id:
		&"speed_up":
			speed_mult += 0.10
		&"damage_up":
			damage_mult += 0.20
		&"max_hp_up":
			max_hp += 20.0
			heal(20.0)
		&"magnet_up":
			magnet_mult += 0.25
		_:
			push_warning("알 수 없는 업그레이드: %s" % id)
	EventBus.upgrade_picked.emit(id)


func _draw() -> void:
	# 화이트박스: 몸통 원 + 바라보는 방향 표시
	draw_circle(Vector2.ZERO, body_radius, COLOR_BODY)
	draw_arc(Vector2.ZERO, body_radius, 0.0, TAU, 24, Color(0.1, 0.12, 0.08), 3.0, true)
	draw_circle(Vector2(-body_radius * 0.3, -body_radius * 0.35), body_radius * 0.22, COLOR_HIGHLIGHT)
