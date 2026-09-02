extends Node
## BGM/SFX 재생과 보스 등장 시 오디오 덕킹.
##
## ★ 이 게임의 오디오는 "몇 개를 트느냐" 가 아니라 "몇 개를 안 트느냐" 의 문제다.
##   적이 3,000마리 있고 초당 수백 마리가 죽는다. 죽을 때마다 소리를 틀면
##   플레이어는 소리가 아니라 잡음을 듣고, 플레이어 수도 순식간에 바닥난다.
##   그래서 두 겹으로 막는다.
##     1) 같은 소리는 최소 간격 안에 한 번만 (SFX_MIN_GAP)
##     2) 플레이어가 다 차면 새 소리는 그냥 버린다 (오래된 걸 자르지 않는다 --
##        자르면 딸깍거린다)
##
## 소리 파일은 tools/gen_sfx.py 가 만든 임시 합성음이다. 진짜 음원이 생기면
## 같은 이름으로 덮어쓰면 그대로 돌아간다.

const SFX_DIR: String = "res://audio/sfx/%s.wav"
const VOICE_COUNT: int = 24

## 소리별 최소 재생 간격(초). 자주 나는 소리일수록 크게 잡는다.
## 없으면 DEFAULT_GAP.
const DEFAULT_GAP: float = 0.04
const SFX_MIN_GAP: Dictionary = {
	&"hit": 0.055,        ## 초당 수백 번 후보가 생긴다
	&"kill": 0.07,
	&"crit": 0.09,
	&"pickup": 0.06,
	&"player_hurt": 0.25, ## 접촉 피해는 매 프레임 들어온다
	&"heal": 0.2,
}

## 같은 소리가 연달아 날 때 음정을 조금씩 흔든다. 안 그러면 기관총처럼 들린다.
const PITCH_JITTER: Dictionary = {
	&"hit": 0.18,
	&"kill": 0.14,
	&"crit": 0.10,
	&"pickup": 0.12,
}

const DUCK_DB: float = -6.0
const DUCK_TIME: float = 0.25

var _streams: Dictionary = {}                 ## StringName -> AudioStream
var _voices: Array[AudioStreamPlayer] = []
var _next_voice: int = 0
var _last_played: Dictionary = {}             ## StringName -> usec
var _bgm: AudioStreamPlayer = null
var _duck_tween: Tween = null

var _sfx_bus: int = 0
var _bgm_bus: int = 0

## 껐다 켜기(테스트/스트레스). 끄면 재생을 시도조차 안 한다.
var enabled: bool = true

## 몇 번 틀었고 몇 번 걸렀나. "지금 몇 개가 울리나" 는 한 순간을 찍은 값이라
## 스로틀이 일을 하는지 안 하는지 못 보여 준다. 누적으로 세야 보인다.
var played_count: int = 0
var dropped_count: int = 0


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_sfx_bus = maxi(0, AudioServer.get_bus_index(&"SFX"))
	_bgm_bus = maxi(0, AudioServer.get_bus_index(&"BGM"))
	_load_streams()
	_build_voices()
	apply_volumes()

	EventBus.enemy_damaged.connect(_on_enemy_damaged)
	EventBus.enemy_died.connect(_on_enemy_died)
	EventBus.player_damaged.connect(_on_player_damaged)
	EventBus.player_healed.connect(_on_player_healed)
	EventBus.xp_gained.connect(_on_xp_gained)
	EventBus.player_leveled.connect(_on_player_leveled)
	EventBus.weapon_evolved.connect(_on_weapon_evolved)
	EventBus.chest_dropped.connect(_on_chest_dropped)
	EventBus.boss_spawned.connect(_on_boss_spawned)
	EventBus.boss_died.connect(_on_boss_died)
	EventBus.run_ended.connect(_on_run_ended)
	Settings.changed.connect(apply_volumes)


func _load_streams() -> void:
	for id: StringName in [&"hit", &"crit", &"kill", &"player_hurt", &"pickup", &"heal",
			&"level_up", &"evolve", &"chest", &"boss_spawn", &"boss_die",
			&"ui_click", &"ui_move", &"victory", &"defeat"]:
		var path: String = SFX_DIR % id
		if ResourceLoader.exists(path):
			_streams[id] = load(path)
		else:
			push_warning("효과음이 없다: %s (tools/gen_sfx.py 를 돌리세요)" % path)


## 재생할 때마다 노드를 만들지 않는다 (CLAUDE.md 규칙 3).
## 미리 만들어 두고 돌려 쓴다.
func _build_voices() -> void:
	for i in VOICE_COUNT:
		var p := AudioStreamPlayer.new()
		p.bus = &"SFX"
		p.process_mode = Node.PROCESS_MODE_ALWAYS
		add_child(p)
		_voices.append(p)
	_bgm = AudioStreamPlayer.new()
	_bgm.bus = &"BGM"
	_bgm.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(_bgm)


