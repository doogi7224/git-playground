extends Node2D
class_name Player
## 화이트박스 플레이어. CharacterBody2D를 쓰지 않는다 — 물리 엔진 대신 직접 계산한다.
## (CLAUDE.md 규칙 2. M0에는 벽이 없고, 벽이 생겨도 타일 기반으로 직접 푼다.)
##
## 기본 스탯은 CharacterData(.tres), 경험치 곡선은 ProgressionData(.tres)에서 온다.

const COLOR_HIGHLIGHT: Color = Color("#FFFFFF")
## 피격 연출 최소 간격(초). 접촉 피해가 매 프레임 들어와도 연출은 이 간격으로만.
const HIT_ANIM_INTERVAL: float = 0.35

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
var crit_chance: float = 0.10
var crit_mult: float = 2.0
var extra_projectiles: int = 0   ## 탄띠
var regen: float = 0.0           ## 건빵 — 초당 회복

var hp: float = 100.0
## 스트레스 테스트/디버그용. 켜면 피해를 받지 않는다.
var invulnerable: bool = false
var facing: Vector2 = Vector2.RIGHT
var level: int = 1
var xp: float = 0.0
var xp_to_next: float = 10.0

## 고른 업그레이드/무기 레벨. UpgradeTable이 최대 레벨 체크에 쓴다.
var upgrade_levels: Dictionary = {}

var _hit_anim_cooldown: float = 0.0

var enemies: EnemyManager = null
var projectiles: ProjectileManager = null
var areas: AreaManager = null

@onready var weapons: Node2D = $Weapons
@onready var rig: RiggedCharacter = $Rig


func _ready() -> void:
	xp_to_next = GameState.xp_to_next(level)
	queue_redraw()


## 런 시작 전에 아레나가 부른다. 캐릭터 스탯을 싣고 시작 무기를 만든다.
func setup(p_enemies: EnemyManager, p_character: CharacterData,
		p_projectiles: ProjectileManager = null, p_areas: AreaManager = null) -> void:
	enemies = p_enemies
	projectiles = p_projectiles
	areas = p_areas
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
	_dress_rig()
	queue_redraw()


## 캐릭터 파츠 텍스처를 리깅 슬롯에 끼운다. 없으면 템플릿 플레이스홀더가 그대로 보인다.
func _dress_rig() -> void:
	if rig == null or character == null:
		return
	for part: Variant in character.parts:
		rig.set_part(part, character.parts[part])


func add_weapon(data: WeaponData) -> BaseWeapon:
	var existing: BaseWeapon = find_weapon(data.id)
	if existing != null:
		existing.level_up()
		return existing
	var weapon: BaseWeapon = WeaponFactory.create(data)
	if weapon == null:
		return null
	weapons.add_child(weapon)
	_bind(weapon)
	return weapon


func find_weapon(id: StringName) -> BaseWeapon:
	for w: Node in weapons.get_children():
		if w is BaseWeapon and (w as BaseWeapon).weapon_id() == id:
			return w as BaseWeapon
	return null


func _bind_weapons() -> void:
	for w: Node in weapons.get_children():
		if w is BaseWeapon:
			_bind(w as BaseWeapon)


## 무기가 필요로 하는 매니저를 꽂아준다. 무기는 자기가 뭘 쓰는지만 알면 된다.
func _bind(weapon: BaseWeapon) -> void:
	weapon.player = self
	weapon.enemies = enemies
	if weapon is ProjectileWeapon:
		(weapon as ProjectileWeapon).projectiles = projectiles
	elif weapon is ThrownWeapon:
		(weapon as ThrownWeapon).projectiles = projectiles
	elif weapon is GroundAreaWeapon:
		(weapon as GroundAreaWeapon).areas = areas


