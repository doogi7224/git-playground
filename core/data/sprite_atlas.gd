extends Resource
class_name SpriteAtlas
## 아트 파이프라인이 구워낸 아틀라스 한 장. tools/art_pipeline.py --atlas 가 만든다.
##
## 적 전체가 MultiMesh 하나로 그려지므로(드로우콜 1), 어떤 적이 어떤 그림을 쓰는지는
## 텍스처 교체가 아니라 **UV 사각형 번호**로 정해진다. 그 번호표가 이 리소스다.

@export var texture: Texture2D = null
## 노멀맵 아틀라스. 같은 배치로 구워지므로 regions 를 그대로 쓴다. (기획서 3.3 입체감)
@export var normal_texture: Texture2D = null

## regions[i] 는 names[i] 의 UV 사각형 (x, y, w, h) — 전부 0~1 정규화.
@export var names: Array[StringName] = []
@export var regions: PackedVector4Array = PackedVector4Array()
## 원본 픽셀 크기. 스프라이트 비율을 지키려면 필요하다.
@export var sizes: PackedVector2Array = PackedVector2Array()


func index_of(name: StringName) -> int:
	return names.find(name)


func region_of(index: int) -> Vector4:
	if index < 0 or index >= regions.size():
		return Vector4(0.0, 0.0, 1.0, 1.0)
	return regions[index]


func size_of(index: int) -> Vector2:
	if index < 0 or index >= sizes.size():
		return Vector2.ONE
	return sizes[index]


func is_valid() -> bool:
	return texture != null and not regions.is_empty()
