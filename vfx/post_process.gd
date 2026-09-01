extends ColorRect
class_name PostProcess
## 비네트 + 색수차 + 대비/채도. 기획서 3.3.
## 화면 전체를 덮는 ColorRect 라서 CanvasLayer 위에 얹는다. 글로우는 WorldEnvironment 담당.

@onready var _material: ShaderMaterial = material as ShaderMaterial


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	Settings.changed.connect(_apply)
	_apply()


func _apply() -> void:
	if _material == null:
		return
	visible = Settings.vignette or Settings.chromatic_aberration
	_material.set_shader_parameter(&"vignette_strength", 0.55 if Settings.vignette else 0.0)
	_material.set_shader_parameter(&"aberration", 0.8 if Settings.chromatic_aberration else 0.0)
