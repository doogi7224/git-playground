shader_type canvas_item;
render_mode blend_mix;

// 투사체. 진행 방향으로 늘린 쿼드에 밝은 심 + 뒤로 끌리는 꼬리를 그린다.
//
// 예전에는 blob_multimesh 를 그대로 써서 **완벽한 원**이 날아갔다. 어디로 가는
// 중인지가 그림에 안 나와서 총알이 아니라 점으로 보였다.
//
// INSTANCE_CUSTOM = (모양 시드, 꼬리 길이 0~1, 투척물이면 1, 미사용)
//   투척물(LOB)은 회전하는 덩어리라 꼬리 대신 둥글게 그린다.

varying float v_seed;
varying float v_tail;
varying float v_lob;

void vertex() {
	v_seed = INSTANCE_CUSTOM.x;
	v_tail = INSTANCE_CUSTOM.y;
	v_lob = INSTANCE_CUSTOM.z;
}

void fragment() {
	vec2 p = UV - vec2(0.5);

	if (v_lob > 0.5) {
		// 투척물: 살짝 찌그러진 덩어리. 회전하는 물건이라 방향이 없다.
		float a = atan(p.y, p.x);
		float wob = 0.5 + 0.06 * sin(a * 3.0 + v_seed) + 0.04 * sin(a * 5.0 - v_seed);
		float r = length(p);
		float aa = max(fwidth(r) * 1.5, 0.004);
		float alpha = 1.0 - smoothstep(wob - aa, wob, r);
		float edge = smoothstep(wob * 0.72, wob, r);
		COLOR = vec4(mix(COLOR.rgb, COLOR.rgb * 0.35, edge), COLOR.a * alpha);
		return;
	}

	// 머리(UV.x = 1)가 탄, 꼬리(0)로 갈수록 가늘고 흐리다.
	float head = UV.x;
	// 탄두는 둥글게, 꼬리는 뾰족하게
	float half_w = mix(0.03, 0.5, smoothstep(1.0 - v_tail, 1.0, head));
	float d = abs(p.y);
	float aa = max(fwidth(d) * 1.5, 0.004);
	float body = 1.0 - smoothstep(half_w - aa, half_w, d);

	// 가운데 심이 가장 밝다 -- 이게 있어야 "빛나는 탄" 으로 읽힌다
	float core = 1.0 - smoothstep(0.0, half_w * 0.55, d);
	vec3 lit = mix(COLOR.rgb, mix(COLOR.rgb, vec3(1.0), 0.65), core * head);

	// 꼬리는 뒤로 갈수록 투명
	float fade = mix(0.0, 1.0, pow(head, 1.5));
	COLOR = vec4(lit, COLOR.a * body * fade);
}
