extends Node2D
## 화이트박스 연병장 바닥. 카메라를 따라다니는 격자만 그린다. M2에서 실제 타일로 교체.

const CELL: float = 128.0
const COLOR_LINE: Color = Color(0.30, 0.35, 0.25, 0.55)
const COLOR_LINE_MAJOR: Color = Color(0.45, 0.50, 0.36, 0.65)

@export var follow: NodePath

var _target: Node2D = null
var _last_cell: Vector2i = Vector2i(9999, 9999)


func _ready() -> void:
	z_index = -100
	if not follow.is_empty():
		_target = get_node_or_null(follow) as Node2D


func _process(_delta: float) -> void:
	if _target == null:
		return
	var cell := Vector2i(floori(_target.global_position.x / CELL), floori(_target.global_position.y / CELL))
	if cell != _last_cell:
		_last_cell = cell
		global_position = Vector2(cell) * CELL
		queue_redraw()


func _draw() -> void:
	var span: int = 12
	for i in range(-span, span + 1):
		var x: float = float(i) * CELL
		var col: Color = COLOR_LINE_MAJOR if (i % 4 == 0) else COLOR_LINE
		draw_line(Vector2(x, -span * CELL), Vector2(x, span * CELL), col, 1.0)
		draw_line(Vector2(-span * CELL, x), Vector2(span * CELL, x), col, 1.0)
