extends RefCounted
class_name EvolutionRules
## 무기 진화 판정. 기획서 5.1 — "무기 Lv8 + 지정 패시브 보유 시 보물상자에서 진화".
##
## 조건은 전부 WeaponData(.tres)에 적혀 있다.
##   evolves_into      : 진화하면 뭐가 되는가
##   evolution_passive : 어떤 패시브를 갖고 있어야 하는가

const WEAPON_DIR: String = "res://data/weapons/"


static func is_ready(weapon: BaseWeapon, upgrade_levels: Dictionary) -> bool:
	if weapon == null or weapon.data == null:
		return false
	var d: WeaponData = weapon.data
	if d.evolves_into == &"":
		return false
	if weapon.level < d.max_level:
		return false
	if d.evolution_passive != &"" and int(upgrade_levels.get(d.evolution_passive, 0)) <= 0:
		return false
	return true


## 진화 가능하면 진화형 WeaponData를, 아니면 null.
static func evolution_for(weapon: BaseWeapon, upgrade_levels: Dictionary) -> WeaponData:
	if not is_ready(weapon, upgrade_levels):
		return null
	return load_weapon(weapon.data.evolves_into)


static func load_weapon(id: StringName) -> WeaponData:
	var path: String = "%s%s.tres" % [WEAPON_DIR, id]
	if not ResourceLoader.exists(path):
		push_error("진화 대상 무기 파일이 없다: %s" % path)
		return null
	return load(path) as WeaponData
