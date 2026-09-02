extends Resource
class_name PxUpgradeData
## PX(매점) 상점 항목 1종. 월급으로 사는 영구 강화.
##
## 런 중에 먹는 명령서(UpgradeData)와 달리 한 번 사면 계속 남는다.
## 적용은 Player.setup 에서 캐릭터 기본 스탯 위에 한 번만 얹는다.

enum Apply {
	ADD,    ## 값을 더한다 (체력 +8)
	MULT,   ## 배율에 더한다 (이동속도 ×(1 + 0.04×레벨))
}

@export var id: StringName = &""
@export var display_name: String = ""
@export_multiline var description: String = ""

@export_group("효과")
## Player 의 필드 이름. max_hp / move_speed / damage_mult / cooldown_mult /
## magnet_mult / armor / luck / regen / crit_chance / revives / xp_mult
@export var stat: StringName = &""
@export var apply: Apply = Apply.ADD
@export var per_level: float = 0.0
@export var max_level: int = 5

@export_group("가격")
@export var base_cost: int = 100
@export var cost_growth: float = 1.6


## level(현재 레벨)에서 다음 레벨로 올리는 값. 최대면 -1.
func cost_for(level: int) -> int:
	if level >= max_level:
		return -1
	var raw: float = float(base_cost) * pow(cost_growth, float(level))
	# 10원 단위로 반올림 — 군대 월급에 1원 단위는 안 어울린다.
	return int(round(raw / 10.0)) * 10


## 이 레벨에서의 총 효과량. MULT 는 배율 그대로(1.0 = 효과 없음).
func value_at(level: int) -> float:
	var lv: float = float(clampi(level, 0, max_level))
	if apply == Apply.MULT:
		return 1.0 + per_level * lv
	return per_level * lv


## "이동속도 +12%" / "체력 +24" 처럼 사람이 읽는 문장.
func describe_level(level: int) -> String:
	if level <= 0:
		return MetaUI.t("미구매")
	if apply == Apply.MULT:
		return "%+.0f%%" % ((value_at(level) - 1.0) * 100.0)
	return "%+.4g" % value_at(level)
