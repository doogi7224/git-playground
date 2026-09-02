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
@export var cooldown_mult: float = 1.0   ## 1보다 작으면 공격이 빠르다
@export var regen: float = 0.0           ## 초당 회복
@export var crit_chance: float = 0.10
@export var color: Color = Color("#B7C77A")

@export_group("겉모습")
## 컷아웃 리깅 파츠 텍스처. {&"Head": ..., &"Torso": ...}
## 비워두면 리깅 템플릿의 플레이스홀더 폴리곤이 그대로 보인다 — 아트가 없어도 게임은 돈다.
@export var parts: Dictionary = {}

@export_group("시작 장비")
@export var starting_weapon: WeaponData = null
