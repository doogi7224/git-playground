extends Node
## 밸런스 예산표. 웨이브 테이블과 적 수치를 실제로 로드해서
## "한 판에 적이 몇 마리 나오고 짬이 얼마나 나오는가" 를 계산한다.
##
##   tools/balance.sh [--target=125]
##
## 자동 플레이는 한 판에 몇 분씩 걸리는데, 이 표는 즉시 나온다.
## 곡선을 바꿀 때마다 20분을 돌려 볼 수는 없으니 여기서 먼저 착지점을 맞추고
## 자동 플레이로 확인한다.

const MAPS: Array[String] = [
	"res://data/maps/parade_ground.tres",
	"res://data/maps/obstacle_course.tres",
	"res://data/maps/winter_field.tres",
]

## 목표 도달 레벨. 명령서로 실제 뽑을 수 있는 총 횟수 근처여야
## 진급 한 번이 항상 의미를 가진다.
var _target: int = 125

## 실제 한 판에서 버는 짬은 이 표의 원시 예산보다 많다. XP 배율 명령서(PC방 외출증)와
## 보스가 부르는 잡몹이 얹히기 때문이다. 실측으로 잰 배수를 여기에 넣고 곡선을 맞춘다.
##   원시 예산 119,510 → 실측 Lv.237(=224,200 XP) 이므로 연병장 기준 약 1.9배.
var _xp_scale: float = 1.9


func _ready() -> void:
	for arg: String in OS.get_cmdline_user_args():
		if arg.begins_with("--target="):
			_target = int(arg.substr(9))
		elif arg.begins_with("--xp-scale="):
			_xp_scale = float(arg.substr(11))
	_run.call_deferred()


func _run() -> void:
	var picks: int = _total_upgrade_picks()
	print("=== 밸런스 예산 ===")
	print("명령서로 실제 뽑을 수 있는 총 횟수: %d회" % picks)
	print("  (이보다 레벨이 훨씬 높으면 그 위 진급은 전부 빈 화면이다)")
	print("")

	var prog: ProgressionData = GameState.progression
	for path: String in MAPS:
		_report_map(path, prog)

	print("=== 경험치 곡선 ===")
	print("현재: xp_to_next(lv) = %.1f + %.1f*(lv-1) + %.3f*(lv-1)^2"
			% [prog.xp_base, prog.xp_per_level, prog.xp_quadratic])
	print("실측 배수 %.2f 를 적용한다 (XP 배율 명령서 + 보스 소환 잡몹)." % _xp_scale)
	print("")
	print("맵          원시짬   실측짬   현재곡선")
	for path: String in MAPS:
		var m: MapData = load(path) as MapData
		var raw: float = _xp_budget(m)
		print("  %-10s %8.0f %8.0f   Lv.%d"
				% [m.display_name, raw, raw * _xp_scale, _level_for(raw * _xp_scale, prog)])
	print("")

	var budget: float = _xp_budget(load(MAPS[0]) as MapData) * _xp_scale
	print("2차 계수별 착지 레벨 (연병장 실측 기준 짬 %.0f)" % budget)
	for quad: float in [0.0, 0.1, 0.2, 0.26, 0.3, 0.5, 0.8]:
		var lv: int = _level_for_curve(budget, prog.xp_base, prog.xp_per_level, quad)
		print("  quad=%-5.2f → Lv.%-4d %s" % [quad, lv,
				"  ← 명령서 %d회에 근접" % _total_upgrade_picks() if absi(lv - _target) <= 8 else ""])
	print("")
	print("목표 Lv.%d 에 맞는 2차 계수 ≈ %.3f"
			% [_target, _solve_quadratic(budget, prog.xp_base, prog.xp_per_level, _target)])
	print("")
	print("다른 맵도 같은 계수에서 어디에 떨어지는지 (계수 %.3f 기준)"
			% _solve_quadratic(budget, prog.xp_base, prog.xp_per_level, _target))
	var q: float = _solve_quadratic(budget, prog.xp_base, prog.xp_per_level, _target)
	for path: String in MAPS:
		var m: MapData = load(path) as MapData
		print("  %-10s Lv.%d" % [m.display_name,
				_level_for_curve(_xp_budget(m) * _xp_scale, prog.xp_base, prog.xp_per_level, q)])
	get_tree().quit(0)


