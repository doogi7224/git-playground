extends Resource
class_name ProgressionData
## 한 판의 길이, D-카운트, 경험치 곡선, 계급표. 기획서 1장.

@export var run_duration_sec: float = 1200.0   ## 20분
@export var total_days: int = 100              ## D-100 → D-DAY

@export_group("경험치 곡선")
@export var xp_base: float = 10.0
@export var xp_per_level: float = 8.0

@export_group("진급 = 계급")
## [{level = 1, id = &"private_2", name = "이등병"}, ...] 형태.
## min_level 오름차순으로 두는 게 읽기 편하지만 순서에 의존하지는 않는다.
@export var ranks: Array[Dictionary] = []

@export_group("월급 (메타 화폐)")
## 한 판이 끝나면 아래 공식으로 월급이 나온다. 값은 전부 .tres 에 있다.
@export var salary_per_kill: float = 0.06
@export var salary_per_level: float = 4.0
@export var salary_per_minute: float = 12.0
@export var salary_boss_bonus: int = 150
@export var salary_victory_bonus: int = 500


func xp_to_next(level: int) -> float:
	return xp_base + xp_per_level * float(level - 1)


func rank_for_level(level: int) -> StringName:
	var result: StringName = &""
	var best: int = -1
	for entry: Dictionary in ranks:
		var min_level: int = int(entry.get("level", 1))
		if level >= min_level and min_level > best:
			best = min_level
			result = entry.get("id", &"")
	return result


func rank_name(rank_id: StringName) -> String:
	for entry: Dictionary in ranks:
		if entry.get("id", &"") == rank_id:
			return String(entry.get("name", ""))
	return ""


## 한 판의 결과(run_stats)로 월급을 계산한다. 10원 단위로 끊는다.
func salary_for(victory: bool, stats: Dictionary) -> int:
	var total: float = 0.0
	total += salary_per_kill * float(stats.get("kills", 0))
	total += salary_per_level * float(int(stats.get("level", 1)) - 1)
	total += salary_per_minute * (float(stats.get("survived_sec", 0.0)) / 60.0)
	total += float(salary_boss_bonus) * float(stats.get("boss_kills", 0))
	if victory:
		total += float(salary_victory_bonus)
	return maxi(0, int(round(total / 10.0)) * 10)
