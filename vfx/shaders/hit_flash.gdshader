shader_type canvas_item;

// 피격 시 2프레임 흰 플래시. 기획서 3.3 히트 필 3종 중 첫 번째.
// 개별 스프라이트(플레이어, 보스)용. 적 무리는 blob_multimesh 셰이더가
// INSTANCE_CUSTOM 으로 같은 일을 한다(3,000마리에 머티리얼을 하나씩 줄 수는 없다).
//
// 쓰는 법: vfx/hit_flash.gd 의 HitFlash.trigger(canvas_item) 를 부른다.

uniform float flash : hint_range(0.0, 1.0) = 0.0;
uniform vec4 flash_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);

void fragment() {
	// canvas_item 프래그먼트에서 COLOR 는 이미 texture * modulate 다. 다시 샘플하면 두 번 곱해진다.
	// 알파는 건드리지 않는다 — 실루엣이 커지면 안 된다.
	COLOR.rgb = mix(COLOR.rgb, flash_color.rgb, flash);
}
