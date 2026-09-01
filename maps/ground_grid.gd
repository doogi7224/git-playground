extends Node2D
## 화이트박스 연병장 바닥. 카메라를 따라다니는 격자만 그린다. M2에서 실제 타일로 교체.

const CELL: float = 128.0
@export var follow: NodePath
## MapData.ground_color 를 아레나가 넣어준다.
@export var line_color: Color = Color(0.243137, 0.290196, 0.196078, 1.0):
	set(value):
		line_color = value
		queue_redraw()

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
		var col: Color = line_color.lightened(0.28 if (i % 4 == 0) else 0.12)
		col.a = 0.65 if (i % 4 == 0) else 0.5
		draw_line(Vector2(x, -span * CELL), Vector2(x, span * CELL), col, 1.0)
		draw_line(Vector2(-span * CELL, x), Vector2(span * CELL, x), col, 1.0)
