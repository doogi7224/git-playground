extends Node
## 그래픽/접근성 설정. 기획서 3.3의 연출을 전부 개별로 끌 수 있어야 한다.
##
## ★ 기획서 프롬프트 0은 오토로드 5개를 정했지만 이건 6번째다.
##   히트스톱·화면 흔들림·글로우·데미지 넘버가 전부 "어디서든 물어보는" 값이라
##   GameState에 얹으면 런 상태와 설정이 뒤섞인다. 저장은 SaveSystem이 맡는다.

signal changed()

## 흔들림은 접근성 문제다(기획서 3.3 — 강도 슬라이더로 조절 가능). 0이면 완전히 끈다.
var screen_shake: float = 1.0
var hit_stop: bool = true
var damage_numbers: bool = true
var glow: bool = true
var vignette: bool = true
var chromatic_aberration: bool = true
var lighting: bool = true
var particle_density: float = 1.0
## 저사양 프리셋을 켜면 위 값들이 한꺼번에 내려간다.
var low_spec: bool = false

@export_group("오디오")
var master_volume: float = 1.0
var bgm_volume: float = 0.8
var sfx_volume: float = 1.0

@export_group("성능")
## 화면에 동시에 존재할 수 있는 적 수 상한.
##
## 데스크톱 시절 목표는 3,000마리였다. 모바일에서는 적 시뮬만으로 예산을 넘긴다
## (컨테이너 실측 7.8ms x 폰 2.5배 = 19.5ms > 16.67ms).
## 1,500 은 폰에서 적 시뮬이 예산의 절반 안에 들어오는 선이고, 나머지 절반은
## 무기·투사체·해저드·렌더·GC 몫이다. 자세한 건 docs/performance.md.
##
## 보통 플레이에서는 이 상한에 잘 안 닿는다 (완주 판의 최대 동시 적이 1,000 남짓).
## 밸런스를 바꾸려는 값이 아니라 최악의 순간에 프레임이 무너지지 않게 하는 안전선이다.
var max_enemies: int = 1500

@export_group("언어")
## "ko" / "en". 번역 키는 한국어 원문이라 ko 는 표를 안 거쳐도 그대로 나온다.
var locale: String = "ko"

const LOCALES: Array[String] = ["ko", "en"]
## 언어 이름은 그 언어로 적는다. 영어만 읽는 사람도 "한국어" 를 찾을 수 있어야 한다.
const LOCALE_NAMES: Dictionary = {"ko": "한국어", "en": "English"}

const KEYS: Array[StringName] = [
	&"screen_shake", &"hit_stop", &"damage_numbers", &"glow", &"vignette",
	&"chromatic_aberration", &"lighting", &"particle_density", &"low_spec",
	&"master_volume", &"bgm_volume", &"sfx_volume", &"locale", &"max_enemies",
]


func _ready() -> void:
	load_from(SaveSystem.data.get("settings", {}))
	apply_locale()


## 저장된 언어를 실제로 적용한다. TranslationServer 는 오토로드가 다 뜬 뒤에 건드린다.
func apply_locale() -> void:
	if not LOCALES.has(locale):
		locale = "ko"
	TranslationServer.set_locale(locale)


func set_locale(code: String) -> void:
	if not LOCALES.has(code):
		push_warning("모르는 언어: %s" % code)
		return
	locale = code
	apply_locale()
	notify_changed()


func locale_name(code: String) -> String:
	return String(LOCALE_NAMES.get(code, code))


func to_dictionary() -> Dictionary:
	var out: Dictionary = {}
	for key: StringName in KEYS:
		out[String(key)] = get(key)
	return out


func load_from(source: Dictionary) -> void:
	for key: StringName in KEYS:
		if source.has(String(key)):
			set(key, source[String(key)])
	changed.emit()


func apply_low_spec(enabled: bool) -> void:
	low_spec = enabled
	if enabled:
		glow = false
		chromatic_aberration = false
		damage_numbers = false
		particle_density = 0.35
		lighting = false
		max_enemies = 800
	else:
		glow = true
		chromatic_aberration = true
		damage_numbers = true
		particle_density = 1.0
		lighting = true
		max_enemies = 1500
	notify_changed()


func set_option(key: StringName, value: Variant) -> void:
	if not KEYS.has(key):
		push_warning("모르는 설정: %s" % key)
		return
	set(key, value)
	notify_changed()


func notify_changed() -> void:
	SaveSystem.data["settings"] = to_dictionary()
	changed.emit()
