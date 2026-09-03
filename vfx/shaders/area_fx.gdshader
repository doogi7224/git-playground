shader_type canvas_item;
render_mode blend_mix;

// 장판(웅덩이·기름·물). 예전에는 blob_multimesh 를 그대로 써서 **평평한 원**이었다.
// 바닥에 깔린 액체로 안 보이고 색 동그라미로 보였다.
//
// INSTANCE_CUSTOM = (모양 시드, 미사용, 미사용, 미사용)
//
// 여기서 하는 일:
//   - 가장자리를 각도별로 흔들어 찌그러뜨린다 (완벽한 원은 액체가 아니다)
//   - 테두리를 진하게 (액체 표면장력)
//   - 안쪽을 아주 천천히 일렁이게 -- 바닥에 고여 있다는 신호

uniform float ripple_speed : hint_range(0.0, 4.0) = 0.9;

varying float v_seed;

void vertex() {
	v_seed = INSTANCE_CUSTOM.x;
}

void fragment() {
	vec2 p = UV - vec2(0.5);
	float r = length(p);
	float a = atan(p.y, p.x);

	float wob = 0.5
		+ 0.055 * sin(a * 3.0 + v_seed)
		+ 0.035 * sin(a * 5.0 - v_seed * 1.6)
		+ 0.020 * sin(a * 7.0 + TIME * ripple_speed + v_seed);

	float aa = max(fwidth(r) * 1.5, 0.004);
	float alpha = 1.0 - smoothstep(wob - aa * 2.0, wob, r);

	// 테두리가 진하다. 이게 웅덩이의 윤곽을 만든다.
	float rim = smoothstep(wob * 0.76, wob * 0.99, r);
	// 안쪽 일렁임 -- 아주 약해야 한다. 세면 바닥이 끓는 것처럼 보인다.
	float swirl = 0.5 + 0.5 * sin(r * 16.0 - TIME * ripple_speed * 1.6 + v_seed);

	vec3 base = COLOR.rgb * (0.92 + 0.08 * swirl);
	vec3 lit = mix(base, base * 1.45, rim);

	COLOR = vec4(lit, COLOR.a * alpha * (0.72 + 0.28 * rim));
}
