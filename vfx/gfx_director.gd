extends Node
class_name GfxDirector
## 설정에 따라 연출 노드들을 켜고 끈다. 기획서 프롬프트 6 — "전부 설정에서 on/off".
##
## 각 노드가 저마다 Settings 를 뒤지면 어디서 뭘 끄는지 흩어진다. 한 곳에 모아둔다.

@export var world_environment: WorldEnvironment
@export var canvas_modulate: CanvasModulate
@export var player_light: PointLight2D
@export var damage_numbers: DamageNumbers

var _base_env_glow: bool = true


func _ready() -> void:
	if world_environment != null and world_environment.environment != null:
		_base_env_glow = world_environment.environment.glow_enabled
	Settings.changed.connect(apply)
	apply()


func apply() -> void:
	if world_environment != null and world_environment.environment != null:
		world_environment.environment.glow_enabled = _base_env_glow and Settings.glow
	if canvas_modulate != null:
		canvas_modulate.visible = Settings.lighting
	if player_light != null:
		player_light.visible = Settings.lighting
	if damage_numbers != null and not Settings.damage_numbers:
		damage_numbers.clear()


func _process(_delta: float) -> void:
	# 히트 플래시는 시간이 아니라 프레임으로 센다 (히트스톱 중에 하얗게 굳는 걸 막는다)
	HitFlash.tick()
