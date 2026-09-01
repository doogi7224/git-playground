shader_type canvas_item;

// 비네트 + 아주 약한 색수차. 기획서 3.3 — "강하면 촌스러움".
// 화면 전체를 덮는 ColorRect에 붙인다. WorldEnvironment의 글로우와는 별개다.

uniform sampler2D screen_texture : hint_screen_texture, repeat_disable, filter_linear;

uniform float vignette_strength : hint_range(0.0, 1.5) = 0.55;
uniform float vignette_softness : hint_range(0.05, 1.0) = 0.45;
uniform vec4 vignette_color : source_color = vec4(0.02, 0.03, 0.02, 1.0);
uniform float aberration : hint_range(0.0, 4.0) = 0.8;   // 픽셀 단위. 1 근처가 한계
uniform float saturation : hint_range(0.0, 2.0) = 1.05;
uniform float contrast : hint_range(0.5, 2.0) = 1.10;

void fragment() {
	vec2 uv = SCREEN_UV;
	vec2 center = uv - vec2(0.5);
	float dist = length(center);

	// 색수차는 화면 가장자리에서만. 가운데까지 번지면 눈이 아프다.
	vec2 offset = center * aberration * 0.001 * dist;
	vec3 color;
	color.r = texture(screen_texture, uv + offset).r;
	color.g = texture(screen_texture, uv).g;
	color.b = texture(screen_texture, uv - offset).b;

	// 대비 +10%, 채도 +5% (기획서 3.3의 Adjustments를 여기서 같이 처리)
	color = (color - 0.5) * contrast + 0.5;
	float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
	color = mix(vec3(luma), color, saturation);

	float vignette = smoothstep(0.85, 0.85 - vignette_softness, dist);
	color = mix(vignette_color.rgb, color, mix(1.0, vignette, vignette_strength));

	COLOR = vec4(color, 1.0);
}
