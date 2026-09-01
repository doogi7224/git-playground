shader_type canvas_item;
render_mode blend_mix, unshaded;

// 데미지 넘버 전용. 개별 Label 금지(기획서 6.2) — 글리프 하나가 MultiMesh 인스턴스 하나다.
// INSTANCE_CUSTOM 이 아틀라스 안에서 이 글리프가 차지하는 UV 사각형(x, y, w, h)이다.
//
// 아틀라스는 uniform 으로 받는다. MultiMeshInstance2D 의 texture 로 주면
// canvas_item 의 COLOR 가 이미 기본 UV로 샘플된 값이라 두 번 샘플하게 된다.

uniform sampler2D atlas : filter_linear, repeat_disable;

varying vec4 v_uv_rect;

void vertex() {
	v_uv_rect = INSTANCE_CUSTOM;
}

void fragment() {
	// ★ QuadMesh 를 MultiMeshInstance2D 로 쓰면 세로가 뒤집힌다.
	//   QuadMesh 는 3D 기준(+Y 위)으로 UV를 만드는데 2D는 +Y가 아래라서 V가 반대가 된다.
	//   blob 셰이더는 원을 그려서(상하 대칭) 눈치채지 못했지만, 글자는 바로 드러난다.
	//   실제로 "1"과 "4"가 거꾸로 찍혀 있었다. "3"은 상하가 비슷해서 멀쩡해 보였다.
	vec2 flipped = vec2(UV.x, 1.0 - UV.y);
	vec2 uv = v_uv_rect.xy + flipped * v_uv_rect.zw;
	// 아틀라스는 흰 글자 + 어두운 외곽선이라 알파만 쓰고 색은 인스턴스 색을 따른다
	vec4 tex = texture(atlas, uv);
	COLOR = vec4(mix(vec3(0.0), COLOR.rgb, tex.r), COLOR.a * tex.a);
}
