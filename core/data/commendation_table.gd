extends Resource
class_name CommendationTable
## 표창장 전체 목록.

@export var commendations: Array[CommendationData] = []


func find(id: StringName) -> CommendationData:
	for c: CommendationData in commendations:
		if c != null and c.id == id:
			return c
	return null


## 누적 통계로 새로 조건을 채운 표창장 id 를 고른다. 이미 받은 건 제외.
func newly_earned(stats: Dictionary, owned: Array) -> Array[StringName]:
	var result: Array[StringName] = []
	for c: CommendationData in commendations:
		if c == null or c.condition == null:
			continue
		if owned.has(String(c.id)):
			continue
		if c.condition.is_met(stats):
			result.append(c.id)
	return result
