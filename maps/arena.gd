extends Node2D
## 연병장. 씬 안의 조각들을 서로 연결해 주는 역할만 한다.
## 어떤 적이 나오고 어떤 웨이브인지는 전부 MapData(.tres)가 정한다. 여기엔 수치가 없다.

const ENEMY_CAPACITY: int = 4096
const CHARACTER_PATH: String = "res://data/characters/%s.tres"
const MAP_PATH: String = "res://data/maps/%s.tres"

@export var map: MapData = null
@export var character: CharacterData = null
@export var upgrade_table: UpgradeTable = null

@onready var enemies: EnemyManager = $Enemies
@onready var pickups: PickupManager = $Pickups
@onready var areas: AreaManager = $Areas
@onready var projectiles: ProjectileManager = $Projectiles
@onready var hazards: HazardManager = $Hazards
@onready var bosses: Node2D = $Bosses
@onready var player: Player = $Player
@onready var director: SpawnDirector = $SpawnDirector
@onready var level_up: Control = $UI/LevelUpScreen
@onready var debug_overlay: Control = $UI/DebugOverlay
@onready var ground: Node2D = $Ground
@onready var canvas_modulate: CanvasModulate = $CanvasModulate
@onready var damage_numbers: DamageNumbers = $DamageNumbers


func _ready() -> void:
	_apply_saved_selection()
	assert(map != null, "Arena에 MapData가 없다")
	assert(character != null, "Arena에 CharacterData가 없다")

	enemies.set_capacity(ENEMY_CAPACITY)
	enemies.register_map(map)

	areas.enemies = enemies
	projectiles.enemies = enemies
	projectiles.areas = areas

	player.setup(enemies, character, projectiles, areas, pickups)
	pickups.collected.connect(player.add_xp)
	pickups.chest_collected.connect(_on_chest_collected)
	pickups.healed.connect(player.heal)
	hazards.player = player
	director.setup(enemies, player, map, pickups, bosses, hazards)

	level_up.player = player
	level_up.upgrade_table = upgrade_table
	debug_overlay.enemies = enemies
	debug_overlay.pickups = pickups
	ground.line_color = map.ground_color
	# 기획서 3.3: CanvasModulate 로 맵별 전역 톤. 야간 위병소는 짙은 남색이 된다.
	canvas_modulate.color = map.ambient_tint

	GameState.start_run(character.id)


## 메타 화면에서 고른 캐릭터/맵을 싣는다.
## 씬에 박아 둔 값은 기본값 겸 도구용 폴백이다 — tools/screenshot.sh 처럼
## 아레나를 직접 여는 경우 저장된 선택이 기본값과 같아서 결과가 달라지지 않는다.
## 파일 이름 = id 규약에 기대고 있고, tests/run_tests.gd 가 그걸 검사한다.
func _apply_saved_selection() -> void:
	var char_path: String = CHARACTER_PATH % SaveSystem.last_character()
	if ResourceLoader.exists(char_path):
		var picked: CharacterData = load(char_path) as CharacterData
		if picked != null:
			character = picked
	var map_path: String = MAP_PATH % SaveSystem.last_map()
	if ResourceLoader.exists(map_path):
		var picked_map: MapData = load(map_path) as MapData
		if picked_map != null:
			map = picked_map


## 보물상자 = 진화. 진화할 게 없으면 빈손으로 보내지 않고 회복 + 경험치로 바꿔준다.
func _on_chest_collected() -> void:
	var evolved: StringName = player.try_evolve()
	if evolved == &"":
		player.heal(player.max_hp * 0.35)
		player.add_xp(player.xp_to_next * 0.8)


func _physics_process(_delta: float) -> void:
	# 부모가 자식보다 먼저 돌기 때문에, 여기서 넘긴 목표 위치를 같은 프레임에 쓴다.
	var p: Vector2 = player.global_position
	enemies.target_position = p
	pickups.target_position = p
	pickups.magnet_radius = player.effective_magnet_radius()
