extends Resource
class_name PxShopTable
## PX 상점 전체 목록. UpgradeTable 과 같은 이유로 디렉터리 스캔을 하지 않는다.

@export var items: Array[PxUpgradeData] = []


func find(id: StringName) -> PxUpgradeData:
	for item: PxUpgradeData in items:
		if item != null and item.id == id:
			return item
	return null


## 구매 레벨 딕셔너리({id: level})로 한 스탯의 ADD 합계를 구한다.
func total_add(stat: StringName, levels: Dictionary) -> float:
	var sum: float = 0.0
	for item: PxUpgradeData in items:
		if item == null or item.stat != stat or item.apply != PxUpgradeData.Apply.ADD:
			continue
		sum += item.value_at(int(levels.get(String(item.id), 0)))
	return sum


## 같은 스탯의 MULT 를 전부 곱한다. 없으면 1.0.
func total_mult(stat: StringName, levels: Dictionary) -> float:
	var mult: float = 1.0
	for item: PxUpgradeData in items:
		if item == null or item.stat != stat or item.apply != PxUpgradeData.Apply.MULT:
			continue
		mult *= item.value_at(int(levels.get(String(item.id), 0)))
	return mult
