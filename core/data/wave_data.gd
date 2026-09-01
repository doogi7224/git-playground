extends Resource
class_name WaveData
## 1분 구간 하나. 기획서 5.4 웨이브 디렉터.

enum Pattern {
	RING,     ## 화면 밖 링에서 사방
	WALL,     ## 한쪽 벽처럼 밀려옴
	PILLAR,   ## 기둥 형태로 몇 줄기
}

@export var minute: int = 0
@export var enemy_ids: Array[StringName] = []
@export var spawns_per_second: float = 1.5
@export var pattern: Pattern = Pattern.RING
@export var elite_chance: float = 0.0
## 이 구간 시작에 등장하는 보스. 없으면 빈 값.
@export var boss_id: StringName = &""
