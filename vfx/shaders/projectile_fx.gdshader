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

// ★ Godot 셰이딩 언어는 fragment() 안의 return 을 막는다.
//   ("Using 'return' in the 'fragment' processor function is incorrect")
//   조기 return 으로 분기를 나눴더니 **셰이더가 통째로 컴파일에 실패**해서
//   투사체가 엉뚱하게 그려지고 있었다. 테스트는 전부 통과했다 -- 셰이더
//   컴파일을 보는 검사가 없었기 때문이다. 지금은 tools/test.sh 가 본다.
void fragment() {
	vec2 p = UV - vec2(0.5);
	float r = length(p);

	// --- 투척물: 살짝 찌그러진 덩어리. 회전하는 물건이라 방향이 없다.
	float a = atan(p.y, p.x);
	float wob = 0.5 + 0.06 * sin(a * 3.0 + v_seed) + 0.04 * sin(a * 5.0 - v_seed);
	float aa_r = max(fwidth(r) * 1.5, 0.004);
	float lob_alpha = 1.0 - smoothstep(wob - aa_r, wob, r);
	float lob_edge = smoothstep(wob * 0.72, wob, r);
	vec3 lob_rgb = mix(COLOR.rgb, COLOR.rgb * 0.35, lob_edge);

	// --- 탄: 머리(UV.x = 1)가 탄두, 꼬리(0)로 갈수록 가늘고 흐리다.
	float head = UV.x;
	float half_w = mix(0.03, 0.5, smoothstep(1.0 - v_tail, 1.0, head));
	float d = abs(p.y);
	float aa_d = max(fwidth(d) * 1.5, 0.004);
	float body = 1.0 - smoothstep(half_w - aa_d, half_w, d);
	// 가운데 심이 가장 밝다 -- 이게 있어야 "빛나는 탄" 으로 읽힌다
	float core = 1.0 - smoothstep(0.0, half_w * 0.55, d);
	vec3 shot_rgb = mix(COLOR.rgb, mix(COLOR.rgb, vec3(1.0), 0.65), core * head);
	float shot_alpha = body * pow(head, 1.5);

	float is_lob = step(0.5, v_lob);
	COLOR = vec4(mix(shot_rgb, lob_rgb, is_lob),
			COLOR.a * mix(shot_alpha, lob_alpha, is_lob));
}
