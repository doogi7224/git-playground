extends Node2D
class_name BaseWeapon
## 모든 무기의 공통 뼈대. 수치는 여기에 쓰지 말고 .tres에서 주입한다(프롬프트 3).

@export var weapon_id: StringName = &""
@export var display_name: String = ""
@export var cooldown: float = 1.0
@export var base_damage: float = 10.0

var level: int = 1
var player: Player = null
var enemies: EnemyManager = null

var _cd: float = 0.0


func _physics_process(delta: float) -> void:
	if GameState.phase != GameState.Phase.PLAYING:
		return
	_cd -= delta
	if _cd <= 0.0:
		_cd = cooldown
		_fire()


func damage_per_hit() -> float:
	var mult: float = 1.0
	if player != null:
		mult = player.damage_mult
	return base_damage * mult


## 하위 무기가 구현한다.
func _fire() -> void:
	pass
