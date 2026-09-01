extends Control
## 인게임 HUD. EventBus만 구독한다 — 게임 로직 노드를 직접 참조하지 않는다. (CLAUDE.md 규칙 9)

@onready var day_label: Label = $DayLabel
@onready var time_label: Label = $TimeLabel
@onready var rank_label: Label = $BottomLeft/RankLabel
@onready var hp_bar: ProgressBar = $BottomLeft/HPBar
@onready var xp_bar: ProgressBar = $XPBar
@onready var kill_label: Label = $TopRight/KillLabel
@onready var boss_box: VBoxContainer = $BossBox
@onready var boss_label: Label = $BossBox/BossLabel
@onready var boss_bar: ProgressBar = $BossBox/BossBar

var _kills: int = 0


func _ready() -> void:
	EventBus.day_changed.connect(_on_day_changed)
	EventBus.player_damaged.connect(_on_hp_changed)
	EventBus.player_healed.connect(_on_hp_changed)
	EventBus.xp_gained.connect(_on_xp_gained)
	EventBus.player_leveled.connect(_on_leveled)
	EventBus.rank_changed.connect(_on_rank_changed)
	EventBus.enemy_died.connect(_on_enemy_died)
	EventBus.run_started.connect(_on_run_started)
	EventBus.boss_spawned.connect(_on_boss_spawned)
	EventBus.boss_hp_changed.connect(_on_boss_hp)
	EventBus.boss_died.connect(_on_boss_died)
	EventBus.weapon_evolved.connect(_on_weapon_evolved)
	boss_box.visible = false
	_refresh_rank(1, GameState.rank_for_level(1))


func _process(_delta: float) -> void:
	var left: float = maxf(0.0, GameState.run_duration() - GameState.elapsed)
	time_label.text = "%02d:%02d" % [int(left) / 60, int(left) % 60]


func _on_run_started(_character_id: StringName) -> void:
	_kills = 0
	kill_label.text = "처치 0"
	hp_bar.value = 1.0
	xp_bar.value = 0.0
	day_label.text = "D-100"


func _on_day_changed(days_left: int) -> void:
	day_label.text = "D-DAY" if days_left <= 0 else "D-%d" % days_left


func _on_hp_changed(_amount: float, hp_ratio: float) -> void:
	hp_bar.value = hp_ratio


func _on_xp_gained(_amount: float, total: float, to_next: float) -> void:
	xp_bar.value = 0.0 if to_next <= 0.0 else clampf(total / to_next, 0.0, 1.0)


func _on_leveled(level: int) -> void:
	_refresh_rank(level, GameState.rank_for_level(level))
	xp_bar.value = 0.0


func _on_rank_changed(rank_id: StringName) -> void:
	_refresh_rank(GameState.level, rank_id)


func _refresh_rank(level: int, rank_id: StringName) -> void:
	var name_kr: String = GameState.rank_name(rank_id)
	rank_label.text = "%s  Lv.%d" % [name_kr, level]


const BOSS_NAMES: Dictionary = {
	&"battalion_commander": "대대장 순시",
}


func _on_boss_spawned(boss_id: StringName) -> void:
	boss_label.text = BOSS_NAMES.get(boss_id, String(boss_id))
	boss_bar.value = 1.0
	boss_box.visible = true


func _on_boss_hp(ratio: float) -> void:
	boss_bar.value = ratio


func _on_boss_died(_boss_id: StringName) -> void:
	boss_box.visible = false


func _on_weapon_evolved(_from_id: StringName, to_id: StringName) -> void:
	# M2에서 제대로 된 연출로 바뀐다. 지금은 처치 카운터 옆에 잠깐 띄운다.
	kill_label.text = "진화! %s" % to_id


func _on_enemy_died(_pos: Vector2, _xp: float, _enemy_type: StringName) -> void:
	_kills += 1
	kill_label.text = "처치 %d" % _kills
