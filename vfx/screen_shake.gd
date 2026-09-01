extends Camera2D
class_name ScreenShake
## Perlin 노이즈 기반 화면 흔들림. 기획서 3.3.
##
## 랜덤 오프셋(=화이트 노이즈)으로 흔들면 그냥 지직거린다. 노이즈를 시간축으로 훑으면
## 프레임 간 이동이 이어져서 "흔들린다"는 느낌이 난다.
##
## ★ 강도 슬라이더는 접근성 문제다. Settings.screen_shake = 0 이면 완전히 꺼진다.

const NOISE_SPEED: float = 42.0
const DECAY: float = 4.5
const MAX_OFFSET: float = 26.0
const MAX_ROTATION_DEG: float = 1.6

var _noise: FastNoiseLite = FastNoiseLite.new()
var _trauma: float = 0.0
var _time: float = 0.0


func _ready() -> void:
	_noise.noise_type = FastNoiseLite.TYPE_PERLIN
	_noise.frequency = 0.8
	_noise.seed = randi()
	EventBus.screen_shake_requested.connect(add_trauma)


## strength 는 대략 1~5 범위로 쓴다. 누적되지만 1.0에서 잘린다.
func add_trauma(strength: float, _duration: float = 0.0) -> void:
	_trauma = clampf(_trauma + strength * 0.06, 0.0, 1.0)


func _process(delta: float) -> void:
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
