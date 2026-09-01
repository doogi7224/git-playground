extends Resource
class_name UpgradeData
## 레벨업 때 내미는 「병력 운용 명령서」 1장.

enum Kind {
	PASSIVE,        ## 스탯 보정
	WEAPON_GRANT,   ## 새 무기 획득
	WEAPON_LEVEL,   ## 보유 무기 레벨업
}

@export var id: StringName = &""
@export var title: String = ""
@export_multiline var description: String = ""
@export var kind: Kind = Kind.PASSIVE
@export var max_level: int = 5
@export var weight: float = 1.0

@export_group("WEAPON_GRANT / WEAPON_LEVEL")
@export var weapon: WeaponData = null

@export_group("PASSIVE — 레벨당 가산")
@export var speed_mult_add: float = 0.0
@export var damage_mult_add: float = 0.0
@export var cooldown_mult_add: float = 0.0     ## 음수면 쿨감
@export var magnet_mult_add: float = 0.0
@export var max_hp_add: float = 0.0
@export var armor_add: float = 0.0
@export var xp_mult_add: float = 0.0
@export var luck_add: float = 0.0
@export var heal_on_pick: float = 0.0
@export var projectiles_add: int = 0      ## 탄띠 — 투사체 발수
@export var regen_add: float = 0.0        ## 건빵 — 초당 회복
