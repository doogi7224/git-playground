extends Node2D
## 연병장. 씬 안의 조각들을 서로 연결해 주는 역할만 한다.
## 어떤 적이 나오고 어떤 웨이브인지는 전부 MapData(.tres)가 정한다. 여기엔 수치가 없다.

const ENEMY_CAPACITY: int = 4096

@export var map: MapData = null
@export var character: CharacterData = null
@export var upgrade_table: UpgradeTable = null

@onready var enemies: EnemyManager = $Enemies
@onready var pickups: PickupManager = $Pickups
@onready var player: Player = $Player
@onready var director: SpawnDirector = $SpawnDirector
@onready var level_up: Control = $UI/LevelUpScreen
@onready var debug_overlay: Control = $UI/DebugOverlay
@onready var ground: Node2D = $Ground


func _ready() -> void:
	assert(map != null, "Arena에 MapData가 없다")
	assert(character != null, "Arena에 CharacterData가 없다")

	enemies.set_capacity(ENEMY_CAPACITY)
	enemies.register_map(map)

	player.setup(enemies, character)
	pickups.collected.connect(player.add_xp)
	director.setup(enemies, player, map.wave_table)

	level_up.player = player
	level_up.upgrade_table = upgrade_table
	debug_overlay.enemies = enemies
	debug_overlay.pickups = pickups
	ground.line_color = map.ground_color

	GameState.start_run(character.id)


func _physics_process(_delta: float) -> void:
	# 부모가 자식보다 먼저 돌기 때문에, 여기서 넘긴 목표 위치를 같은 프레임에 쓴다.
	var p: Vector2 = player.global_position
	enemies.target_position = p
	pickups.target_position = p
	pickups.magnet_radius = player.effective_magnet_radius()
