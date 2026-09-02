extends Resource
class_name UnlockData
## 캐릭터/맵 해금 1건.
##
## 두 갈래가 있다.
##   - 조건형: 표창장처럼 누적 통계가 조건을 넘으면 저절로 열린다 (price = 0).
##   - 구매형: 조건을 넘긴 뒤 월급을 내야 열린다 (price > 0).
## 둘 다 아닌 것(condition = NONE, price = 0)은 처음부터 열려 있다.

enum Target { CHARACTER, MAP }

@export var id: StringName = &""
@export var target: Target = Target.CHARACTER
## data/characters/*.tres 또는 data/maps/*.tres 의 id
@export var target_id: StringName = &""
@export var display_name: String = ""
@export_multiline var description: String = ""
@export var condition: MetaCondition = null
## 0 이면 조건만 채우면 열린다. 0보다 크면 조건을 채운 뒤 월급으로 산다.
@export var price: int = 0


func is_free() -> bool:
	return price <= 0


## 조건을 채웠는지. 조건이 없으면 항상 참.
func condition_met(stats: Dictionary) -> bool:
	return condition == null or condition.is_met(stats)
