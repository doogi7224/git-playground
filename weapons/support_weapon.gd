extends BaseWeapon
class_name SupportWeapon
## 주기적으로 회복 오브를 만든다. 위생병, 의무후송 헬기. 기획서 5.1 #8.
##
## 오브는 PickupManager 가 관리한다 — 개별 Node 를 만들지 않는다(CLAUDE.md 규칙 1).
## 진화형(의무후송 헬기)은 reach 를 0으로 두면 그 자리에서 바로 전체 회복이 된다.

var pickups: PickupManager = null


func _fire() -> void:
	if player == null or data == null:
		return
	var heal: float = data.heal_amount
	if heal <= 0.0:
		return

	if current_reach() <= 0.0:
		# 즉시 회복 (의무후송 헬기)
		player.heal(heal)
		EventBus.screen_shake_requested.emit(1.0, 0.1)
		return

	if pickups == null:
		return
	var angle: float = randf() * TAU
	var spot: Vector2 = player.global_position + Vector2(cos(angle), sin(angle)) * current_reach()
	pickups.spawn_heal(spot, heal)