func apply_volumes() -> void:
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index(&"Master"),
			linear_to_db(clampf(Settings.master_volume, 0.0, 1.0)))
	AudioServer.set_bus_volume_db(_bgm_bus, linear_to_db(clampf(Settings.bgm_volume, 0.0, 1.0)))
	AudioServer.set_bus_volume_db(_sfx_bus, linear_to_db(clampf(Settings.sfx_volume, 0.0, 1.0)))
	# 0 은 -inf dB 다. linear_to_db(0) 이 -inf 를 주므로 그대로 두면 음소거가 된다.


## 효과음 하나. 간격 제한에 걸리면 조용히 버린다 (그게 정상 동작이다).
func play_sfx(sfx_id: StringName, volume_db: float = 0.0) -> bool:
	if not enabled or not _streams.has(sfx_id):
		return false
	var now: int = Time.get_ticks_usec()
	var gap: float = float(SFX_MIN_GAP.get(sfx_id, DEFAULT_GAP))
	var last: int = int(_last_played.get(sfx_id, -1_000_000))
	if float(now - last) / 1_000_000.0 < gap:
		dropped_count += 1
		return false

	var voice: AudioStreamPlayer = _free_voice()
	if voice == null:
		dropped_count += 1
		return false   # 다 쓰는 중이면 버린다. 남의 소리를 자르지 않는다.
	_last_played[sfx_id] = now
	voice.stream = _streams[sfx_id]
	voice.volume_db = volume_db
	var jitter: float = float(PITCH_JITTER.get(sfx_id, 0.0))
	voice.pitch_scale = 1.0 + randf_range(-jitter, jitter) if jitter > 0.0 else 1.0
	voice.play()
	played_count += 1
	return true


func _free_voice() -> AudioStreamPlayer:
	for i in VOICE_COUNT:
		var idx: int = (_next_voice + i) % VOICE_COUNT
		if not _voices[idx].playing:
			_next_voice = (idx + 1) % VOICE_COUNT
			return _voices[idx]
	return null


## 지금 소리를 내고 있는 플레이어 수. 디버그 오버레이와 테스트가 본다.
func active_voices() -> int:
	var n: int = 0
	for p: AudioStreamPlayer in _voices:
		if p.playing:
			n += 1
	return n


func play_bgm(track_id: StringName, fade: float = 1.0) -> void:
	var path: String = "res://audio/bgm/%s.ogg" % track_id
	if not ResourceLoader.exists(path):
		return   # BGM 은 아직 없다. 없다고 경고를 매번 띄우지는 않는다.
	_bgm.stream = load(path)
	_bgm.volume_db = 0.0
	_bgm.play()
	if fade > 0.0:
		_bgm.volume_db = -40.0
		create_tween().tween_property(_bgm, ^"volume_db", 0.0, fade)


## 보스 등장 시 SFX를 낮추고 BGM을 강조한다. (기획서 3.5)
func duck_sfx(on: bool) -> void:
	if _duck_tween != null and _duck_tween.is_valid():
		_duck_tween.kill()
	var target: float = DUCK_DB if on else 0.0
	# 버스 볼륨은 설정 값 위에 얹는다. 덕킹이 설정을 덮어쓰면 안 된다.
	var base: float = linear_to_db(clampf(Settings.sfx_volume, 0.0001, 1.0))
	_duck_tween = create_tween()
	_duck_tween.tween_method(
			func(v: float) -> void: AudioServer.set_bus_volume_db(_sfx_bus, base + v),
			AudioServer.get_bus_volume_db(_sfx_bus) - base, target, DUCK_TIME)


# ---------------------------------------------------------------- EventBus

func _on_enemy_damaged(_pos: Vector2, _amount: float, is_crit: bool) -> void:
	play_sfx(&"crit" if is_crit else &"hit")


func _on_enemy_died(_pos: Vector2, _xp: float, _enemy_type: StringName) -> void:
	play_sfx(&"kill", -3.0)


func _on_player_damaged(_amount: float, _hp_ratio: float) -> void:
	play_sfx(&"player_hurt")


func _on_player_healed(_amount: float, _hp_ratio: float) -> void:
	play_sfx(&"heal", -4.0)


## 짬 획득. EventBus 에 pickup 시그널이 따로 없어서 xp_gained 를 쓴다 --
## 짬을 먹는 것 말고 경험치가 들어오는 경로가 없으므로 같은 뜻이다.
func _on_xp_gained(_amount: float, _total: float, _to_next: float) -> void:
	play_sfx(&"pickup", -8.0)


func _on_player_leveled(_level: int) -> void:
	play_sfx(&"level_up")


func _on_weapon_evolved(_from_id: StringName, _to_id: StringName) -> void:
	play_sfx(&"evolve")


func _on_chest_dropped(_pos: Vector2) -> void:
	play_sfx(&"chest")


func _on_boss_spawned(_boss_id: StringName, _display_name: String) -> void:
	play_sfx(&"boss_spawn")
	duck_sfx(true)


func _on_boss_died(_boss_id: StringName) -> void:
	play_sfx(&"boss_die")
	duck_sfx(false)


func _on_run_ended(victory: bool, _stats: Dictionary) -> void:
	duck_sfx(false)
	play_sfx(&"victory" if victory else &"defeat")
