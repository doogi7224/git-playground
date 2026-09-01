extends RefCounted
class_name UpgradePool
## M0 더미 업그레이드 풀. 프롬프트 3에서 UpgradeData(.tres) 배열로 교체된다.

const OFFERS: int = 3

## 기획서 3.4: 레벨업 선택창은 「병력 운용 명령서」 3장. M0는 텍스트만.
const DUMMY: Array[Dictionary] = [
	{"id": &"speed_up", "title": "전투화 지급", "desc": "이동속도 +10%"},
	{"id": &"damage_up", "title": "삽날 연마", "desc": "공격력 +20%"},
	{"id": &"max_hp_up", "title": "건빵 보급", "desc": "최대 체력 +20"},
	{"id": &"magnet_up", "title": "무전기 수령", "desc": "'짬' 획득 범위 +25%"},
]


static func roll(count: int = OFFERS) -> Array[Dictionary]:
	var bag: Array[Dictionary] = DUMMY.duplicate()
	bag.shuffle()
	var picked: Array[Dictionary] = []
	for i in mini(count, bag.size()):
		picked.append(bag[i])
	return picked