func _report_map(path: String, prog: ProgressionData) -> void:
	var map: MapData = load(path) as MapData
	if map == null or map.wave_table == null:
		return
	print("--- %s (%s) ---" % [map.display_name, path.get_file()])
	print("  분 |   sps | 분당스폰 | 누적스폰 | 평균짬 | 누적짬 | 보스")
	var total_spawn: float = 0.0
	var total_xp: float = 0.0
	var last: WaveData = null
	var minutes: int = int(prog.run_duration_sec / 60.0)
	for m in minutes:
		var w: WaveData = map.wave_table.wave_for_minute(m)
		if w == null:
			continue
		var n: float = w.spawns_per_second * 60.0
		var avg: float = _avg_xp(map, w)
		total_spawn += n
		total_xp += n * avg
		var boss: String = ""
		if w != last and w.boss_id != &"":
			boss = String(w.boss_id)
			total_xp += _boss_xp(map, w.boss_id)
		last = w
		print("  %2d | %5.1f | %8.0f | %8.0f | %6.1f | %6.0f | %s"
				% [m, w.spawns_per_second, n, total_spawn, avg, total_xp, boss])
	print("  → 총 스폰 %.0f마리, 총 짬 %.0f, 현재 곡선으로 Lv.%d"
			% [total_spawn, total_xp, _level_for(total_xp, prog)])
	print("")


## 이 구간이 부르는 적들의 평균 짬. 웨이브는 목록에서 균등하게 뽑는다.
func _avg_xp(map: MapData, w: WaveData) -> float:
	if w.enemy_ids.is_empty():
		return 0.0
	var sum: float = 0.0
	var counted: int = 0
	for id: StringName in w.enemy_ids:
		var e: EnemyData = _enemy(map, id)
		if e != null:
			sum += e.xp
			counted += 1
	return sum / float(maxi(1, counted))


func _enemy(map: MapData, id: StringName) -> EnemyData:
	for e: EnemyData in map.enemies:
		if e != null and e.id == id:
			return e
	return null


func _boss_xp(map: MapData, boss_id: StringName) -> float:
	var b: BossData = map.boss_by_id(boss_id)
	if b == null or b.enemy == null:
		return 0.0
	return b.enemy.xp


func _xp_budget(map: MapData) -> float:
	var prog: ProgressionData = GameState.progression
	var total: float = 0.0
	var last: WaveData = null
	for m in int(prog.run_duration_sec / 60.0):
		var w: WaveData = map.wave_table.wave_for_minute(m)
		if w == null:
			continue
		total += w.spawns_per_second * 60.0 * _avg_xp(map, w)
		if w != last and w.boss_id != &"":
			total += _boss_xp(map, w.boss_id)
		last = w
	return total


func _level_for(total_xp: float, prog: ProgressionData) -> int:
	return _level_for_curve(total_xp, prog.xp_base, prog.xp_per_level, prog.xp_quadratic)


func _level_for_curve(total_xp: float, base: float, per: float, quad: float) -> int:
	var level: int = 1
	var spent: float = 0.0
	while level < 100000:
		var need: float = base + per * float(level - 1) + quad * pow(float(level - 1), 2.0)
		if spent + need > total_xp:
			return level
		spent += need
		level += 1
	return level


## 목표 레벨에 착지하는 2차 계수를 이분법으로 찾는다.
func _solve_quadratic(total_xp: float, base: float, per: float, target: int) -> float:
	var lo: float = 0.0
	var hi: float = 100.0
	for _i in 80:
		var mid: float = (lo + hi) * 0.5
		if _level_for_curve(total_xp, base, per, mid) > target:
			lo = mid
		else:
			hi = mid
	return (lo + hi) * 0.5


## upgrade_table 의 max_level 합. 이 횟수를 넘는 진급은 아무것도 못 준다.
func _total_upgrade_picks() -> int:
	var table: UpgradeTable = load("res://data/upgrades/upgrade_table.tres") as UpgradeTable
	var sum: int = 0
	for u: UpgradeData in table.upgrades:
		if u != null:
			sum += u.max_level
	return sum
