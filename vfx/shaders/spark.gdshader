shader_type canvas_item;
render_mode blend_add;

// 타격 스파크. 맞은 자리에서 사방으로 튀는 짧은 선.
//
// 인스턴스 하나가 파편 하나다. 쿼드를 진행 방향으로 눌러서 늘린 뒤, 여기서
// 가늘고 뾰족한 형태로 깎는다. 개별 Node 나 GPUParticles 를 쓰지 않는 이유는
// 규칙 1과 같다 -- 한 프레임에 수백 개가 튄다. 드로우콜 1개.
//
// INSTANCE_CUSTOM = (수명 0~1, 미사용, 미사용, 미사용)
//
// blend_add 다. 스파크는 빛이지 물감이 아니다.

varying float v_life;

void vertex() {
	v_life = INSTANCE_CUSTOM.x;
}

void fragment() {
	// UV.x 를 따라 흐르는 파편. 머리가 굵고 꼬리로 갈수록 가늘어진다.
	float head = UV.x;
	float half_w = mix(0.02, 0.42, pow(head, 2.2));
	float d = abs(UV.y - 0.5);

	float aa = max(fwidth(d) * 1.5, 0.004);
	float body = 1.0 - smoothstep(half_w - aa, half_w, d);

	// 앞머리가 가장 밝다
	float bright = pow(head, 1.4);
	// 수명이 다하면 사라진다. 끝에서 급히 꺼지는 편이 잔상이 안 남는다.
	float fade = pow(clamp(v_life, 0.0, 1.0), 0.7);

	COLOR = vec4(COLOR.rgb * (0.45 + 0.55 * bright), COLOR.a * body * bright * fade);
}
