extends RefCounted
class_name ScreenGrab
## 스크린샷 캡처 공통 로직.

## 화면을 안전하게 캡처한다.
## 포스트프로세싱이 hint_screen_texture 를 쓰면 백버퍼가 채워지는 데 몇 프레임 걸린다.
## 한 프레임만 기다리고 찍으면 월드가 통째로 비어 있는 이미지가 나온다(실제로 겪었다).
static func grab(node: Node, frames: int = 4) -> Image:
	for _i in maxi(1, frames):
		await node.get_tree().process_frame
		await RenderingServer.frame_post_draw
	return node.get_viewport().get_texture().get_image()
