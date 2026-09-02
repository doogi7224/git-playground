extends Node
## BGM/SFX 재생과 보스 등장 시 오디오 덕킹.
##
## TODO(M2): 버스 레이아웃(Master/BGM/SFX/Voice) .tres 로드
## TODO(M5): 군가 리듬 × 신스웨이브 BGM, 보스전 나팔 모티프

const DUCK_DB: float = -6.0
const DUCK_TIME: float = 0.25

var master_volume: float = 1.0
var bgm_volume: float = 0.8
var sfx_volume: float = 1.0


func _ready() -> void:
	EventBus.boss_spawned.connect(_on_boss_spawned)
	EventBus.boss_died.connect(_on_boss_died)


func play_bgm(_track_id: StringName, _fade: float = 1.0) -> void:
	pass  ## TODO(M2)


func play_sfx(_sfx_id: StringName, _pos: Vector2 = Vector2.ZERO) -> void:
	pass  ## TODO(M2)


## 보스 등장 시 SFX를 낮추고 BGM을 강조한다. (기획서 3.5)
func duck_sfx(_enabled: bool) -> void:
	pass  ## TODO(M2)


func _on_boss_spawned(_boss_id: StringName, _display_name: String) -> void:
	duck_sfx(true)


func _on_boss_died(_boss_id: StringName) -> void:
	duck_sfx(false)
