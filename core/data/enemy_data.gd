extends Resource
class_name EnemyData
## 적 1종의 정의. 수치는 전부 여기 있고 GDScript에는 없다. (CLAUDE.md 규칙 4)

@export var id: StringName = &""
@export var display_name: String = ""

@export_group("전투")
@export var max_hp: float = 20.0
@export var contact_dps: float = 5.0
@export var xp: float = 1.0
## 중형/장판형 적. 닿지 않아도 반경 안에 있으면 초당 이만큼 아프다 (CS가스 구름, 눈보라).
@export var aura_dps: float = 0.0
@export var aura_radius: float = 0.0
## 중형 여부. HUD 표시나 드랍 판정에 쓴다.
@export var is_elite: bool = false

@export_group("이동/크기")
@export var speed: float = 130.0
@export var radius: float = 13.0

@export_group("표시")
## 기획서 3.2: 적은 갈색·회색 계열. 시안/금색은 플레이어 전용이라 절대 쓰지 않는다.
@export var color: Color = Color("#8A7B5E")
## 아틀라스 안에서 쓸 그림 이름. 비우면 id 를 그대로 쓴다.
## 아트 파이프라인이 파일 이름을 그대로 이름으로 쓰므로, art/raw/shovel_mob.png 면 자동으로 붙는다.
@export var sprite: StringName = &""
## 그림은 보통 판정 원보다 크다. 판정 반경 대비 몇 배로 그릴지.
@export var sprite_scale: float = 2.2
## 아틀라스가 없을 때(화이트박스) 쓰는 색.
@export var atlas_index: int = 0


func sprite_name() -> StringName:
	return id if sprite == &"" else sprite