## 보유 무기 중 진화 조건을 만족한 것을 진화시킨다. 성공하면 무기 id, 없으면 빈 값.
func try_evolve() -> StringName:
	for w: Node in weapons.get_children():
		if not (w is BaseWeapon):
			continue
		var weapon: BaseWeapon = w as BaseWeapon
		var evolved: WeaponData = EvolutionRules.evolution_for(weapon, upgrade_levels)
		if evolved == null:
			continue
		var from_id: StringName = weapon.weapon_id()
		weapons.remove_child(weapon)
		weapon.queue_free()
		var new_weapon: BaseWeapon = add_weapon(evolved)
		if new_weapon != null:
			new_weapon.level = 1
		EventBus.weapon_evolved.emit(from_id, evolved.id)
		return evolved.id
	return &""


func weapon_ids() -> Array[StringName]:
	var ids: Array[StringName] = []
	for w: Node in weapons.get_children():
		if w is BaseWeapon:
			ids.append((w as BaseWeapon).weapon_id())
	return ids


func effective_magnet_radius() -> float:
	return magnet_radius * magnet_mult


func _physics_process(delta: float) -> void:
	if GameState.phase != GameState.Phase.PLAYING:
		return
	_move(delta)
	_contact_damage(delta)
	if regen > 0.0 and hp < max_hp:
		heal(regen * delta)
	_hit_anim_cooldown = maxf(0.0, _hit_anim_cooldown - delta)


func _move(delta: float) -> void:
	var dir: Vector2 = Input.get_vector(&"move_left", &"move_right", &"move_up", &"move_down")
	if dir.length_squared() > 0.0:
		dir = dir.normalized()
		facing = dir
		position += dir * move_speed * speed_mult * delta
		if rig != null:
			rig.play_walk()
			rig.set_facing(dir.x)
	elif rig != null:
		rig.play_idle()


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
	# 접촉 피해는 매 프레임 들어온다. 연출은 그 속도로 재생하면 안 된다.
	if rig != null and _hit_anim_cooldown <= 0.0:
		_hit_anim_cooldown = HIT_ANIM_INTERVAL
		rig.play_hit()
	if hp <= 0.0:
		if rig != null:
			rig.play_die()
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
	match upgrade.kind:
		UpgradeData.Kind.WEAPON_GRANT, UpgradeData.Kind.WEAPON_LEVEL:
			if upgrade.weapon != null:
				var w: BaseWeapon = add_weapon(upgrade.weapon)
				# 뽑은 횟수가 아니라 실제 무기 레벨을 기록한다. 시작 무기는 이미 Lv1이라
				# 횟수로 세면 8렙에서 한 장 더 나오고 그 장은 아무 일도 안 한다.
				upgrade_levels[upgrade.id] = w.level if w != null else 1
		_:
			upgrade_levels[upgrade.id] = int(upgrade_levels.get(upgrade.id, 0)) + 1
			speed_mult += upgrade.speed_mult_add
			damage_mult += upgrade.damage_mult_add
			cooldown_mult = maxf(0.2, cooldown_mult + upgrade.cooldown_mult_add)
			magnet_mult += upgrade.magnet_mult_add
			xp_mult += upgrade.xp_mult_add
			armor += upgrade.armor_add
			luck += upgrade.luck_add
			# 휴가증(행운)은 크리티컬 확률로도 들어간다
			crit_chance = minf(0.85, crit_chance + upgrade.luck_add * 0.5)
			extra_projectiles += upgrade.projectiles_add
			regen += upgrade.regen_add
			if upgrade.max_hp_add != 0.0:
				max_hp += upgrade.max_hp_add
				heal(upgrade.max_hp_add)
			if upgrade.heal_on_pick > 0.0:
				heal(upgrade.heal_on_pick)

	EventBus.upgrade_picked.emit(upgrade.id)


## 무기가 발사할 때 부른다.
func on_attack() -> void:
	if rig != null:
		rig.play_attack()


func _draw() -> void:
	# 발밑 그림자. 몸통은 리깅 캐릭터가 그린다.
	# 기획서 3.2 — 플레이어는 항상 화면에서 가장 밝아야 하므로 그림자는 옅게만.
	draw_circle(Vector2(0, 4), body_radius * 0.9, Color(0.06, 0.07, 0.05, 0.35))
