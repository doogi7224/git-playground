extends RefCounted
class_name HitFlash
## 피격 흰 플래시를 "2프레임" 동안 켠다. 기획서 3.3.
##
## 시간이 아니라 프레임 수로 세는 게 중요하다. 히트스톱으로 time_scale 이 0.05가 되면
## 시간 기준 0.03초는 실제로 0.6초가 되어버려서, 맞을 때마다 캐릭터가 하얗게 굳는다.

const FRAMES: int = 2

static var _pending: Dictionary = {}   ## CanvasItem -> 남은 프레임


## 머티리얼에 hit_flash 셰이더가 붙어 있어야 한다.
static func trigger(item: CanvasItem) -> void:
	if item == null or item.material == null:
		return
	var mat: ShaderMaterial = item.material as ShaderMaterial
	if mat == null:
		return
	mat.set_shader_parameter(&"flash", 1.0)
	_pending[item] = FRAMES


## 매 프레임 한 번 불러준다 (아레나가 담당).
static func tick() -> void:
	if _pending.is_empty():
		return
	var done: Array = []
	for item: Variant in _pending:
		var canvas: CanvasItem = item as CanvasItem
		if canvas == null or not is_instance_valid(canvas):
			done.append(item)
			continue
		var left: int = int(_pending[item]) - 1
		if left <= 0:
			var mat: ShaderMaterial = canvas.material as ShaderMaterial
			if mat != null:
				mat.set_shader_parameter(&"flash", 0.0)
			done.append(item)
		else:
			_pending[item] = left
	for item: Variant in done:
		_pending.erase(item)


static func clear() -> void:
	_pending.clear()
