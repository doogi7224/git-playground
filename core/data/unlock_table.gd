extends Resource
class_name UnlockTable
## 해금 전체 목록.

@export var unlocks: Array[UnlockData] = []


func find(id: StringName) -> UnlockData:
	for u: UnlockData in unlocks:
		if u != null and u.id == id:
			return u
	return null


func for_target(target: UnlockData.Target, target_id: StringName) -> UnlockData:
	for u: UnlockData in unlocks:
		if u != null and u.target == target and u.target_id == target_id:
			return u
	return null


## 조건만 채우면 열리는(무료) 해금 중 아직 안 열린 것을 고른다.
func newly_opened(stats: Dictionary, unlocked_characters: Array,
		unlocked_maps: Array) -> Array[UnlockData]:
	var result: Array[UnlockData] = []
	for u: UnlockData in unlocks:
		if u == null or not u.is_free():
			continue
		var owned: Array = unlocked_characters if u.target == UnlockData.Target.CHARACTER else unlocked_maps
		if owned.has(String(u.target_id)):
			continue
		if u.condition_met(stats):
			result.append(u)
	return result
