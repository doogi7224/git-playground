shader_type canvas_item;
render_mode blend_mix;

// 바닥 얼룩. 흙 자국·잔디 뭉치·기름 자국 같은 것을 MultiMesh 하나로 흩뿌린다.
// 규칙 1과 같은 이유다 — 개별 Node 로 깔면 수백 개가 된다. 드로우콜 1개.
//
// INSTANCE_CUSTOM = (모양 시드, 안쪽 밝기, 미사용, 미사용)
//
// 애니메이션이 없다. 바닥이 흔들리면 멀미가 난다 -- blob_multimesh 를 그대로
// 쓰면 bob 이 딸려 와서 땅이 출렁인다.

varying float v_seed;
varying float v_core;

void vertex() {
	v_seed = INSTANCE_CUSTOM.x;
	v_core = INSTANCE_CUSTOM.y;
}

void fragment() {
	vec2 p = UV - vec2(0.5);
	float r = length(p);
	float a = atan(p.y, p.x);

	// 완벽한 원은 스티커처럼 보인다. 각도에 따라 반지름을 흔들어 찌그러뜨린다.
	float wob = 0.5
		+ 0.070 * sin(a * 3.0 + v_seed)
		+ 0.045 * sin(a * 5.0 - v_seed * 1.7)
		+ 0.030 * sin(a * 8.0 + v_seed * 2.3);

	float aa = max(fwidth(r) * 1.5, 0.004);
	// 가장자리를 너무 부드럽게 하면 땅이 아니라 안개가 된다. 살짝만 흐린다.
	float alpha = 1.0 - smoothstep(wob - aa * 1.5, wob, r);

	// 가운데가 조금 더 진하다. 평평한 색 덩어리가 아니라 자국처럼 보이게.
	float core = 1.0 - smoothstep(0.0, wob, r);
	vec3 base = COLOR.rgb * mix(1.0, v_core, core * 0.7);

	COLOR = vec4(base, COLOR.a * alpha);
}
