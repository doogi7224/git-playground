extends Node2D
class_name GroundGrid
## 연병장 바닥. 카메라를 따라다니며 바닥색·격자·얼룩을 그린다.
##
## 예전에는 **격자 선만** 그렸다. 바닥 자체는 project.godot 의 고정
## default_clear_color 였고, MapData.ground_color 는 선 색으로만 쓰였다 --
## 그래서 혹한기 맵을 골라도 바닥이 연병장과 똑같은 국방색이었다.
## 화면 절반이 아무것도 없는 단색인 것도 여기서 왔다.
##
## 얼룩은 적과 같은 이유로 MultiMesh 하나다 (규칙 1). 수백 개를 개별 Node 로
## 깔 수는 없다. 드로우콜 1개.

const CELL: float = 128.0
## 한 칸에 얼룩 몇 개. 늘리면 빽빽해지고 버퍼도 그만큼 커진다.
const DECALS_PER_CELL: int = 3
const DECAL_MIN: float = 30.0
const DECAL_MAX: float = 88.0
const BUFFER_STRIDE: int = 16
## 화면 밖으로 몇 칸 더 그릴지. 한 칸 넘어갈 때마다 다시 그리므로 여유가 필요하다.
const SPAN_PAD: int = 2
const SPAN_MAX: int = 14

@export var follow: NodePath
## MapData.ground_color 를 아레나가 넣어준다. 이제 선이 아니라 **바닥색**이다.
@export var ground_color: Color = Color("#3E4A32"):
	set(value):
		ground_color = value
		_dirty = true
		queue_redraw()
## 저사양 프리셋에서 끈다. 꺼도 바닥색과 격자는 남는다.
@export var decals_enabled: bool = true:
	set(value):
		decals_enabled = value
		_dirty = true

var _target: Node2D = null
var _last_cell: Vector2i = Vector2i(9999, 9999)
var _span: int = 8
var _dirty: bool = true

var _decals: MultiMeshInstance2D = null
var _buffer: PackedFloat32Array = PackedFloat32Array()


func _ready() -> void:
	z_index = -100
	if not follow.is_empty():
		_target = get_node_or_null(follow) as Node2D
	_ensure_decals()


func _process(_delta: float) -> void:
	if _target == null:
		return
	var span: int = _needed_span()
	var cell := Vector2i(floori(_target.global_position.x / CELL), floori(_target.global_position.y / CELL))
	if cell == _last_cell and span == _span and not _dirty:
		return
	_last_cell = cell
	_span = span
	_dirty = false
	global_position = Vector2(cell) * CELL
	queue_redraw()
	_rebuild_decals()


## 보이는 범위를 덮을 만큼만 그린다. 세로 화면 + 줌 1.8 이면 반경 533px,
## 즉 5칸이면 충분하다 -- 가로 1920 시절의 12칸은 네 배를 헛그리는 것이었다.
func _needed_span() -> int:
	var vp: Viewport = get_viewport()
	if vp == null:
		return 8
	var cam: Camera2D = vp.get_camera_2d()
	var zoom: Vector2 = cam.zoom if cam != null else Vector2.ONE
	if zoom.x <= 0.0 or zoom.y <= 0.0:
		zoom = Vector2.ONE
	var half: Vector2 = (vp.get_visible_rect().size / zoom) * 0.5
	var need: int = ceili(maxf(half.x, half.y) / CELL) + SPAN_PAD
	return clampi(need, 3, SPAN_MAX)


func _draw() -> void:
	var reach: float = float(_span) * CELL
	# ★ 바닥색을 실제로 칠한다. 이게 없으면 맵을 바꿔도 바닥이 안 바뀐다.
	draw_rect(Rect2(Vector2(-reach, -reach), Vector2(reach * 2.0, reach * 2.0)), ground_color)

	# 격자는 연병장 구획선이다. 얼룩이 생긴 뒤로는 존재감을 낮춰야 안 촌스럽다.
	for i in range(-_span, _span + 1):
		var x: float = float(i) * CELL
		var major: bool = i % 4 == 0
		var col: Color = ground_color.lightened(0.16 if major else 0.07)
		col.a = 0.55 if major else 0.35
		draw_line(Vector2(x, -reach), Vector2(x, reach), col, 1.0)
		draw_line(Vector2(-reach, x), Vector2(reach, x), col, 1.0)


