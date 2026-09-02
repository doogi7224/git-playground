extends Resource
class_name BossData
## 보스 1기의 정의. 기획서 5.3 보스 4종.
##
## 몸통 능력치는 EnemyData 가 갖고(그래야 모든 무기가 공짜로 때린다),
## 여기에는 "어떻게 싸우는가"만 있다.

enum Pattern {
	CHARGER,   ## 돌진 + 소환        — 대대장 순시
	BARRAGE,   ## 서류 탄막          — 사단 검열관
	FIELD,     ## 둔화 필드 + PT 충격파 — 유격 3주차
	FINALE,    ## 페이크 승리 후 2페이즈 — 전역 연기 통보서
}

@export var id: StringName = &""
@export var display_name: String = ""
@export var enemy: EnemyData = null
@export var pattern: Pattern = Pattern.CHARGER
## 소환할 잡몹. 비우면 그 맵 웨이브의 첫 적을 쓴다.
@export var minion: StringName = &""

@export_group("공통")
@export var approach_speed: float = 108.0
@export var approach_time: float = 3.4

@export_group("CHARGER")
@export var telegraph_time: float = 0.75
@export var charge_speed: float = 780.0
@export var charge_time: float = 0.62
@export var summon_count: int = 14

@export_group("BARRAGE")
@export var bullets_per_volley: int = 14
@export var bullet_speed: float = 240.0
@export var bullet_dps: float = 18.0
@export var bullet_radius: float = 16.0
@export var volley_interval: float = 1.6

@export_group("FIELD")
## 보스를 따라다니는 둔화 장판. slow 0.45 = 이속 45%
@export var field_radius: float = 300.0
@export var field_slow: float = 0.45
@export var field_dps: float = 4.0
@export var shockwave_interval: float = 3.2
@export var shockwave_dps: float = 22.0
@export var shockwave_grow: float = 420.0

@export_group("FINALE")
## 이 비율 아래로 떨어지면 한 번 쓰러진 척한다 (기획서 5.3 "페이크 승리")
@export var fake_death_hp_ratio: float = 0.5
@export var fake_death_time: float = 2.2
