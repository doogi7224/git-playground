extends Node2D
class_name RiggedCharacter
## 컷아웃 리깅 템플릿. 기획서 4.1 — "AI에게 스프라이트 시트를 시키지 마세요."
##
## AI로 캐릭터 1장을 뽑고, 파츠로 잘라서 여기 슬롯에 끼우면 걷기/공격/피격/사망이
## 그대로 나온다. 새 캐릭터는 **텍스처만 교체**하면 되고 애니메이션은 재사용된다.
## 8종 캐릭터 = 이미지 8장 + 리깅 0번.
##
## 사용법은 docs/rigging.md.

const PARTS: Array[StringName] = [
	&"Head", &"Torso", &"ArmL", &"ArmR", &"LegL", &"LegR", &"Weapon",
]

## 파츠 이름 → 텍스처. 에디터에서 채우거나 set_part()로 넣는다.
@export var part_textures: Dictionary = {}
## 파츠 텍스처를 넣었을 때 폴리곤을 텍스처 크기에 맞춰 다시 만들지 여부.
## 끄면 폴리곤은 그대로 두고 텍스처만 입힌다(직접 다듬은 실루엣을 지키고 싶을 때).
@export var fit_polygon_to_texture: bool = true

signal animation_done(name: StringName)

@onready var skeleton: Skeleton2D = $Skeleton2D
@onready var anim: AnimationPlayer = $AnimationPlayer

var _current: StringName = &""
var _locked: bool = false   ## 사망 중에는 다른 애니메이션으로 못 넘어간다


func _ready() -> void:
	anim.animation_finished.connect(_on_finished)
	for name: StringName in part_textures:
		set_part(name, part_textures[name])
	play_walk()


## --- 파츠 교체 ---------------------------------------------------------

func part_node(part: StringName) -> Polygon2D:
	var found: Node = find_child("%sPart" % part, true, false)
	return found as Polygon2D


func set_part(part: StringName, texture: Texture2D) -> void:
	var node: Polygon2D = part_node(part)
	if node == null:
		push_warning("그런 파츠가 없다: %s" % part)
		return
	node.texture = texture
	if texture == null:
		return
	# 텍스처를 넣으면 색은 흰색으로 — 안 그러면 플레이스홀더 색이 곱해진다
	node.color = Color.WHITE
	if fit_polygon_to_texture:
		_fit(node, texture)


## 텍스처 크기에 맞춘 사각형 폴리곤 + UV. 파츠는 이미 배경이 제거된 PNG라
## 사각형으로 붙여도 실루엣은 텍스처 알파가 만든다.
func _fit(node: Polygon2D, texture: Texture2D) -> void:
	var size := Vector2(texture.get_width(), texture.get_height())
	var center: Vector2 = _center_of(node.polygon)
	var half := size * 0.5
	node.polygon = PackedVector2Array([
		center + Vector2(-half.x, -half.y), center + Vector2(half.x, -half.y),
		center + Vector2(half.x, half.y), center + Vector2(-half.x, half.y),
	])
	node.uv = PackedVector2Array([
		Vector2(0, 0), Vector2(size.x, 0), Vector2(size.x, size.y), Vector2(0, size.y),
	])


func _center_of(points: PackedVector2Array) -> Vector2:
	if points.is_empty():
		return Vector2.ZERO
	var sum := Vector2.ZERO
	for p: Vector2 in points:
		sum += p
	return sum / float(points.size())


## --- 애니메이션 --------------------------------------------------------

func play_walk() -> void:
	_play(&"walk")


func play_idle() -> void:
	# 대기는 걷기를 아주 느리게 돌린다. 별도 애니메이션을 만들 만큼 다르지 않다.
	if _play(&"walk"):
		anim.speed_scale = 0.35


func play_attack() -> void:
	_play(&"attack")


func play_hit() -> void:
	_play(&"hit")


func play_die() -> void:
	if _play(&"die"):
		_locked = true


func is_dead() -> bool:
	return _locked


func revive() -> void:
	_locked = false
	modulate = Color.WHITE
	skeleton.position = Vector2.ZERO
	skeleton.rotation = 0.0
	play_walk()


## 좌우 반전. 뼈대를 통째로 뒤집는다 — 파츠마다 뒤집으면 순서가 꼬인다.
func set_facing(direction: float) -> void:
	if absf(direction) < 0.01:
		return
	skeleton.scale.x = -1.0 if direction < 0.0 else 1.0


func _play(name: StringName) -> bool:
	if _locked:
		return false
	anim.speed_scale = 1.0
	if _current == name and anim.is_playing() and name == &"walk":
		return true
	_current = name
	anim.play(String(name))
	return true


func _on_finished(name: StringName) -> void:
	animation_done.emit(name)
	if name == &"die":
		return
	if name != &"walk":
		_current = &""
		play_walk()
