extends Control
## F3로 켜고 끄는 성능 오버레이. 기획서 프롬프트 2 요구사항(FPS/적 수/드로우콜).
## 릴리즈 빌드에서도 켤 수 있게 남겨둔다 — 유저 기기에서 병목을 물어볼 때 쓴다.

@onready var label: Label = $Panel/Margin/Label

var enemies: EnemyManager = null
var pickups: PickupManager = null

var _accum: float = 0.0
var _frames: int = 0
var _worst_ms: float = 0.0
var _fps_shown: float = 0.0


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed(&"toggle_debug_overlay"):
		visible = not visible
		if visible:
			_worst_ms = 0.0
		get_viewport().set_input_as_handled()


func _process(delta: float) -> void:
	if not visible:
		return

	var ms: float = delta * 1000.0
	_worst_ms = maxf(_worst_ms, ms)
	_accum += delta
	_frames += 1
	if _accum >= 0.25:
		_fps_shown = float(_frames) / _accum
		_accum = 0.0
		_frames = 0

	var lines: PackedStringArray = PackedStringArray()
	lines.append("FPS %5.1f   프레임 %5.2fms   최악 %5.2fms" % [_fps_shown, ms, _worst_ms])
	lines.append("드로우콜 %d   오브젝트 %d   정점 %d" % [
		RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TOTAL_DRAW_CALLS_IN_FRAME),
		RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TOTAL_OBJECTS_IN_FRAME),
		RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TOTAL_PRIMITIVES_IN_FRAME)])
	if enemies != null:
		lines.append("적 %d / %d   시뮬 %.2fms   버퍼 %.2fms" % [
			enemies.get_count(), enemies.get_capacity(),
			float(enemies.last_sim_usec) / 1000.0,
			float(enemies.last_buffer_usec) / 1000.0])
	if pickups != null:
		lines.append("픽업 %d" % pickups.get_count())
	lines.append("t %.1fs (D-%d)   비디오메모리 %.1fMB" % [
		GameState.elapsed, GameState.days_left(),
		float(RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED)) / 1048576.0])
	label.text = "\n".join(lines)
