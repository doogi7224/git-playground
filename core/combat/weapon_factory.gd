extends RefCounted
class_name WeaponFactory
## WeaponData.behavior 를 보고 알맞은 무기 스크립트를 붙인 노드를 만든다.
## 런 시작 전에만 부른다 — 런타임 instantiate 금지 규칙은 전투 중 생성물을 말한다.

const SCRIPTS: Dictionary = {
	WeaponData.Behavior.MELEE_ARC: preload("res://weapons/melee_arc_weapon.gd"),
}


static func create(data: WeaponData) -> BaseWeapon:
	if data == null:
		return null
	var script: Script = SCRIPTS.get(data.behavior, null)
	if script == null:
		push_error("구현되지 않은 무기 동작: %s (%s)" % [data.behavior, data.id])
		return null
	var node := Node2D.new()
	node.set_script(script)
	var weapon: BaseWeapon = node as BaseWeapon
	weapon.data = data
	weapon.name = String(data.id)
	return weapon
