extends Resource
class_name MetaCondition
## 해금·표창장이 공유하는 조건 한 줄. "누적 처치 3,000" 같은 것.
##
## 조건을 GDScript 에 if 문으로 박지 않는 이유는 CLAUDE.md 규칙 4 다.
## 새 표창장을 추가할 때 고쳐야 하는 건 .tres 하나뿐이어야 한다.

enum Kind {
	TOTAL_KILLS,        ## 누적 처치
	TOTAL_RUNS,         ## 누적 판 수
	RUNS_WON,           ## 전역 성공 횟수
	BEST_LEVEL,         ## 한 판 최고 진급
	BEST_SURVIVE_SEC,   ## 한 판 최장 생존(초)
	TOTAL_SALARY,       ## 누적 월급
	BOSS_KILLS,         ## 누적 보스 처치
	EVOLUTIONS,         ## 누적 무기 진화
	BEST_RUN_KILLS,     ## 한 판 최다 처치
	NONE,               ## 조건 없음 (처음부터 열려 있음)
}

## 통계 딕셔너리의 키. Kind 순서와 1:1 로 맞춘다.
## String 인 이유: 저장 파일을 왕복하면 StringName 키가 String 으로 바뀐다.
## Godot 4 의 Dictionary 는 &"a" 와 "a" 를 다른 키로 본다 — 섞으면 조용히 0이 나온다.
const STAT_KEYS: Array[String] = [
	"total_kills", "total_runs", "runs_won", "best_level",
	"best_survive_sec", "total_salary", "boss_kills", "evolutions",
	"best_run_kills", "",
]

const KIND_LABELS: Array[String] = [
	"누적 처치", "누적 복무", "전역 성공", "최고 진급",
	"최장 생존", "누적 월급", "보스 처치", "무기 진화",
	"한 판 최다 처치", "",
]

@export var kind: Kind = Kind.NONE
@export var threshold: float = 0.0


func stat_key() -> String:
	return STAT_KEYS[int(kind)]


## 누적 통계 딕셔너리로 현재 값을 읽는다.
func current(stats: Dictionary) -> float:
	if kind == Kind.NONE:
		return 0.0
	return float(stats.get(stat_key(), 0.0))


func is_met(stats: Dictionary) -> bool:
	if kind == Kind.NONE:
		return true
	return current(stats) >= threshold


## 0.0~1.0. UI 진행 바에 그대로 쓴다.
func ratio(stats: Dictionary) -> float:
	if kind == Kind.NONE or threshold <= 0.0:
		return 1.0
	return clampf(current(stats) / threshold, 0.0, 1.0)


## "누적 처치 3000" / "최장 생존 10분" 처럼 사람이 읽는 문장.
func describe() -> String:
	if kind == Kind.NONE:
		return "처음부터 열려 있음"
	if kind == Kind.BEST_SURVIVE_SEC:
		return "%s %d분" % [KIND_LABELS[int(kind)], int(threshold) / 60]
	return "%s %s" % [KIND_LABELS[int(kind)], MetaUI.grouped(int(threshold))]
