extends Node
## 메타 진행 저장. 월급, PX 상점 강화, 해금, 표창장.
##
## TODO(M4): 실제 직렬화 + 버전 마이그레이션

const SAVE_PATH: String = "user://savegame.cfg"
const SAVE_VERSION: int = 1

var data: Dictionary = {
	"version": SAVE_VERSION,
	"salary": 0,                 ## 누적 월급 (메타 화폐)
	"px_upgrades": {},           ## PX 상점 영구 강화 레벨
	"unlocked_characters": [&"kim_private"],
	"unlocked_maps": [&"parade_ground"],
	"commendations": [],         ## 표창장 = 도전과제
	"settings": {},
}


func _ready() -> void:
	load_game()
	EventBus.salary_earned.connect(_on_salary_earned)


func load_game() -> void:
	pass  ## TODO(M4)


func save_game() -> void:
	pass  ## TODO(M4)


func _on_salary_earned(amount: int) -> void:
	data["salary"] = int(data.get("salary", 0)) + amount
