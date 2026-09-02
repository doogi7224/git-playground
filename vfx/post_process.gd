extends Node
class_name PostProcess
## 비네트 + 색수차를 설정에 맞춰 켜고 끈다. 기획서 3.3.
## 대비/채도는 WorldEnvironment 의 Adjustments 가 맡는다.

## 색수차는 화면 텍스처(백버퍼)가 필요하다. GL Compatibility 렌더러에서는 카메라가
## 원점에서 멀어지면 백버퍼 복사가 빈 화면을 돌려줘서 게임 화면이 통째로 단색이 된다.
## 저사양용 Mobile/Compatibility 렌더러를 지원해야 하므로 여기서는 그냥 끈다.
const SCREEN_TEXTURE_SAFE_METHODS: Array[String] = ["forward_plus", "mobile"]

@export var vignette: CanvasItem
@export var chromatic: CanvasItem


func _ready() -> void:
	Settings.changed.connect(apply)
	apply()


func screen_texture_supported() -> bool:
	return SCREEN_TEXTURE_SAFE_METHODS.has(RenderingServer.get_current_rendering_method())


func apply() -> void:
	if vignette != null:
		vignette.visible = Settings.vignette
	if chromatic != null:
		chromatic.visible = Settings.chromatic_aberration and screen_texture_supported()
