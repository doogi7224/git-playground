extends Resource
class_name ProgressionData
## 한 판의 길이, D-카운트, 경험치 곡선, 계급표. 기획서 1장.

@export var run_duration_sec: float = 1200.0   ## 20분
@export var total_days: int = 100              ## D-100 → D-DAY

@export_group("경험치 곡선")
## xp_to_next(lv) = base + per*(lv-1) + quad*(lv-1)^2
##
## ★ quad 는 0 이다. 0이 아닌 값을 넣기 전에 반드시 tools/playthrough.sh 로 재 볼 것.
##
## 한 번 0.26 을 넣었다가 되돌렸다. 20분 완주 시 Lv.237 이 나오는데 명령서로 실제
## 뽑을 수 있는 횟수는 124회뿐이라 "그 위 진급이 전부 빈 화면" 이라고 봤다.
## tools/balance.sh 로 계수를 맞춰 Lv.125 에 착지시켰더니, 자동 플레이 완주율이
## 3판 중 2판에서 3판 중 0판으로 떨어졌다.
##
## 예산 모델이 놓친 게 있었다. 레벨이 힘이고 힘이 생존이고 생존이 짬이다.
## "20분을 버텼다면 몇 레벨인가" 만 계산했지, 레벨을 늦추면 20분을 못 버틴다는
## 되먹임을 안 넣었다. quad=0.26 은 Lv.30 에서 이미 요구치를 1.9배로 만든다 --
## 후반만 누르는 게 아니라 중반을 같이 눌러서, 최대 강화에 닿기 전에 죽는다.
##
## 그리고 애초에 빈 진급은 게임을 멈추지 않는다. roll() 이 비면 화면이 즉시 닫힌다
## (level_up_screen._show_next). 레벨 숫자가 커질 뿐 플레이는 안 끊긴다 -- 즉
## 고치려던 건 연출 문제였고, 고치려다 게임을 망가뜨렸다.
@export var xp_base: float = 10.0
@export var xp_per_level: float = 8.0
@export var xp_quadratic: float = 0.0
## 적 몇 마리당 짬 오브 하나를 떨구는가. 총 경험치는 안 바뀌고 오브 개수만 줄어든다.
## 1 이면 마리마다 하나 -- 7분이면 300개가 깔려 화면을 덮는다.
@export var xp_kills_per_orb: int = 4

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
	var n: float = float(level - 1)
	return xp_base + xp_per_level * n + xp_quadratic * n * n


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
