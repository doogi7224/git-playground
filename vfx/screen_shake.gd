extends Camera2D
class_name ScreenShake
## 카메라 추적 + Perlin 노이즈 화면 흔들림. 기획서 3.3.
##
## ★ Godot 내장 position_smoothing 을 쓰지 않는다.
##   내장 스무딩은 보간 가중치를 speed * delta 로 쓰는데 이 값이 클램프되지 않는다.
##   프레임이 한 번 크게 튀면(로딩 히치, 저사양 기기, 배속 테스트) 가중치가 1을 넘어
##   진동하다가 발산한다. 실제로 카메라 변환이 -10,000,000 → NaN 이 되면서
##   **화면에서 월드가 통째로 사라졌다.** UI는 CanvasLayer라 남아 있어서 더 헷갈렸다.
##
##   여기서는 1 - exp(-speed * delta) 를 쓴다. delta 가 아무리 커도 0~1 안에 있어서
##   최악의 경우 "즉시 따라붙기"가 될 뿐 절대 발산하지 않는다.
##
## 랜덤 오프셋(=화이트 노이즈)으로 흔들면 그냥 지직거린다. 노이즈를 시간축으로 훑으면
## 프레임 간 이동이 이어져서 "흔들린다"는 느낌이 난다.
##
## ★ 강도 슬라이더는 접근성 문제다. Settings.screen_shake = 0 이면 완전히 꺼진다.

const FOLLOW_SPEED: float = 9.0
const NOISE_SPEED: float = 42.0
const DECAY: float = 4.5
const MAX_OFFSET: float = 26.0
const MAX_ROTATION_DEG: float = 1.6

var _noise: FastNoiseLite = FastNoiseLite.new()
var _trauma: float = 0.0
var _time: float = 0.0
var _target: Node2D = null
var _shake: Vector2 = Vector2.ZERO


func _ready() -> void:
	_noise.noise_type = FastNoiseLite.TYPE_PERLIN
	_noise.frequency = 0.8
	_noise.seed = randi()
	# 부모를 따라가되 지연을 직접 준다. top_level 이라 부모 변환을 상속하지 않는다.
	_target = get_parent() as Node2D
	position_smoothing_enabled = false
	top_level = true
	if _target != null:
		global_position = _target.global_position
	EventBus.screen_shake_requested.connect(add_trauma)


## 씬 전환이나 순간이동 후 지연 없이 붙인다.
func snap_to_target() -> void:
	if _target != null:
		global_position = _target.global_position


## strength 는 대략 1~5 범위로 쓴다. 누적되지만 1.0에서 잘린다.
func add_trauma(strength: float, _duration: float = 0.0) -> void:
	_trauma = clampf(_trauma + strength * 0.06, 0.0, 1.0)


func _process(delta: float) -> void:
	_follow(delta)
	_apply_shake(delta)


## 지수 스무딩. 가중치가 항상 0~1이라 delta 가 아무리 커도 발산하지 않는다.
func _follow(delta: float) -> void:
	if _target == null:
		return
	var weight: float = 1.0 - exp(-FOLLOW_SPEED * maxf(delta, 0.0))
	global_position = global_position.lerp(_target.global_position, weight)


func _apply_shake(delta: float) -> void:
	if _trauma <= 0.0:
		if offset != Vector2.ZERO:
			offset = Vector2.ZERO
			rotation = 0.0
		return

	_time += delta * NOISE_SPEED
	# 흔들림은 trauma의 제곱으로 — 약한 타격은 거의 안 흔들리고 강타만 크게 흔든다
	var amount: float = _trauma * _trauma * Settings.screen_shake
	offset = Vector2(
		_noise.get_noise_2d(_time, 0.0),
		_noise.get_noise_2d(0.0, _time)) * MAX_OFFSET * amount
	rotation = deg_to_rad(_noise.get_noise_2d(_time, _time) * MAX_ROTATION_DEG * amount)

	_trauma = maxf(0.0, _trauma - DECAY * delta * 0.14)


func get_trauma() -> float:
	return _trauma
