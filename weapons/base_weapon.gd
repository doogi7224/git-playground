extends Node2D
class_name BaseWeapon
## 모든 무기의 공통 뼈대. 수치는 여기 없고 전부 WeaponData(.tres)에서 온다.
## (CLAUDE.md 규칙 4)

@export var data: WeaponData = null

var level: int = 1
var player: Player = null
var enemies: EnemyManager = null

var _cd: float = 0.0


func _ready() -> void:
	if data != null:
		name = String(data.id)


func weapon_id() -> StringName:
	return data.id if data != null else &""


func current_cooldown() -> float:
	if data == null:
		return 1.0
	var mult: float = player.cooldown_mult if player != null else 1.0
	return maxf(0.05, data.cooldown_at(level) * mult)


func current_damage() -> float:
	if data == null:
		return 0.0
	var mult: float = player.damage_mult if player != null else 1.0
	return data.damage_at(level) * mult


## 한 번의 타격 = 기본 피해 + 크리티컬 판정.
## 크리티컬은 데미지 넘버가 1.5배 금색으로 뜨고 히트스톱을 부른다 (기획서 3.2 / 3.3).
func roll_hit() -> Array:
	var damage: float = current_damage()
	if player == null:
		return [damage, false]
	if randf() < player.crit_chance:
		return [damage * player.crit_mult, true]
	return [damage, false]


func current_reach() -> float:
	return data.reach_at(level) if data != null else 0.0


func level_up() -> bool:
	if data == null or level >= data.max_level:
		return false
	level += 1
	return true


func _physics_process(delta: float) -> void:
	if data == null or GameState.phase != GameState.Phase.PLAYING:
		return
	_cd -= delta
	if _cd <= 0.0:
		_cd = current_cooldown()
		_fire()


## 하위 무기가 구현한다.
func _fire() -> void:
	pass
