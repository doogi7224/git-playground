extends RefCounted
class_name AutoPlayer
## 테스트/스크린샷용 자동 조작. 실제 입력 액션을 눌러 Player._move 경로를 그대로 태운다.
##
## 한 방향으로 계속 도망치면 적이 100% 등 뒤로 몰려서 전방 무기가 한 대도 안 맞는다
## (실측: 사거리 안 7마리가 전부 정면 기준 98~178도). 그건 자동조작이 비현실적인 것이지
## 게임이 고장난 게 아니다. 그래서 8자(lemniscate)로 돌게 해서 주기적으로 무리 쪽으로
## 되돌아오게 만든다. 실제 플레이의 카이팅 패턴에 훨씬 가깝다.

## 작은 8자로 돌면 이미 훑고 지나간 자리만 맴돌아서 앞쪽에 적이 없다.
## 크게 돌아 계속 새 지역으로 들어가야 실제 카이팅과 비슷해진다.
##
## ★ 세로 화면(1080x1920, 줌 1.8)에서 보이는 범위는 600x1067 이다.
##   가로 1920 시절 값(750)을 그대로 두면 화면 2.5배를 돌아다니며 적을 통째로
##   따돌린다 -- 3분 20초에 화면에 적이 한 마리도 없는 스크린샷이 나왔다.
##   측정 도구가 화면 밖에서 놀면 그 측정은 게임에 대해 아무것도 말해 주지 않는다.
const SIZE: float = 380.0
const PERIOD: float = 13.0

var _origin: Vector2 = Vector2.ZERO


func target_at(t: float) -> Vector2:
	var a: float = TAU * t / PERIOD
	return _origin + Vector2(SIZE * cos(a), SIZE * 0.7 * sin(a * 2.0))


## 매 프레임 호출. player를 8자 궤적 위의 목표점으로 몬다.
func drive(player: Node2D, t: float) -> void:
	var to: Vector2 = target_at(t) - player.global_position
	var dir: Vector2 = Vector2.ZERO if to.length() < 12.0 else to.normalized()
	_axis(&"move_right", maxf(dir.x, 0.0))
	_axis(&"move_left", maxf(-dir.x, 0.0))
	_axis(&"move_down", maxf(dir.y, 0.0))
	_axis(&"move_up", maxf(-dir.y, 0.0))


func release_all() -> void:
	for a: StringName in [&"move_right", &"move_left", &"move_up", &"move_down"]:
		Input.action_release(a)


func _axis(action: StringName, strength: float) -> void:
	if strength > 0.01:
		Input.action_press(action, strength)
	else:
		Input.action_release(action)