func _ensure_decals() -> void:
	if _decals != null:
		return
	var quad := QuadMesh.new()
	quad.size = Vector2.ONE

	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_2D
	mm.use_colors = true
	mm.use_custom_data = true
	mm.mesh = quad

	_decals = MultiMeshInstance2D.new()
	_decals.name = "GroundDecals"
	_decals.multimesh = mm
	_decals.material = load("res://vfx/shaders/ground_decal_material.tres")
	# 바닥색 위, 격자 아래. 같은 노드의 _draw() 보다 뒤에 그려지므로 격자가 위에 온다.
	_decals.z_index = 1
	add_child(_decals)


## 칸마다 정해진 난수로 얼룩을 놓는다. **좌표에서 값을 뽑아야** 플레이어가
## 왔다 갔다 할 때 얼룩이 매번 새로 튀지 않는다. randf() 를 쓰면 지나갈 때마다
## 땅이 바뀐다.
func _rebuild_decals() -> void:
	_ensure_decals()
	var mm: MultiMesh = _decals.multimesh
	if not decals_enabled:
		mm.visible_instance_count = 0
		return

	var side: int = _span * 2 + 1
	var count: int = side * side * DECALS_PER_CELL
	if mm.instance_count < count:
		mm.instance_count = count
		_buffer.resize(count * BUFFER_STRIDE)
	elif _buffer.size() < count * BUFFER_STRIDE:
		_buffer.resize(count * BUFFER_STRIDE)

	var buf: PackedFloat32Array = _buffer
	_buffer = PackedFloat32Array()   # 쓰는 동안 참조를 하나로 (복사 방지)

	var written: int = 0
	for gy in range(-_span, _span + 1):
		for gx in range(-_span, _span + 1):
			var cx: int = _last_cell.x + gx
			var cy: int = _last_cell.y + gy
			for k in DECALS_PER_CELL:
				var h0: float = _hash(cx, cy, k * 4 + 0)
				# 칸마다 다 놓으면 균일해서 오히려 인공적이다. 3할은 비워 둔다.
				if h0 > 0.70:
					continue
				var h1: float = _hash(cx, cy, k * 4 + 1)
				var h2: float = _hash(cx, cy, k * 4 + 2)
				var h3: float = _hash(cx, cy, k * 4 + 3)

				var px: float = (float(gx) + h1) * CELL
				var py: float = (float(gy) + h2) * CELL
				var size: float = lerpf(DECAL_MIN, DECAL_MAX, h3)
				# 가로로 살짝 눌러 놓는다. 3/4 부감이라 원이 그대로면 공처럼 보인다.
				var w: float = size
				var hgt: float = size * lerpf(0.52, 0.78, h0 / 0.70)

				var c: Color = _decal_color(h1, h3)
				var b: int = written * BUFFER_STRIDE
				buf[b + 0] = w
				buf[b + 1] = 0.0
				buf[b + 2] = 0.0
				buf[b + 3] = px
				buf[b + 4] = 0.0
				buf[b + 5] = hgt
				buf[b + 6] = 0.0
				buf[b + 7] = py
				buf[b + 8] = c.r
				buf[b + 9] = c.g
				buf[b + 10] = c.b
				buf[b + 11] = c.a
				buf[b + 12] = h2 * TAU        # 모양 시드
				buf[b + 13] = lerpf(0.82, 1.14, h3)  # 안쪽 밝기
				buf[b + 14] = 0.0
				buf[b + 15] = 0.0
				written += 1

	mm.buffer = buf
	mm.visible_instance_count = written
	_buffer = buf


## 바닥색에서 벗어나지 않는 얼룩색. 색을 새로 들이면 맵 톤이 깨진다 --
## 밝기와 카키 쪽으로 아주 조금만 민다.
func _decal_color(h: float, shade: float) -> Color:
	var c: Color = ground_color
	if h < 0.34:
		c = c.darkened(lerpf(0.06, 0.16, shade))
	elif h < 0.72:
		c = c.lightened(lerpf(0.04, 0.10, shade))
	else:
		# 기획서 3.2 의 카키. 흙이 드러난 자리.
		c = c.lerp(Color("#7A6E4E"), lerpf(0.14, 0.30, shade))
	# ★ 이 알파가 세면 바닥이 아니라 구름·위장무늬로 보인다. 실제로 그랬다.
	c.a = lerpf(0.14, 0.34, shade)
	return c


## 정수 좌표 → 0~1. 해시가 약하면 얼룩이 줄무늬로 정렬돼 보인다.
func _hash(x: int, y: int, salt: int) -> float:
	var n: int = x * 374761393 + y * 668265263 + salt * 1274126177
	n = (n ^ (n >> 13)) * 1274126177
	n = n ^ (n >> 16)
	return float(absi(n) % 100000) / 100000.0
