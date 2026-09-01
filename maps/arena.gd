extends Node2D
## M0 화이트박스 연병장. 씬 안의 조각들을 서로 연결해 주는 역할만 한다.
## 여기서 하드코딩한 수치는 프롬프트 3에서 전부 .tres로 빠진다.

const ENEMY_CAPACITY: int = 4096

@onready var enemies: EnemyManager = $Enemies
@onready var pickups: PickupManager = $Pickups
@onready var player: Player = $Player
@onready var director: SpawnDirector = $SpawnDirector
@onready var level_up: Control = $UI/LevelUpScreen
@onready var debug_overlay: Control = $UI/DebugOverlay


func _ready() -> void:
	enemies.set_capacity(ENEMY_CAPACITY)

	# M0 적 1종: '삽'. (기획서 5.3 잡몹 목록의 첫 항목)
	var mob: int = enemies.register_type(
		&"shovel",      # id
		130.0,          # 이동속도
		20.0,           # 체력
		13.0,           # 반경
		5.0,            # 접촉 초당 피해
		1.0,            # 드랍 '짬'
		Color("#8A7B5E")  # 갈색 계열 (기획서 3.2: 적은 시안/금색 금지)
	)

	player.setup(enemies)
	pickups.collected.connect(player.add_xp)
	director.setup(enemies, player, mob)
	level_up.player = player
	debug_overlay.enemies = enemies
	debug_overlay.pickups = pickups

	GameState.start_run(&"kim_private")


func _physics_process(_delta: float) -> void:
	# 부모가 자식보다 먼저 돌기 때문에, 여기서 넘긴 목표 위치를 같은 프레임에 쓴다.
	var p: Vector2 = player.global_position
	enemies.target_position = p
	pickups.target_position = p
	pickups.magnet_radius = player.effective_magnet_radius()
