extends Resource
class_name MapData
## 맵 1종. 기획서 5.6.

@export var id: StringName = &""
@export var display_name: String = ""
## 이 맵에 나오는 적 전부. EnemyManager가 시작할 때 통째로 등록한다.
@export var enemies: Array[EnemyData] = []
@export var wave_table: WaveTable = null
## 이 맵에 나오는 보스. WaveData.boss_id 가 여기서 찾아진다.
@export var bosses: Array[BossData] = []
## 이 맵의 적 그림. 없으면 화이트박스 도형으로 그린다 — 아트가 없어도 게임은 돈다.
@export var sprite_atlas: SpriteAtlas = null


func boss_by_id(id: StringName) -> BossData:
	for b: BossData in bosses:
		if b != null and b.id == id:
			return b
	return null


@export_group("분위기")
## 기획서 3.3: CanvasModulate로 맵별 전역 톤. 야간 위병소는 짙은 남색.
@export var ambient_tint: Color = Color(1, 1, 1, 1)
@export var ground_color: Color = Color("#3E4A32")
