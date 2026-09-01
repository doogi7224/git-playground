extends Resource
class_name UpgradeTable
## 레벨업 때 뽑을 수 있는 명령서 전체 목록.
## 디렉터리를 런타임에 스캔하지 않는다 — 목록이 명시적이어야 실수로 빠지는 게 없다.

@export var upgrades: Array[UpgradeData] = []


## 이미 최대 레벨인 것과 제외 목록을 빼고 가중치로 count장 뽑는다.
func roll(count: int, levels: Dictionary, rng: RandomNumberGenerator = null) -> Array[UpgradeData]:
	var bag: Array[UpgradeData] = []
	var weights: Array[float] = []
	var total: float = 0.0
	for u: UpgradeData in upgrades:
		if u == null:
			continue
		if int(levels.get(u.id, 0)) >= u.max_level:
			continue
		bag.append(u)
		weights.append(u.weight)
		total += u.weight

	var picked: Array[UpgradeData] = []
	while picked.size() < count and not bag.is_empty():
		var roll_value: float = (rng.randf() if rng != null else randf()) * total
		var idx: int = 0
		for i in bag.size():
			roll_value -= weights[i]
			if roll_value <= 0.0:
				idx = i
				break
		picked.append(bag[idx])
		total -= weights[idx]
		bag.remove_at(idx)
		weights.remove_at(idx)
	return picked
