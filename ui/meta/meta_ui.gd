extends RefCounted
class_name MetaUI
## 메타 화면(메인 메뉴·PX 상점·표창장·출두 신고)이 공유하는 겉모습.
##
## 컨셉은 군대 행정 서류다 — 갱지에 검은 타자기 글씨, 도장은 빨강, 강조는 금색.
## 색을 화면마다 다시 적지 않으려고 여기 모아 둔다.
##
## 규칙 3(런타임 instantiate 금지)은 전장의 적·투사체 이야기다. 메뉴는 화면을 열 때
## 한 번만 짓고 게임 루프 밖에 있으므로 여기서는 그냥 Control 을 만든다.

const PAPER: Color = Color("#E4DCC4")      ## 갱지
const PAPER_DARK: Color = Color("#CBBF9E") ## 갱지 그늘 (줄무늬)
const INK: Color = Color("#2B2A26")        ## 타자기 검정
const INK_FADED: Color = Color("#6E695C")  ## 잠긴 항목
const STAMP: Color = Color("#C8102E")      ## 빨간 인장
const GOLD: Color = Color("#FFC94A")       ## 금색 강조
const BACKDROP: Color = Color("#28301F")   ## 국방색 배경

## --- 세로 폰 기준 치수 ---
##
## 뷰포트가 1080 폭이라 데스크톱 감각으로 잡은 크기가 그대로 오면 다 작다.
## 손가락으로 눌러야 하므로 글자보다 **누를 수 있는 높이**가 먼저다.
##
## 안드로이드 지침의 48dp 는 1080 폭 폰에서 대략 120px 이다. 그보다 밑으로
## 내려가면 오조작이 난다 -- 목록에서 옆 항목을 누르게 된다.
const TOUCH_MIN: float = 116.0        ## 누를 수 있는 것의 최소 높이
const TOUCH_MIN_SMALL: float = 96.0   ## 목록 안의 보조 버튼
const SIDE_MARGIN: int = 40           ## 좌우 여백. 1080 에서 180 을 빼면 720만 남는다

## 글자 크기. 이름은 쓰임새로 짓는다 -- 숫자를 화면마다 흩뿌리면 다시 못 맞춘다.
const FS_TITLE: int = 56
const FS_HEAD: int = 34
const FS_BODY: int = 30
const FS_SUB: int = 24
const FS_TINY: int = 22


static func paper_box(dark: bool = false) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = PAPER_DARK if dark else PAPER
	box.border_color = INK
	box.set_border_width_all(3)
	box.set_corner_radius_all(2)
	box.content_margin_left = 24.0
	box.content_margin_right = 24.0
	box.content_margin_top = 18.0
	box.content_margin_bottom = 18.0
	return box


static func panel(dark: bool = false) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override(&"panel", paper_box(dark))
	return p


## 번역. tr() 은 Node 메서드라 static 함수와 Resource 에서는 못 쓴다 --
## MetaUI 는 static 이고 MetaCondition/PxUpgradeData 는 Resource 다.
## TranslationServer.translate() 가 tr() 이 실제로 부르는 것이고 어디서나 쓸 수 있다.
static func t(text: String) -> String:
	return TranslationServer.translate(text)


## 여기서 한 번 번역하면 메타 화면 전체가 덮인다. 화면마다 tr() 을 흩뿌리면
## 새 항목을 넣을 때 빠뜨리기 쉽다.
## 번역 키는 한국어 원문이라, 표에 없는 문자열은 그대로 한국어로 나온다.
static func label(text: String, size: int = FS_BODY, color: Color = INK) -> Label:
	var l := Label.new()
	l.text = t(text)
	l.add_theme_font_size_override(&"font_size", size)
	l.add_theme_color_override(&"font_color", color)
	return l


static func title(text: String, size: int = FS_TITLE) -> Label:
	var l := label(text, size, INK)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return l


## 빨간 인장. 「합격」 「발급」 처럼 도장 한 방 찍는 자리.
static func stamp(text: String, size: int = FS_SUB) -> Label:
	var l := label(text, size, STAMP)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return l


## 버튼 배경. Godot 기본 테마의 회색이 갱지 위에 그대로 얹히면 서류가 아니라 대화상자가 된다.
static func _button_box(bg: Color, border: Color, width: int = 2) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = bg
	box.border_color = border
	box.set_border_width_all(width)
	box.set_corner_radius_all(2)
	box.content_margin_left = 16.0
	box.content_margin_right = 16.0
	box.content_margin_top = 8.0
	box.content_margin_bottom = 8.0
	return box


static func button(text: String, size: int = FS_BODY) -> Button:
	var b := Button.new()
	b.text = t(text)
	b.add_theme_font_size_override(&"font_size", size)
	b.add_theme_color_override(&"font_color", INK)
	b.add_theme_color_override(&"font_hover_color", STAMP)
	b.add_theme_color_override(&"font_pressed_color", STAMP)
	b.add_theme_color_override(&"font_focus_color", INK)
	b.add_theme_color_override(&"font_disabled_color", INK_FADED)
	b.add_theme_stylebox_override(&"normal", _button_box(PAPER, INK))
	b.add_theme_stylebox_override(&"hover", _button_box(PAPER_DARK, STAMP))
	b.add_theme_stylebox_override(&"pressed", _button_box(PAPER_DARK, STAMP, 3))
	# 포커스 테두리를 따로 둔다 — 키보드만으로 넘길 때 어디에 있는지 보여야 한다.
	b.add_theme_stylebox_override(&"focus", _button_box(Color(0, 0, 0, 0), STAMP))
	b.add_theme_stylebox_override(&"disabled", _button_box(PAPER_DARK, INK_FADED))
	b.custom_minimum_size = Vector2(0.0, TOUCH_MIN)
	return b


static func spacer(height: float) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(0.0, height)
	return c


## 가로 구분선. 서류 양식의 밑줄.
static func rule() -> Control:
	var line := ColorRect.new()
	line.color = INK
	line.custom_minimum_size = Vector2(0.0, 2.0)
	return line


## 12340 → "12,340". 세 자리마다 끊는다. 조건의 "누적 처치 50000" 도 이걸 쓴다.
static func grouped(amount: int) -> String:
	var text: String = str(absi(amount))
	var out: String = ""
	var count: int = 0
	for i in range(text.length() - 1, -1, -1):
		out = text[i] + out
		count += 1
		if count % 3 == 0 and i > 0:
			out = "," + out
	return ("-" if amount < 0 else "") + out


## 월급 표기. 급여 명세서처럼 보이게 세 자리마다 끊고 "원" 을 붙인다.
static func won(amount: int) -> String:
	return grouped(amount) + t("원")
