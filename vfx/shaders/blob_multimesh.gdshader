shader_type canvas_item;
render_mode blend_mix;

// 화이트박스용 MultiMesh 블롭. 적/픽업이 같이 쓴다.
// 인스턴스 색 = 타입 색, INSTANCE_CUSTOM = (bob 위상, 흰 플래시 0~1, 아틀라스 인덱스, 스쿼시)
// M2에서 아틀라스 UV 샘플링으로 교체된다. 애니메이션은 여기서 GPU로 처리한다. (기획서 6.2)

uniform float outline_strength : hint_range(0.0, 1.0) = 1.0;
uniform float bob_speed : hint_range(0.0, 20.0) = 6.0;
uniform float bob_amount : hint_range(0.0, 0.3) = 0.05;

varying float v_flash;

void vertex() {
	v_flash = INSTANCE_CUSTOM.y;

	// 걷는 느낌: 개체별 위상으로 위아래 흔들림
	VERTEX.y += sin(TIME * bob_speed + INSTANCE_CUSTOM.x) * bob_amount;

	// 스쿼시 & 스트레치 (정점 셰이더에서. 기획서 3.3)
	float squash = INSTANCE_CUSTOM.w;
	VERTEX.x *= 1.0 + squash;
	VERTEX.y *= 1.0 - squash;
}

void fragment() {
	float r = length(UV - vec2(0.5));
	float aa = max(fwidth(r) * 1.5, 0.004);
	float alpha = 1.0 - smoothstep(0.5 - aa, 0.5, r);

	// 두꺼운 어두운 외곽선 (기획서 3.2: 적은 외곽선 어둡게, 실루엣 단순화)
	float edge = smoothstep(0.36, 0.44, r) * outline_strength;
	vec3 base = mix(COLOR.rgb, COLOR.rgb * 0.28, edge);

	// 피격 흰 플래시
	vec3 lit = mix(base, vec3(1.0), clamp(v_flash, 0.0, 1.0));

	COLOR = vec4(lit, COLOR.a * alpha);
}
