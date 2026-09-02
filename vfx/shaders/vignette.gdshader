shader_type canvas_item;
render_mode blend_mix;

// 비네트. 화면 전체를 덮는 ColorRect 에 붙인다.
//
// ★ 화면 텍스처(hint_screen_texture)를 쓰지 않는다.
//   원래 색수차와 한 셰이더에 넣었다가, GL Compatibility 렌더러에서 **카메라가 원점에서
//   1,300px 넘게 멀어지면 백버퍼 복사가 빈 화면을 돌려주는** 문제를 만났다.
//   화면이 통째로 단색으로 덮여버린다. 비네트는 원래 백버퍼가 필요 없다 — 어두운 테두리를
//   알파로 얹기만 하면 된다. 어느 렌더러에서도 안전하고 더 싸다.
//   대비/채도는 WorldEnvironment 의 Adjustments 가 맡는다(기획서 3.3도 그렇게 적혀 있다).

uniform float strength : hint_range(0.0, 1.5) = 0.55;
uniform float softness : hint_range(0.05, 1.0) = 0.45;
uniform vec4 tint : source_color = vec4(0.02, 0.03, 0.02, 1.0);

void fragment() {
	float d = length(SCREEN_UV - vec2(0.5));
	// 가운데는 0, 가장자리로 갈수록 1
	float v = smoothstep(0.85 - softness, 0.85, d);
	COLOR = vec4(tint.rgb, clamp(v * strength, 0.0, 1.0));
}
