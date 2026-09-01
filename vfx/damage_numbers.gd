extends MultiMeshInstance2D
class_name DamageNumbers
## 데미지 넘버. 기획서 6.2 — **개별 Label 금지**. MultiMesh + 폰트 아틀라스, 동시 120개 캡.
##
## 글리프 하나가 인스턴스 하나다. 120개 숫자 × 최대 5자리 = 인스턴스 600개, 드로우콜 1개.
## Label 이었으면 노드 120개 + 폰트 렌더링 120번이다.
##
## 크리티컬은 크기 1.5배 + 금색 (기획서 3.2 — 금색은 플레이어 이펙트 독점색).

const MAX_NUMBERS: int = 120
const MAX_DIGITS: int = 6
const GLYPHS: String = "0123456789"
const FONT_SIZE: int = 44
const PAD: int = 8
const BUFFER_STRIDE: int = 16

const LIFETIME: float = 0.85
const RISE_SPEED: float = 130.0
const GRAVITY: float = 190.0
const COLOR_NORMAL: Color = Color(1.0, 0.98, 0.92)
const COLOR_CRIT: Color = Color("#FFC94A")
const CRIT_SCALE: float = 1.5
const BASE_SCALE: float = 0.42

## --- 숫자 상태 (SoA) ---
var _px: PackedFloat32Array = PackedFloat32Array()
var _py: PackedFloat32Array = PackedFloat32Array()
var _vx: PackedFloat32Array = PackedFloat32Array()
var _vy: PackedFloat32Array = PackedFloat32Array()
var _life: PackedFloat32Array = PackedFloat32Array()
var _scale: PackedFloat32Array = PackedFloat32Array()
var _crit: PackedByteArray = PackedByteArray()
var _digits: PackedByteArray = PackedByteArray()   ## MAX_NUMBERS * MAX_DIGITS
var _len: PackedByteArray = PackedByteArray()
var _count: int = 0

## --- 아틀라스 ---
var _ready_to_draw: bool = false
var _uv: PackedFloat32Array = PackedFloat32Array()      ## 글리프당 (u, v, w, h)
var _advance: PackedFloat32Array = PackedFloat32Array()  ## 글리프당 진행폭(px)
var _glyph_h: float = 0.0
var _buffer: PackedFloat32Array = PackedFloat32Array()


func _ready() -> void:
	z_index = 60
	_allocate()
	EventBus.damage_number_requested.connect(_on_damage)
	await _bake_atlas()


func _allocate() -> void:
	_px.resize(MAX_NUMBERS)
	_py.resize(MAX_NUMBERS)
	_vx.resize(MAX_NUMBERS)
	_vy.resize(MAX_NUMBERS)
	_life.resize(MAX_NUMBERS)
	_scale.resize(MAX_NUMBERS)
	_crit.resize(MAX_NUMBERS)
	_len.resize(MAX_NUMBERS)
	_digits.resize(MAX_NUMBERS * MAX_DIGITS)
	_uv.resize(GLYPHS.length() * 4)
	_advance.resize(GLYPHS.length())

	var quad := QuadMesh.new()
	quad.size = Vector2.ONE
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_2D
	mm.use_colors = true
	mm.use_custom_data = true
	mm.mesh = quad
	mm.instance_count = MAX_NUMBERS * MAX_DIGITS
	mm.visible_instance_count = 0
	multimesh = mm
	_buffer.resize(MAX_NUMBERS * MAX_DIGITS * BUFFER_STRIDE)


## 숫자 0~9 를 한 장에 굽는다. SubViewport 로 한 프레임 그려서 이미지로 떠온다.
## 더미 렌더러(헤드리스)에서는 빈 이미지가 나오는데, 그때는 조용히 꺼진다.
func _bake_atlas() -> void:
	var font: Font = ThemeDB.fallback_font
	if font == null:
		return

	var offsets := PackedInt32Array()
	offsets.resize(GLYPHS.length())
	var x: int = 0
	var ascent: float = font.get_ascent(FONT_SIZE)
	_glyph_h = font.get_height(FONT_SIZE) + float(PAD * 2)

	for i in GLYPHS.length():
		var w: float = font.get_string_size(GLYPHS[i], HORIZONTAL_ALIGNMENT_LEFT, -1, FONT_SIZE).x
		offsets[i] = x + PAD
		_advance[i] = w
		x += int(ceil(w)) + PAD * 2

	var atlas_size := Vector2i(x, int(ceil(_glyph_h)))
	if atlas_size.x <= 0 or atlas_size.y <= 0:
		return

	var viewport := SubViewport.new()
	viewport.size = atlas_size
	viewport.transparent_bg = true
	viewport.disable_3d = true
	viewport.render_target_update_mode = SubViewport.UPDATE_ONCE
	var painter := Control.new()
	painter.set_script(load("res://vfx/digit_painter.gd"))
	painter.font = font
	painter.font_size = FONT_SIZE
	painter.glyphs = GLYPHS
	painter.offsets = offsets
	painter.baseline = ascent + float(PAD)
	viewport.add_child(painter)
	add_child(viewport)

	await RenderingServer.frame_post_draw
	var image: Image = viewport.get_texture().get_image()
	viewport.queue_free()

	if image == null or image.is_empty():
		return
	# 헤드리스 더미 렌더러는 알파가 전부 0인 이미지를 준다 — 그러면 그냥 끈다.
	var opaque: bool = false
	for probe_y in range(0, image.get_height(), 4):
		for probe_x in range(0, image.get_width(), 4):
			if image.get_pixel(probe_x, probe_y).a > 0.05:
				opaque = true
				break
		if opaque:
			break
	if not opaque:
		return

	var texture := ImageTexture.create_from_image(image)
	var mat: ShaderMaterial = ShaderMaterial.new()
	mat.shader = load("res://vfx/shaders/damage_number.gdshader")
	mat.set_shader_parameter(&"atlas", texture)
	material = mat

	var fw: float = float(atlas_size.x)
	var fh: float = float(atlas_size.y)
	for i in GLYPHS.length():
		_uv[i * 4 + 0] = (float(offsets[i]) - float(PAD)) / fw
		_uv[i * 4 + 1] = 0.0
		_uv[i * 4 + 2] = (_advance[i] + float(PAD * 2)) / fw
		_uv[i * 4 + 3] = 1.0
		_advance[i] = _advance[i] + float(PAD) * 0.4   # 자간
	_glyph_h = fh
	_ready_to_draw = true


