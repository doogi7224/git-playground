extends Node2D
class_name PlayerMarker
## 플레이어 발밑 표식. 접지 그림자 + 얇은 시안 링.
##
## 기획서 3.2 는 "플레이어는 항상 화면에서 가장 밝음" 이라고 못박았는데, 실제로는
## 신병(recruit) 적이 플레이어와 **같은 올리브 군복**이고 수십 마리가 몰린다.
## 확대해 보면 적 스프라이트가 플레이어보다 크고 진하기까지 하다 -- 한가운데가
## 어디인지 한눈에 안 잡혔다.
##
## PointLight2D 가 이미 있지만 CanvasModulate 가 0.9 로 밝아서 거의 티가 안 나고,
## Settings.lighting 을 끄면 통째로 사라진다. 이 링은 조명과 무관하게 늘 있다.
##
## 3/4 부감이라 원이 아니라 눌린 타원이다. 원을 그리면 공처럼 뜬다.

const SHADOW_COLOR: Color = Color(0.0, 0.0, 0.0, 0.30)
const RING_COLOR: Color = Color("#3FE0D0")   ## 기획서 3.2: 시안은 플레이어 독점색
const RADIUS: float = 23.0
const SQUASH: float = 0.42                   ## 세로 눌림. 부감 각도
const FOOT_OFFSET: float = 19.0


func _ready() -> void:
	# 리그(z 10 안쪽)보다 뒤. 발밑에 깔려야지 몸을 덮으면 안 된다.
	z_index = -1
	z_as_relative = true


func _draw() -> void:
	# draw_circle 을 눌러서 타원으로 만든다. 타원 전용 API 가 없다.
	draw_set_transform(Vector2(0.0, FOOT_OFFSET), 0.0, Vector2(1.0, SQUASH))

	# 접지 그림자 — 캐릭터가 땅에 붙어 있다는 신호
	draw_circle(Vector2.ZERO, RADIUS, SHADOW_COLOR)

	# 링 두 겹. 안쪽이 진하고 바깥이 옅어서 번지는 느낌이 난다.
	var inner: Color = RING_COLOR
	inner.a = 0.55
	draw_arc(Vector2.ZERO, RADIUS * 0.92, 0.0, TAU, 32, inner, 2.5, true)
	var outer: Color = RING_COLOR
	outer.a = 0.18
	draw_arc(Vector2.ZERO, RADIUS * 1.10, 0.0, TAU, 32, outer, 4.0, true)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
