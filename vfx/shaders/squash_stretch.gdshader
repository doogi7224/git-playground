shader_type canvas_item;

// 스쿼시 & 스트레치. 기획서 3.3: "Sprite2D 스케일 애니 아님, 셰이더로".
//
// 스케일 애니메이션과 다른 점은 발밑이 고정된다는 것이다. 발이 붙은 채로 위아래만
// 눌리고 좌우로 퍼져야 착지와 피격이 무겁게 보인다. 위아래가 같이 줄면 그냥 작아진 것처럼 보인다.
//
//   squash > 0 : 납작 + 옆으로 퍼짐 (착지, 피격)
//   squash < 0 : 길쭉 + 좁아짐 (점프, 대시)
//
// 피벗: sprite_height 를 0보다 크게 주면 pivot_y(0=위, 1=발밑) 기준으로 고정된다.
// 0이면 스프라이트 원점 기준이다 — Sprite2D 의 offset 을 발밑에 맞춰뒀다면 그게 더 간단하다.

uniform float squash : hint_range(-0.6, 0.6) = 0.0;
uniform float sprite_height = 0.0;
uniform float pivot_y : hint_range(0.0, 1.0) = 1.0;
uniform float wobble_speed = 0.0;
uniform float wobble_amount : hint_range(0.0, 0.3) = 0.0;

void vertex() {
	float s = squash;
	if (wobble_speed > 0.0) {
		s += sin(TIME * wobble_speed) * wobble_amount;
	}

	VERTEX.x *= 1.0 + s;

	if (sprite_height > 0.0) {
		// 피벗에서의 거리만 줄인다. UV.y 는 위 0, 아래 1.
		float from_pivot = sprite_height * (UV.y - pivot_y);
		VERTEX.y -= from_pivot * s;
	} else {
		VERTEX.y *= 1.0 - s;
	}
}
