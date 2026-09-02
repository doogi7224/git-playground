shader_type canvas_item;
render_mode blend_mix;

// 적 전체를 MultiMesh 하나로 그린다. 어떤 적이 어떤 그림을 쓰는지는 텍스처 교체가 아니라
// INSTANCE_CUSTOM.z 가 가리키는 UV 사각형 번호로 정해진다 — 적이 20종이어도 드로우콜 1개.
//
// INSTANCE_CUSTOM = (bob 위상, 흰 플래시 0~1, 아틀라스 번호, 스쿼시)

uniform sampler2D atlas : filter_linear, repeat_disable;
uniform sampler2D normal_atlas : hint_normal, filter_linear, repeat_disable;
uniform bool use_normal = false;
// SpriteAtlas.regions 를 그대로 받는다. EnemyManager.MAX_TYPES 와 크기를 맞춘다.
uniform vec4 regions[32];

uniform float bob_speed : hint_range(0.0, 20.0) = 6.0;
uniform float bob_amount : hint_range(0.0, 0.3) = 0.05;

varying float v_region;
varying float v_flash;

void vertex() {
	// 인스턴스 하나의 네 정점은 값이 같으므로 보간해도 그대로다 (flat 없이 안전)
	v_region = INSTANCE_CUSTOM.z;
	v_flash = INSTANCE_CUSTOM.y;

	VERTEX.y += sin(TIME * bob_speed + INSTANCE_CUSTOM.x) * bob_amount;

	float squash = INSTANCE_CUSTOM.w;
	VERTEX.x *= 1.0 + squash;
	VERTEX.y *= 1.0 - squash;
}

void fragment() {
	vec4 r = regions[clamp(int(v_region + 0.5), 0, 31)];
	// QuadMesh 를 2D에서 쓰면 V가 뒤집힌다 (docs/graphics.md 참조)
	vec2 uv = r.xy + vec2(UV.x, 1.0 - UV.y) * r.zw;

	vec4 tex = texture(atlas, uv);
	vec3 lit = mix(tex.rgb * COLOR.rgb, vec3(1.0), clamp(v_flash, 0.0, 1.0));
	COLOR = vec4(lit, tex.a * COLOR.a);

	if (use_normal) {
		NORMAL_MAP = texture(normal_atlas, uv).rgb;
	}
}
