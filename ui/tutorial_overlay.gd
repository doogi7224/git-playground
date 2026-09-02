extends Control
class_name TutorialOverlay
## 첫 판 안내. 조건이 맞으면 한 줄씩 띄우고, 플레이어가 그 일을 해내면 사라진다.
##
## 게임을 멈추지 않는다. 불릿 헤븐에서 20분 타이머가 도는 중에 모달을 띄우면
## 흐름이 끊기고, 첫 판이 제일 한가한 구간이라 굳이 멈출 이유도 없다.
##
## 한 번 끝내면 세이브에 남아 다시 안 뜬다. 설정에서 되살릴 수 있다.

## 한 단계 = {id, 언제 띄우나(초), 무엇을 하면 지워지나}
## 문구는 번역 표를 타므로 여기 한국어가 그대로 키다.
const STEPS: Array[Dictionary] = [
	{"id": &"move", "at": 0.0, "text": "WASD / 방향키로 이동", "clear": &"moved"},
	{"id": &"attack", "at": 3.0, "text": "공격은 자동이다. 적 쪽으로 붙기만 하면 된다.", "clear": &"killed"},
	{"id": &"xp", "at": 8.0, "text": "떨어진 '짬'을 주우면 진급한다", "clear": &"picked"},
	{"id": &"orders", "at": 0.0, "text": "진급하면 명령서 3장 중 1장을 고른다", "clear": &"leveled"},
]

## 조건을 못 채워도 이 시간이 지나면 넘어간다. 안 그러면 안 죽이는 사람에게 영원히 남는다.
const STEP_TIMEOUT: float = 22.0
## 한 번 뜬 안내는 최소 이만큼 머문다.
##
## 없으면 조건을 바로 채웠을 때 한 프레임 만에 사라져 읽을 수가 없다.
## 첫 안내("이동")가 특히 그렇다 -- 대부분 0.5초 안에 움직이기 시작한다.
const MIN_SHOW: float = 2.2
const FADE: float = 0.35

var player: Player = null

var _label: Label = null
var _panel: PanelContainer = null
var _step: int = -1
var _shown_at: float = 0.0
var _done: Dictionary = {}      ## StringName -> bool
var _finished: bool = false
var _start_pos: Vector2 = Vector2.ZERO
## Vector2.ZERO 를 "아직 기록 안 함" 으로 쓰면 안 된다. 플레이어는 실제로 원점에서
## 시작하므로 매 프레임 시작 위치가 갱신돼 영원히 "안 움직였다" 가 된다.
var _have_start: bool = false


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build()
	hide()
	if not SaveSystem.tutorial_pending():
		_finished = true
		return
	EventBus.enemy_died.connect(func(_p: Vector2, _x: float, _t: StringName) -> void:
		_done[&"killed"] = true)
	EventBus.xp_gained.connect(func(_a: float, _t: float, _n: float) -> void:
		_done[&"picked"] = true)
	EventBus.player_leveled.connect(func(_lv: int) -> void: _done[&"leveled"] = true)


func _build() -> void:
	# 화면 아래쪽 가운데에 붙인다.
	#
	# ★ 절대 픽셀 여백으로 위치를 잡지 말 것. PRESET_BOTTOM_WIDE 는 높이가 0 이고,
	#   margin_top 에 760 같은 숫자를 박으면 뷰포트 크기가 다를 때 화면 밖으로 나간다.
	#   실제로 그랬다 -- visible 도 true 고 알파도 1인데 눈에는 안 보였다.
	#   늘어나는 스페이서로 밀어내면 해상도와 무관하다.
	var column := VBoxContainer.new()
	column.set_anchors_preset(Control.PRESET_FULL_RECT)
	column.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(column)

	var push := Control.new()
	push.size_flags_vertical = Control.SIZE_EXPAND_FILL
	push.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(push)

	var center := CenterContainer.new()
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(center)

	_panel = MetaUI.panel()
	_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.add_child(_panel)

	_label = MetaUI.label("", 26)
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_panel.add_child(_label)

	# HUD 아래 여백. 체력바와 겹치지 않을 만큼만.
	var gap := Control.new()
	gap.custom_minimum_size = Vector2(0.0, 140.0)
	gap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(gap)


func _process(_delta: float) -> void:
	if _finished or player == null or GameState.phase != GameState.Phase.PLAYING:
		return
	var t: float = GameState.elapsed

	# 이동은 "움직였나" 로 판정한다. 입력을 훔쳐보지 않고 실제 위치로 본다.
	if not _have_start:
		_start_pos = player.global_position
		_have_start = true
	elif player.global_position.distance_to(_start_pos) > 120.0:
		_done[&"moved"] = true

	if _step < 0:
		_advance(t)
		return

	var shown_for: float = t - _shown_at
	if shown_for < MIN_SHOW:
		return   # 읽을 시간은 준다
	var step: Dictionary = STEPS[_step]
	if bool(_done.get(step["clear"], false)) or shown_for > STEP_TIMEOUT:
		_advance(t)


## 다음으로 띄울 단계를 찾는다. 이미 해낸 일은 건너뛴다 --
## 첫 킬을 이미 했는데 "적 쪽으로 붙어라" 를 띄우면 안내가 아니라 잔소리다.
##
## ★ 첫 단계만은 건너뛰지 않는다. "이동" 은 at 0.0 이라 뜨자마자 조건이 차는데,
##   건너뛰면 안내가 통째로 한 번도 안 보인다. 실제로 그랬다 --
##   대부분 0.5초 안에 움직이기 시작하므로 아무도 첫 줄을 못 봤다.
func _advance(t: float) -> void:
	var next: int = _step + 1
	while next < STEPS.size():
		var step: Dictionary = STEPS[next]
		if next > 0 and bool(_done.get(step["clear"], false)):
			next += 1
			continue
		if t < float(step["at"]):
			return   # 아직 띄울 때가 아니다
		break
	if next >= STEPS.size():
		_finish()
		return
	_step = next
	_shown_at = t
	_label.text = MetaUI.t(String(STEPS[next]["text"]))
	if not visible:
		show()
		modulate.a = 0.0
	create_tween().tween_property(self, ^"modulate:a", 1.0, FADE)


func _finish() -> void:
	_finished = true
	_step = STEPS.size()
	if visible:
		var tween := create_tween()
		tween.tween_property(self, ^"modulate:a", 0.0, FADE)
		tween.tween_callback(hide)
	SaveSystem.mark_tutorial_done()


## 지금 몇 번째 단계인가. 테스트가 본다. 끝났으면 STEPS.size().
func current_step() -> int:
	return _step
