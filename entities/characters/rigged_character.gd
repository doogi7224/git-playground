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
## 그림 크기를 뼈대 스케일에 맞춰 자동 조정할지. 끄면 원본 픽셀 크기 그대로 붙는다.
@export var fit_texture_to_slot: bool = true

signal animation_done(name: StringName)

@onready var skeleton: Skeleton2D = $Skeleton2D
@onready var anim: AnimationPlayer = $AnimationPlayer

## 걷기/대기는 낮은 우선순위다. 공격이나 피격 중에 이동한다고 애니메이션을 끊으면
## 공격 모션이 매 프레임 처음으로 돌아가서 아무것도 안 보인다.
const LOW_PRIORITY: Array[StringName] = [&"walk"]

var _current: StringName = &""
var _locked: bool = false   ## 사망 중에는 다른 애니메이션으로 못 넘어간다


func _ready() -> void:
	anim.animation_finished.connect(_on_finished)
	for name: StringName in part_textures:
		set_part(name, part_textures[name])
	play_walk()


## --- 파츠 교체 ---------------------------------------------------------

## 플레이스홀더 도형 (텍스처가 없을 때 보이는 것)
func part_node(part: StringName) -> Polygon2D:
	return find_child("%sPart" % part, true, false) as Polygon2D


## 실제 그림이 붙는 슬롯
func part_sprite(part: StringName) -> Sprite2D:
	return find_child("%sSprite" % part, true, false) as Sprite2D


## ★ 그림은 Sprite2D 에 붙인다.
##   Polygon2D 에 AtlasTexture 를 물리면 텍스처가 갈래갈래 찢어진다 —
##   AtlasTexture.get_rid() 가 region 이 아니라 **전체 아틀라스**의 RID를 돌려주는데
##   Polygon2D 의 UV 는 get_size()(= region 크기) 기준이라 배율이 안 맞기 때문이다.
##   Sprite2D 는 region 을 스스로 처리하므로 이 문제가 없다.
func set_part(part: StringName, texture: Texture2D) -> void:
	var placeholder: Polygon2D = part_node(part)
	var sprite: Sprite2D = part_sprite(part)
	if sprite == null or placeholder == null:
		push_warning("그런 파츠가 없다: %s" % part)
		return

	sprite.texture = texture
	sprite.visible = texture != null
	# 그림이 붙으면 플레이스홀더 도형은 감춘다.
	#
	# ★ 슬롯 하나에 도형이 여러 개일 수 있다. 삽은 자루(WeaponPart)와 날(WeaponBlade)
	#   두 폴리곤으로 그려 놨는데, %sPart 하나만 감추면 **날이 그대로 남는다**.
	#   실제로 실아트를 넣은 뒤에도 플레이어 손 옆에 밝은 회색 사각형이 계속 따라다녔고,
	#   글로우까지 먹어서 화면에서 제일 밝은 물건이 돼 있었다. 같은 뼈에 달린
	#   플레이스홀더 도형은 전부 같이 처리한다.
	for sibling: Node in placeholder.get_parent().get_children():
		var poly := sibling as Polygon2D
		if poly != null:
			poly.visible = texture == null
	if texture == null:
		return

	if fit_texture_to_slot:
		# 슬롯(플레이스홀더 폴리곤)의 높이에 맞춰 비율을 지키며 줄인다.
		# 파츠마다 원본 해상도가 달라도 뼈대 비율이 유지된다.
		var slot_height: float = _slot_height(placeholder)
		var tex_height: float = float(maxi(texture.get_height(), 1))
		if slot_height > 0.0:
			sprite.scale = Vector2.ONE * (slot_height / tex_height)

	# 높이만 맞추면 **폭은 그림 비율대로** 정해진다. 화이트박스 몸통은 62 넓이인데
	# 실제 상의 그림은 48 밖에 안 돼서, 어깨(x = +-27)에 달린 팔이 옷 밖으로
	# 튀어나와 있었다. 몸통이 바뀔 때마다 어깨를 실제 그림 폭에 다시 맞춘다.
	if part == &"Torso":
		_align_shoulders(sprite)


## 어깨 관절을 상의 그림의 실제 가장자리 안쪽으로 옮긴다.
## 팔뿌리가 옷에 묻혀야 한 사람으로 보인다 -- 이 값만큼 파고든다.
const SHOULDER_INSET: float = 6.0


func _align_shoulders(torso_sprite: Sprite2D) -> void:
	if torso_sprite.texture == null:
		return
	var half_width: float = float(torso_sprite.texture.get_width()) * torso_sprite.scale.x * 0.5
	var x: float = maxf(4.0, half_width - SHOULDER_INSET)
	for side: Array in [[&"ArmL", -1.0], [&"ArmR", 1.0]]:
		var bone: Bone2D = find_child(String(side[0]), true, false) as Bone2D
		if bone == null:
			continue
		bone.position.x = x * float(side[1])
		# rest 를 같이 안 옮기면 Skeleton2D 의 바인드 포즈와 어긋나 팔이 뒤틀린다.
		var rest: Transform2D = bone.rest
		rest.origin.x = bone.position.x
		bone.rest = rest


func _slot_height(node: Polygon2D) -> float:
	if node.polygon.is_empty():
		return 0.0
	var min_y: float = node.polygon[0].y
	var max_y: float = min_y
	for p: Vector2 in node.polygon:
		min_y = minf(min_y, p.y)
		max_y = maxf(max_y, p.y)
	return max_y - min_y


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
	# 낮은 우선순위는 높은 우선순위 애니메이션이 도는 중에는 무시한다
	if LOW_PRIORITY.has(name) and anim.is_playing() and not LOW_PRIORITY.has(_current):
		return false
	anim.speed_scale = 1.0
	# 이미 같은 애니메이션이 돌고 있으면 다시 시작하지 않는다.
	# 접촉 피해처럼 매 프레임 들어오는 신호로 hit 을 재시작하면 첫 프레임에 멈춰서
	# (오버브라이트 modulate 구간) 캐릭터가 하얗게 굳어버린다.
	if _current == name and anim.is_playing():
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
