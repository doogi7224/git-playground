extends Node2D
class_name Player
## 화이트박스 플레이어. CharacterBody2D를 쓰지 않는다 — 물리 엔진 대신 직접 계산한다.
## (CLAUDE.md 규칙 2. M0에는 벽이 없고, 벽이 생겨도 타일 기반으로 직접 푼다.)
##
## 기본 스탯은 CharacterData(.tres), 경험치 곡선은 ProgressionData(.tres)에서 온다.

const COLOR_HIGHLIGHT: Color = Color("#FFFFFF")

var character: CharacterData = null

## --- 캐릭터에서 온 기본값 ---
var max_hp: float = 100.0
var move_speed: float = 200.0
var body_radius: float = 14.0
var magnet_radius: float = 90.0
var body_color: Color = Color("#B7C77A")

## --- 업그레이드 배율 ---
var speed_mult: float = 1.0
var damage_mult: float = 1.0
var cooldown_mult: float = 1.0
var magnet_mult: float = 1.0
var xp_mult: float = 1.0
var armor: float = 0.0
var luck: float = 0.0

var hp: float = 100.0
## 스트레스 테스트/디버그용. 켜면 피해를 받지 않는다.
var invulnerable: bool = false
var facing: Vector2 = Vector2.RIGHT
var level: int = 1
var xp: float = 0.0
var xp_to_next: float = 10.0

## 고른 업그레이드/무기 레벨. UpgradeTable이 최대 레벨 체크에 쓴다.
var upgrade_levels: Dictionary = {}

var enemies: EnemyManager = null

@onready var weapons: Node2D = $Weapons


func _ready() -> void:
	xp_to_next = GameState.xp_to_next(level)
	queue_redraw()


## 런 시작 전에 아레나가 부른다. 캐릭터 스탯을 싣고 시작 무기를 만든다.
func setup(p_enemies: EnemyManager, p_character: CharacterData) -> void:
	enemies = p_enemies
	character = p_character

	if character != null:
		max_hp = character.max_hp
		move_speed = character.move_speed
		body_radius = character.body_radius
		magnet_radius = character.magnet_radius
		damage_mult = character.damage_mult
		body_color = character.color
		if character.starting_weapon != null:
			add_weapon(character.starting_weapon)

	hp = max_hp
	xp_to_next = GameState.xp_to_next(level)
	_bind_weapons()
	queue_redraw()


func add_weapon(data: WeaponData) -> BaseWeapon:
	var existing: BaseWeapon = find_weapon(data.id)
	if existing != null:
		existing.level_up()
		return existing
	var weapon: BaseWeapon = WeaponFactory.create(data)
	if weapon == null:
		return null
	weapons.add_child(weapon)
	weapon.player = self
	weapon.enemies = enemies
	return weapon


func find_weapon(id: StringName) -> BaseWeapon:
	for w: Node in weapons.get_children():
		if w is BaseWeapon and (w as BaseWeapon).weapon_id() == id:
			return w as BaseWeapon
	return null


func _bind_weapons() -> void:
	for w: Node in weapons.get_children():
		if w is BaseWeapon:
			var weapon: BaseWeapon = w as BaseWeapon
			weapon.player = self
			weapon.enemies = enemies


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
		take_damage(maxf(0.0, worst - armor) * delta)


func take_damage(amount: float) -> void:
	if hp <= 0.0 or invulnerable:
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
	xp += amount * xp_mult
	var leveled: bool = false
	while xp >= xp_to_next:
		xp -= xp_to_next
		level += 1
		xp_to_next = GameState.xp_to_next(level)
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


## 명령서 한 장을 실제로 적용한다. 수치는 전부 UpgradeData에서 온다.
func apply_upgrade(upgrade: UpgradeData) -> void:
	if upgrade == null:
		return
	upgrade_levels[upgrade.id] = int(upgrade_levels.get(upgrade.id, 0)) + 1

	match upgrade.kind:
		UpgradeData.Kind.WEAPON_GRANT, UpgradeData.Kind.WEAPON_LEVEL:
			if upgrade.weapon != null:
				add_weapon(upgrade.weapon)
		_:
			speed_mult += upgrade.speed_mult_add
			damage_mult += upgrade.damage_mult_add
			cooldown_mult = maxf(0.2, cooldown_mult + upgrade.cooldown_mult_add)
			magnet_mult += upgrade.magnet_mult_add
			xp_mult += upgrade.xp_mult_add
			armor += upgrade.armor_add
			luck += upgrade.luck_add
			if upgrade.max_hp_add != 0.0:
				max_hp += upgrade.max_hp_add
				heal(upgrade.max_hp_add)
			if upgrade.heal_on_pick > 0.0:
				heal(upgrade.heal_on_pick)

	EventBus.upgrade_picked.emit(upgrade.id)


func _draw() -> void:
	# 화이트박스: 몸통 원 + 밝은 하이라이트. 기획서 3.2 — 플레이어가 화면에서 가장 밝다.
	draw_circle(Vector2.ZERO, body_radius, body_color)
	draw_arc(Vector2.ZERO, body_radius, 0.0, TAU, 24, Color(0.1, 0.12, 0.08), 3.0, true)
	draw_circle(Vector2(-body_radius * 0.3, -body_radius * 0.35), body_radius * 0.22, COLOR_HIGHLIGHT)
