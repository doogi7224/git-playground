extends Resource
class_name CharacterData
## 플레이어 캐릭터 1종. 기획서 5.5.

@export var id: StringName = &""
@export var display_name: String = ""
@export_multiline var description: String = ""

@export_group("기본 스탯")
@export var max_hp: float = 100.0
@export var move_speed: float = 200.0
@export var body_radius: float = 14.0
@export var magnet_radius: float = 90.0
@export var damage_mult: float = 1.0
@export var color: Color = Color("#B7C77A")

@export_group("시작 장비")
@export var starting_weapon: WeaponData = null
