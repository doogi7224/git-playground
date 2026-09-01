extends Control
## 데미지 넘버 아틀라스를 구울 때만 쓰는 임시 캔버스. SubViewport 안에서 한 프레임 그려진다.

var font: Font = null
var font_size: int = 44
var glyphs: String = ""
var offsets: PackedInt32Array = PackedInt32Array()
var baseline: float = 0.0
var outline: int = 5


func _draw() -> void:
	if font == null:
		return
	for i in glyphs.length():
		var ch: String = glyphs[i]
		var pos := Vector2(float(offsets[i]), baseline)
		# 어두운 외곽선을 먼저 깔아야 어떤 배경 위에서도 읽힌다 (기획서 3.1 잉크 외곽선)
		font.draw_string_outline(get_canvas_item(), pos, ch, HORIZONTAL_ALIGNMENT_LEFT, -1,
				font_size, outline, Color(0.06, 0.07, 0.05, 1.0))
		font.draw_string(get_canvas_item(), pos, ch, HORIZONTAL_ALIGNMENT_LEFT, -1,
				font_size, Color.WHITE)