func get_count() -> int:
	return _count


func is_enabled() -> bool:
	return _ready_to_draw


func _on_damage(pos: Vector2, amount: float, is_crit: bool) -> void:
	if not Settings.damage_numbers:
		return
	spawn(pos, amount, is_crit)


func spawn(pos: Vector2, amount: float, is_crit: bool) -> void:
	var value: int = int(round(maxf(0.0, amount)))
	var text: String = str(value)
	if text.length() > MAX_DIGITS:
		text = text.substr(0, MAX_DIGITS)

	var i: int
	if _count < MAX_NUMBERS:
		i = _count
		_count += 1
	else:
		# 120개 캡 (기획서 6.2). 넘치면 가장 오래된 것을 밀어낸다 — 새 숫자가 더 중요하다.
		i = 0
		var oldest: float = INF
		for k in _count:
			if _life[k] < oldest:
				oldest = _life[k]
				i = k

	_px[i] = pos.x
	_py[i] = pos.y
	_vx[i] = randf_range(-34.0, 34.0)
	_vy[i] = -RISE_SPEED
	_life[i] = LIFETIME
	_scale[i] = BASE_SCALE * (CRIT_SCALE if is_crit else 1.0)
	_crit[i] = 1 if is_crit else 0
	_len[i] = text.length()
	for d in text.length():
		_digits[i * MAX_DIGITS + d] = text.unicode_at(d) - 48   # '0' 은 48


func clear() -> void:
	_count = 0


func _process(delta: float) -> void:
	if _count > 0:
		var i: int = 0
		while i < _count:
			_life[i] -= delta
			if _life[i] <= 0.0:
				_swap_remove(i)
				continue
			_vy[i] += GRAVITY * delta
			_px[i] += _vx[i] * delta
			_py[i] += _vy[i] * delta
			i += 1
	_update_buffer()


func _swap_remove(i: int) -> void:
	var last: int = _count - 1
	if i != last:
		_px[i] = _px[last]
		_py[i] = _py[last]
		_vx[i] = _vx[last]
		_vy[i] = _vy[last]
		_life[i] = _life[last]
		_scale[i] = _scale[last]
		_crit[i] = _crit[last]
		_len[i] = _len[last]
		for d in MAX_DIGITS:
			_digits[i * MAX_DIGITS + d] = _digits[last * MAX_DIGITS + d]
	_count = last


func _update_buffer() -> void:
	if multimesh == null:
		return
	if not _ready_to_draw:
		multimesh.visible_instance_count = 0
		return

	var buf: PackedFloat32Array = _buffer
	_buffer = PackedFloat32Array()
	var written: int = 0

	for i in _count:
		var scale: float = _scale[i]
		var fade: float = clampf(_life[i] / LIFETIME, 0.0, 1.0)
		# 튀어나올 때 살짝 커졌다가 제자리로
		var pop: float = 1.0 + 0.35 * clampf((_life[i] - LIFETIME + 0.12) / 0.12, 0.0, 1.0)
		var color: Color = COLOR_CRIT if _crit[i] == 1 else COLOR_NORMAL
		var length: int = _len[i]

		var total_w: float = 0.0
		for d in length:
			total_w += _advance[_digits[i * MAX_DIGITS + d]] * scale * pop
		var cursor: float = _px[i] - total_w * 0.5

		for d in length:
			var glyph: int = _digits[i * MAX_DIGITS + d]
			var gw: float = (_advance[glyph] + float(PAD * 2)) * scale * pop
			var gh: float = _glyph_h * scale * pop
			var b: int = written * BUFFER_STRIDE
			buf[b + 0] = gw
			buf[b + 1] = 0.0
			buf[b + 2] = 0.0
			buf[b + 3] = cursor + gw * 0.5
			buf[b + 4] = 0.0
			buf[b + 5] = gh
			buf[b + 6] = 0.0
			buf[b + 7] = _py[i]
			buf[b + 8] = color.r
			buf[b + 9] = color.g
			buf[b + 10] = color.b
			buf[b + 11] = fade
			buf[b + 12] = _uv[glyph * 4 + 0]
			buf[b + 13] = _uv[glyph * 4 + 1]
			buf[b + 14] = _uv[glyph * 4 + 2]
			buf[b + 15] = _uv[glyph * 4 + 3]
			cursor += _advance[glyph] * scale * pop
			written += 1

	multimesh.buffer = buf
	multimesh.visible_instance_count = written
	_buffer = buf
