extends Node
## 메타 화면(메인 메뉴 / 출두 신고 / PX 상점 / 표창장)을 실제 렌더러로 찍는다.
## 헤드리스 단위 테스트는 "글자가 겹쳐서 안 읽힌다" 같은 걸 절대 못 잡는다.
##
##   tools/menu_shot.sh --out-dir=/tmp/menu --salary=99999

const META: String = "res://ui/meta/meta_root.tscn"
const SHOTS: Array[Dictionary] = [
	{"screen": &"", "name": "main"},
	{"screen": &"select", "name": "select"},
	{"screen": &"shop", "name": "shop"},
	{"screen": &"board", "name": "board"},
	{"screen": &"options", "name": "options"},
]

var _out_dir: String = "user://menu"
## 잠긴 항목만 잔뜩 있는 화면은 레이아웃 확인에 쓸모가 없다. 가짜 월급/기록을 넣는다.
var _salary: int = 0
var _fake_progress: bool = false
## 영어 화면은 눈으로 봐야 한다. 헤드리스 테스트는 "번역은 됐는데 글자가 넘친다" 를 못 잡는다.
var _locale: String = ""


func _ready() -> void:
	for arg: String in OS.get_cmdline_user_args():
		if arg.begins_with("--out-dir="):
			_out_dir = arg.substr(10)
		elif arg.begins_with("--salary="):
			_salary = int(arg.substr(9))
		elif arg == "--fake-progress":
			_fake_progress = true
		elif arg.begins_with("--locale="):
			_locale = arg.substr(9)
	_run.call_deferred()


func _run() -> void:
	# 진짜 세이브를 건드리지 않는다.
	SaveSystem.autosave = false
	SaveSystem.data = SaveSystem._default_data()
	if _salary > 0:
		SaveSystem.add_salary(_salary)
	if _fake_progress:
		var s: Dictionary = SaveSystem.stats()
		s["total_kills"] = 12000
		s["total_runs"] = 7
		s["runs_won"] = 1
		s["boss_kills"] = 4
		s["evolutions"] = 2
		s["best_level"] = 34
		s["best_survive_sec"] = 900.0
		SaveSystem.check_commendations()
		SaveSystem.refresh_unlocks()

	if _locale != "":
		TranslationServer.set_locale(_locale)
	DirAccess.make_dir_recursive_absolute(_out_dir)
	var root: Control = load(META).instantiate()
	get_tree().root.add_child(root)
	await get_tree().process_frame

	var failures: int = 0
	for shot: Dictionary in SHOTS:
		var screen: StringName = shot["screen"]
		if screen != &"":
			root._on_open_requested(screen)
		# 컨테이너가 자리를 잡는 데 몇 프레임 걸린다.
		for _i in 4:
			await get_tree().process_frame
		var img: Image = await ScreenGrab.grab(self)
		var path: String = "%s/%s.png" % [_out_dir, shot["name"]]
		if img.save_png(path) != OK:
			failures += 1
			printerr("  [FAIL] 저장 실패: %s" % path)
			continue
		print("  %-8s %s (%dx%d, 잉크 %.1f%%)" % [
				shot["name"], path, img.get_width(), img.get_height(), _ink_ratio(img) * 100.0])
		if _ink_ratio(img) < 0.01:
			failures += 1
			printerr("  [FAIL] %s 화면이 거의 비어 있다." % shot["name"])
	get_tree().quit(1 if failures > 0 else 0)


## 배경색이 아닌 픽셀의 비율. 화면이 통째로 안 그려진 걸 잡는 최소한의 자동 검사다.
## Color 에는 distance_to 가 없다 — 채널 차이를 직접 잰다.
func _ink_ratio(img: Image) -> float:
	var backdrop: Color = MetaUI.BACKDROP
	var hits: int = 0
	var total: int = 0
	for y in range(0, img.get_height(), 8):
		for x in range(0, img.get_width(), 8):
			total += 1
			var c: Color = img.get_pixel(x, y)
			var diff: float = absf(c.r - backdrop.r) + absf(c.g - backdrop.g) \
					+ absf(c.b - backdrop.b)
			if diff > 0.08:
				hits += 1
	return float(hits) / maxf(1.0, float(total))
