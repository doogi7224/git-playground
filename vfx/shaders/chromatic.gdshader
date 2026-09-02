shader_type canvas_item;
render_mode blend_mix;

// 색수차. 기획서 3.3 "아주 약한 색수차 (강하면 촌스러움)".
//
// ★ 이건 화면 텍스처가 반드시 필요하다. 그래서 GL Compatibility 렌더러에서는
//   카메라가 원점에서 멀어질 때 백버퍼가 비는 문제가 있다(vignette.gdshader 주석 참조).
//   vfx/post_process.gd 가 Compatibility 를 감지하면 이 노드를 꺼버린다.

uniform sampler2D screen_texture : hint_screen_texture, repeat_disable, filter_linear;
uniform float aberration : hint_range(0.0, 4.0) = 0.8;

void fragment() {
	vec2 uv = SCREEN_UV;
	vec2 center = uv - vec2(0.5);
	// 가장자리에서만. 가운데까지 번지면 눈이 아프다.
	vec2 offset = center * aberration * 0.001 * length(center);
	vec3 color;
	color.r = texture(screen_texture, uv + offset).r;
	color.g = texture(screen_texture, uv).g;
	color.b = texture(screen_texture, uv - offset).b;
	COLOR = vec4(color, 1.0);
}
