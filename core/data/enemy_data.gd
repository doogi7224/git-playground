extends Resource
class_name EnemyData
## 적 1종의 정의. 수치는 전부 여기 있고 GDScript에는 없다. (CLAUDE.md 규칙 4)

@export var id: StringName = &""
@export var display_name: String = ""

@export_group("전투")
@export var max_hp: float = 20.0
@export var contact_dps: float = 5.0
@export var xp: float = 1.0

@export_group("이동/크기")
@export var speed: float = 130.0
@export var radius: float = 13.0

@export_group("표시")
## 기획서 3.2: 적은 갈색·회색 계열. 시안/금색은 플레이어 전용이라 절대 쓰지 않는다.
@export var color: Color = Color("#8A7B5E")
## M2에서 텍스처 아틀라스의 몇 번째 칸을 쓸지. 셰이더에 CUSTOM_DATA로 넘어간다.
@export var atlas_index: int = 0
