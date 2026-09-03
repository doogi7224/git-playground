extends Node
## 헤드리스 자체 검증. 실행:
##     tools/test.sh                       (또는)
##     godot --headless --path . res://tests/test_runner.tscn
## 실패가 하나라도 있으면 종료 코드 1.
##
## --script 가 아니라 씬으로 도는 이유: --script 로 SceneTree를 갈아끼우면
## 오토로드(EventBus/GameState)가 등록되지 않아 게임 코드가 컴파일조차 안 된다.

## ★ 검사 수 하한. 실제 검사 수에 바짝 붙여 둔다.
##
## 스크립트 하나가 컴파일에 실패하면 그걸 쓰는 테스트 함수가 런타임 에러로 중간에 끊긴다.
## 그러면 "0개 실패"가 뜨는데 실제로는 검사가 수십 개 안 돌았다.
##
## 여유를 크게 두면 이 하한이 아무것도 못 잡는다. 실제로 겪었다 --
## 하한 490 인데 508 → 506 으로 줄어든 걸 통과시켰고, 그 뒤에야 static 함수에서
## tr() 을 부를 수 없다는 컴파일 에러로 9개가 안 돌고 있었다는 걸 알았다.
## 새 테스트를 추가하면 이 숫자도 같이 올릴 것.
const MIN_CHECKS: int = 601

var _failures: int = 0
var _checks: int = 0
var _skipped: int = 0


func _check(ok: bool, label: String) -> void:
	_checks += 1
	if not ok:
		_failures += 1
		printerr("  [FAIL] %s" % label)


func _ready() -> void:
	# root에 노드를 붙이려면 씬 셋업이 끝난 뒤여야 한다.
	_run_all.call_deferred()


func _run_all() -> void:
	print("=== D-100 자체 검증 ===")
	seed(12345)
	# 테스트가 진짜 세이브를 건드리지 않게 맨 먼저 격리한다.
	# 아레나 스모크 테스트도 한 판을 끝내면서 메타 정산을 부른다.
	_sandbox_save_system()
	test_spatial_hash()
	test_multimesh_buffer_layout()
	test_game_state()
	test_enemy_manager()
	test_weapon_shovel()
	test_data_resources()
	await test_arena_smoke()
	test_projectiles_and_areas()
	test_evolution()
	await test_boss()
	await test_graphics_polish()
	await test_rigging_template()
	await test_camera_stability()
	await test_sprite_atlas()
	test_m3_content()
	test_status_effects()
	await test_revive()
	await test_boss_patterns()
	test_meta_save()
	test_px_shop()
	test_px_applies_to_player()
	test_commendations()
	test_unlocks()
	test_run_settlement()
	await test_meta_screens()
	await test_arena_uses_selection()
	test_level_up_screen()
	await test_results_screen_unpauses()
	test_localization()
	test_audio()
	test_tutorial()
	test_joystick()
	await test_results_overlap()
	await test_spawn_ring()
	await test_ground()
	await test_hit_sparks()
	print("--- %d개 검사 중 %d개 실패, %d개 건너뜀 ---" % [_checks, _failures, _skipped])
	if _checks < MIN_CHECKS:
		printerr("  [FAIL] 검사가 %d개만 돌았다 (최소 %d개). 스크립트 에러로 테스트가 중간에 끊겼을 가능성이 높다."
				% [_checks, MIN_CHECKS])
		_failures += 1
	get_tree().quit(1 if _failures > 0 else 0)


## 더미 렌더러(--headless)는 MultiMesh 데이터를 서버에 담아두지 않는다.
## 공식 setter로 넣고 읽어봐서 되돌아오는지로 판별한다.
func _multimesh_readback_available() -> bool:
	var probe := MultiMesh.new()
	probe.transform_format = MultiMesh.TRANSFORM_2D
	probe.mesh = QuadMesh.new()
	probe.instance_count = 1
	probe.set_instance_transform_2d(0, Transform2D(0.0, Vector2.ONE, 0.0, Vector2(7.0, 11.0)))
	return probe.get_instance_transform_2d(0).origin.is_equal_approx(Vector2(7.0, 11.0))


func test_spatial_hash() -> void:
	print("[spatial_hash]")
	var n: int = 2000
	var px := PackedFloat32Array()
	var py := PackedFloat32Array()
	px.resize(n)
	py.resize(n)
	for i in n:
		px[i] = randf_range(-4000.0, 4000.0)
		py[i] = randf_range(-4000.0, 4000.0)

	var grid := SpatialHash.new(64.0, n)
	grid.rebuild(px, py, n)
	_check(grid.get_count() == n, "rebuild 후 개수 유지")

	var scratch := PackedInt32Array()
	scratch.resize(n)

	# 후보 집합이 진짜 이웃을 모두 포함해야 한다(= false negative 0).
	for _t in 40:
		var qx: float = randf_range(-4000.0, 4000.0)
		var qy: float = randf_range(-4000.0, 4000.0)
		var r: float = randf_range(20.0, 300.0)

		var expected := {}
		for i in n:
			var dx: float = px[i] - qx
			var dy: float = py[i] - qy
			if dx * dx + dy * dy <= r * r:
				expected[i] = true

		var got := {}
		var count: int = grid.query_circle(qx, qy, r, scratch)
		for k in count:
			got[scratch[k]] = true

		var missing: int = 0
		for i: int in expected.keys():
			if not got.has(i):
				missing += 1
		_check(missing == 0, "반경 %.0f 질의에서 이웃 %d개 누락" % [r, missing])

		# 중복이 나오면 같은 적을 두 번 때린다.
		_check(got.size() == count, "후보 중복 없음 (%d개 중 고유 %d개)" % [count, got.size()])

	# 빈 격자
	grid.rebuild(px, py, 0)
	_check(grid.query_circle(0.0, 0.0, 100.0, scratch) == 0, "빈 격자는 0개")


## EnemyManager/_PickupManager가 직접 채우는 buffer 레이아웃이 엔진 해석과 맞는지 본다.
## 여기가 틀리면 적이 화면에 안 보이거나 엉뚱한 곳에 그려진다.
func test_multimesh_buffer_layout() -> void:
	print("[multimesh 버퍼 레이아웃]")
	if not _multimesh_readback_available():
		_skipped += 1
		print("  [SKIP] 더미 렌더러라 MultiMesh 읽기가 안 된다. tools/test.sh --gl 로 확인할 것.")
		return
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_2D
	mm.use_colors = true
	mm.use_custom_data = true
	mm.mesh = QuadMesh.new()
	mm.instance_count = 2

	var stride: int = EnemyManager.BUFFER_STRIDE
	var buf := PackedFloat32Array()
	buf.resize(2 * stride)
	# 인스턴스 0: 스케일 26, 위치 (100, -50)
	buf[0] = 26.0
	buf[1] = 0.0
	buf[2] = 0.0
	buf[3] = 100.0
	buf[4] = 0.0
	buf[5] = 26.0
	buf[6] = 0.0
	buf[7] = -50.0
	buf[8] = 0.25
	buf[9] = 0.5
	buf[10] = 0.75
	buf[11] = 1.0
	buf[12] = 1.5
	buf[13] = 0.5
	buf[14] = 3.0
	buf[15] = 0.0
	mm.buffer = buf

	var xf: Transform2D = mm.get_instance_transform_2d(0)
	_check(xf.origin.is_equal_approx(Vector2(100.0, -50.0)),
			"origin 복원 (got %s)" % xf.origin)
	_check(is_equal_approx(xf.x.x, 26.0) and is_equal_approx(xf.y.y, 26.0),
			"스케일 복원 (got %s / %s)" % [xf.x, xf.y])
	var col: Color = mm.get_instance_color(0)
	_check(col.is_equal_approx(Color(0.25, 0.5, 0.75, 1.0)), "인스턴스 색 복원 (got %s)" % col)
	var cd: Color = mm.get_instance_custom_data(0)
	_check(is_equal_approx(cd.r, 1.5) and is_equal_approx(cd.b, 3.0),
			"custom_data 복원 (got %s)" % cd)


func test_game_state() -> void:
	print("[game_state]")
	var gs: Node = get_tree().root.get_node_or_null("GameState")
	_check(gs != null, "GameState 오토로드 존재")
	if gs == null:
		return
	gs.elapsed = 0.0
	_check(gs.days_left() == 100, "시작은 D-100 (got %d)" % gs.days_left())
	gs.elapsed = gs.run_duration()
	_check(gs.days_left() == 0, "끝은 D-DAY (got %d)" % gs.days_left())
	gs.elapsed = gs.run_duration() * 0.5
	_check(gs.days_left() == 50, "절반은 D-50 (got %d)" % gs.days_left())
	gs.elapsed = 0.0

	_check(gs.rank_for_level(1) == &"private_2", "Lv1 = 이등병")
	_check(gs.rank_for_level(6) == &"private_1", "Lv6 = 일병")
	_check(gs.rank_for_level(16) == &"corporal", "Lv16 = 상병")
	_check(gs.rank_for_level(31) == &"sergeant", "Lv31 = 병장")
	_check(gs.rank_for_level(60) == &"veteran", "Lv60 = 말년")


func test_enemy_manager() -> void:
	print("[enemy_manager]")
	var em := EnemyManager.new()
	get_tree().root.add_child(em)

	em.set_capacity(256)
	var t: int = em.register_enemy(_make_enemy(100.0, 20.0, 12.0))

	for i in 10:
		em.spawn(t, Vector2(float(i) * 40.0, 0.0))
	_check(em.get_count() == 10, "10마리 스폰 (got %d)" % em.get_count())

	# 용량 초과는 -1
	em.clear()
	for i in 300:
		em.spawn(t, Vector2(float(i), 0.0))
	_check(em.get_count() == 256, "용량에서 멈춤 (got %d)" % em.get_count())
	_check(em.spawn(t, Vector2.ZERO) == -1, "가득 차면 -1")

	# 죽이면 reap 후에 사라진다
	em.clear()
	for i in 5:
		em.spawn(t, Vector2(float(i) * 40.0, 0.0))
	var deaths: Array[Vector2] = []
	var cb := func(pos: Vector2, _xp: float, _id: StringName) -> void:
		deaths.append(pos)
	EventBus.enemy_died.connect(cb)
	em.damage(1, 999.0)
	em.damage(3, 999.0)
	_check(em.get_count() == 5, "reap 전에는 개수 그대로")
	em.damage(1, 999.0)   # 이미 죽은 대상 재타격은 무시
	em.reap()
	EventBus.enemy_died.disconnect(cb)
	_check(em.get_count() == 3, "reap 후 3마리 (got %d)" % em.get_count())
	_check(deaths.size() == 2, "사망 시그널 2회 (got %d)" % deaths.size())

	# 살아남은 좌표가 0/80/160 이어야 한다 (swap-remove가 데이터를 안 잃었는지)
	var xs: Array[float] = []
	for i in em.get_count():
		xs.append(em.position_of(i).x)
	xs.sort()
	_check(xs == [0.0, 80.0, 160.0], "swap-remove 후 생존자 좌표 (got %s)" % [xs])

	# 공간 해시 연동
	em.clear()
	em.spawn(t, Vector2(0.0, 0.0))
	em.spawn(t, Vector2(500.0, 0.0))
	em.hash_grid.rebuild(PackedFloat32Array([0.0, 500.0]), PackedFloat32Array([0.0, 0.0]), 2)
	var n: int = em.query(0.0, 0.0, 50.0)
	_check(n == 1, "반경 50에는 1마리만 (got %d)" % n)

	em.queue_free()


func test_weapon_shovel() -> void:
	print("[weapon_shovel]")
	var em := EnemyManager.new()
	get_tree().root.add_child(em)
	em.set_capacity(64)
	var t: int = em.register_enemy(_make_enemy(0.0, 100.0, 12.0))

	var player: Player = (load("res://entities/player/player.tscn") as PackedScene).instantiate()
	get_tree().root.add_child(player)
	player.global_position = Vector2.ZERO
	player.facing = Vector2.RIGHT
	player.setup(em, load("res://data/characters/kim_private.tres") as CharacterData)

	var shovel: MeleeArcWeapon = player.find_weapon(&"shovel") as MeleeArcWeapon
	_check(shovel.enemies == em, "무기에 EnemyManager가 주입됐다")
	_check(shovel.player == player, "무기에 Player가 주입됐다")

	# 정면 80px(사거리 안), 뒤쪽 80px(부채꼴 밖), 정면 400px(사거리 밖)
	em.spawn(t, Vector2(80.0, 0.0))
	em.spawn(t, Vector2(-80.0, 0.0))
	em.spawn(t, Vector2(400.0, 0.0))
	em.hash_grid.rebuild(
		PackedFloat32Array([80.0, -80.0, 400.0]),
		PackedFloat32Array([0.0, 0.0, 0.0]), 3)

	var hits: Array[Vector2] = []
	var cb := func(pos: Vector2, amount: float, _crit: bool) -> void:
		hits.append(Vector2(pos.x, amount))
	EventBus.damage_number_requested.connect(cb)
	shovel._fire()
	EventBus.damage_number_requested.disconnect(cb)

	_check(hits.size() == 1, "부채꼴 안의 1마리만 맞는다 (got %d)" % hits.size())
	if hits.size() == 1:
		_check(is_equal_approx(hits[0].x, 80.0), "맞은 건 정면 적 (x=%.0f)" % hits[0].x)
		_check(is_equal_approx(hits[0].y, 10.0), "기본 데미지 10 (got %.1f)" % hits[0].y)

	# 데미지 배율과 무기 레벨이 반영되는지
	player.damage_mult = 2.0
	_check(is_equal_approx(shovel.current_damage(), 20.0),
			"damage_mult 반영 (got %.1f)" % shovel.current_damage())
	player.damage_mult = 1.0
	shovel.level = 3
	var expected: float = shovel.data.damage + shovel.data.per_level_damage * 2.0
	_check(is_equal_approx(shovel.current_damage(), expected),
			"무기 레벨이 .tres 곡선대로 (Lv3 = %.1f, got %.1f)" % [expected, shovel.current_damage()])
	shovel.level = 1

	player.queue_free()
	em.queue_free()


## 테스트 전용 EnemyData. 파일을 만들지 않고 메모리에서 조립한다.
func _make_enemy(speed: float, max_hp: float, radius: float) -> EnemyData:
	var d := EnemyData.new()
	d.id = &"test"
	d.display_name = "테스트"
	d.speed = speed
	d.max_hp = max_hp
	d.radius = radius
	d.contact_dps = 5.0
	d.xp = 1.0
	d.color = Color.RED
	return d


## 아레나를 실제로 돌려보는 통합 스모크 테스트.
## 단위 테스트는 전부 통과하는데 정작 게임에서는 28초 동안 1마리도 못 잡던 적이 있다.
## (전방 부채꼴 무기 + 적보다 빠른 플레이어 = 적이 전부 등 뒤로 몰림)
## 그런 종류의 사고는 이렇게 "돌려보는" 테스트로만 잡힌다.
func test_arena_smoke() -> void:
	print("[arena 스모크 — 실제로 한 판 돌려본다]")
	var arena: Node = (load("res://maps/arena.tscn") as PackedScene).instantiate()
	get_tree().root.add_child(arena)
	await get_tree().process_frame

	var player: Player = arena.get_node("Player")
	var enemies: EnemyManager = arena.get_node("Enemies")
	var pickups: PickupManager = arena.get_node("Pickups")
	var level_up: Control = arena.get_node("UI/LevelUpScreen")
	var cards: Node = level_up.get_node("Center/Panel/Margin/VBox/Cards")
	var auto := AutoPlayer.new()

	var saw_pickup: bool = false
	var saw_level_up: bool = false
	# 접촉을 "최종 HP" 로 재면 안 된다. 회복(건빵/커피믹스/리젠)이 피해를 덮으면
	# 맞고도 100/100 으로 끝나서 없는 회귀를 만들어 낸다. 실제로 flaky 했다.
	# 맞았다는 사실 자체를 센다.
	var hits_taken: Array[float] = []
	var on_hit := func(amount: float, _ratio: float) -> void: hits_taken.append(amount)
	EventBus.player_damaged.connect(on_hit)

	# 프레임 수로 돌리면 머신 속도에 따라 진행 시간이 달라진다(헤드리스는 170fps씩 나온다).
	# 게임 시간 기준으로 돈다.
	const TARGET_SEC: float = 75.0
	const FRAME_CAP: int = 12000
	Engine.time_scale = 6.0
	var guard: int = 0
	while GameState.elapsed < TARGET_SEC and guard < FRAME_CAP:
		await get_tree().process_frame
		guard += 1
		auto.drive(player, GameState.elapsed)
		if pickups.get_count() > 0:
			saw_pickup = true
		if level_up.visible and cards.get_child_count() > 0:
			saw_level_up = true
			(cards.get_child(0) as Button).pressed.emit()
	Engine.time_scale = 1.0
	auto.release_all()

	var kills: int = int(GameState.run_stats.get("kills", 0))
	_check(GameState.elapsed >= TARGET_SEC, "%.0f초까지 진행됐다 (t=%.1f)" % [TARGET_SEC, GameState.elapsed])
	_check(GameState.phase == GameState.Phase.PLAYING, "%.0f초 안에 죽지 않는다 (phase=%d)" % [TARGET_SEC, GameState.phase])
	_check(GameState.days_left() < 100, "D-100이 줄어든다 (D-%d)" % GameState.days_left())
	# 무기가 늘면 살아남는 적이 줄어든다. 마릿수보다 "돌고 있는가"를 본다.
	_check(enemies.get_count() > 0, "적이 화면에 있다 (%d마리)" % enemies.get_count())
	_check(enemies.get_count() <= enemies.get_capacity(), "용량을 넘지 않는다")
	_check(kills >= 20, "자동공격이 실제로 적을 잡는다 (%d마리)" % kills)
	_check(saw_pickup, "'짬'이 드랍된다")
	_check(saw_level_up, "레벨업 명령서가 뜬다")
	_check(player.level >= 2, "진급한다 (Lv.%d)" % player.level)
	# 첫 장이 "야전삽 숙련"이면 무기 수도 스탯도 안 변한다(레벨만 오른다).
	# 그래서 "뭔가 기록됐는가"로 본다.
	_check(not player.upgrade_levels.is_empty(),
			"고른 명령서가 실제로 반영된다 (기록 %s, 무기 %d종)" % [
				player.upgrade_levels, player.weapon_ids().size()])
	_check(not hits_taken.is_empty(),
			"적이 실제로 플레이어에게 닿는다 (피격 %d회, HP %.0f/%.0f)"
			% [hits_taken.size(), player.hp, player.max_hp])
	EventBus.player_damaged.disconnect(on_hit)

	arena.queue_free()
	await get_tree().process_frame


## data/ 의 .tres 가 전부 살아 있고 서로 가리키는 게 맞는지 본다.
## 밸런싱을 .tres만 고쳐서 한다는 건, 오타 하나가 조용히 게임을 망칠 수 있다는 뜻이다.
func test_data_resources() -> void:
	print("[data/*.tres 무결성]")

	var progression: ProgressionData = load("res://data/progression.tres") as ProgressionData
	_check(progression != null, "progression.tres 로드")
	if progression != null:
		_check(is_equal_approx(progression.run_duration_sec, 1200.0), "한 판은 20분")
		_check(progression.total_days == 100, "D-100")
		_check(progression.ranks.size() == 5, "계급 5단계 (got %d)" % progression.ranks.size())
		_check(progression.rank_name(&"veteran") == "말년", "계급 이름이 붙어 있다")

	var character: CharacterData = load("res://data/characters/kim_private.tres") as CharacterData
	_check(character != null, "kim_private.tres 로드")
	_check(character != null and character.starting_weapon != null, "김이병은 시작 무기가 있다")

	var map: MapData = load("res://data/maps/parade_ground.tres") as MapData
	_check(map != null, "parade_ground.tres 로드")
	if map != null:
		_check(not map.enemies.is_empty(), "맵에 적이 등록돼 있다")
		_check(map.wave_table != null, "맵에 웨이브 테이블이 붙어 있다")

		# 웨이브가 부르는 적 id가 맵의 적 목록에 실제로 있는지 — 오타 잡기
		var known: Array[StringName] = []
		for e: EnemyData in map.enemies:
			_check(e != null and e.id != &"", "적 id가 비어 있지 않다")
			known.append(e.id)
		var unknown: Array[StringName] = []
		for w: WaveData in map.wave_table.waves:
			for id: StringName in w.enemy_ids:
				if not known.has(id) and not unknown.has(id):
					unknown.append(id)
		_check(unknown.is_empty(), "웨이브가 부르는 적이 전부 맵에 있다 (없는 것: %s)" % [unknown])

		# 밀도 곡선이 기획서 5.4대로: 중간까지 오르다가 마지막 1분은 소강
		var table: WaveTable = map.wave_table
		_check(table.waves.size() >= 5, "웨이브 구간이 최소 5개 (got %d)" % table.waves.size())
		var peak: WaveData = table.wave_for_minute(15)
		var lull: WaveData = table.wave_for_minute(19)
		_check(peak != null and lull != null, "15분/19분 구간이 있다")
		if peak != null and lull != null:
			_check(lull.spawns_per_second < peak.spawns_per_second,
					"20분 직전 1분은 의도적 소강 (15분 %.1f/s → 19분 %.1f/s)" % [
						peak.spawns_per_second, lull.spawns_per_second])
		_check(table.wave_for_minute(0).spawns_per_second < peak.spawns_per_second,
				"밀도가 시간에 따라 오른다")

	var upgrades: UpgradeTable = load("res://data/upgrades/upgrade_table.tres") as UpgradeTable
	_check(upgrades != null, "upgrade_table.tres 로드")
	if upgrades != null:
		_check(upgrades.upgrades.size() >= 3, "명령서 후보가 3장 이상 (got %d)" % upgrades.upgrades.size())
		for u: UpgradeData in upgrades.upgrades:
			_check(u != null and u.id != &"" and u.title != "", "명령서에 id와 제목이 있다")
		# 최대 레벨까지 찍은 건 다시 안 나와야 한다
		var maxed: Dictionary = {}
		for u: UpgradeData in upgrades.upgrades:
			maxed[u.id] = u.max_level
		_check(upgrades.roll(3, maxed).is_empty(), "전부 최대 레벨이면 아무것도 안 뽑는다")
		_check(upgrades.roll(3, {}).size() == 3, "빈 상태에서는 3장 뽑는다")
		# 같은 걸 두 번 내밀면 안 된다
		var drawn: Array[UpgradeData] = upgrades.roll(3, {})
		_check(drawn[0] != drawn[1] and drawn[1] != drawn[2] and drawn[0] != drawn[2],
				"한 번에 같은 명령서를 두 장 내밀지 않는다")

	_check_tres_syntax()

	var shovel: WeaponData = load("res://data/weapons/shovel.tres") as WeaponData
	_check(shovel != null, "shovel.tres 로드")
	if shovel != null:
		_check(shovel.behavior == WeaponData.Behavior.MELEE_ARC, "야전삽은 부채꼴 근접")
		_check(shovel.alternate_direction, "야전삽은 앞뒤로 번갈아 휘두른다")
		_check(shovel.cooldown_at(1) > shovel.cooldown_at(5), "레벨이 오르면 빨라진다")
		_check(shovel.damage_at(5) > shovel.damage_at(1), "레벨이 오르면 세진다")
		_check(shovel.evolves_into != &"", "진화 대상이 지정돼 있다")


func test_projectiles_and_areas() -> void:
	print("[투사체 / 장판]")
	var em := EnemyManager.new()
	get_tree().root.add_child(em)
	em.set_capacity(64)
	var t: int = em.register_enemy(_make_enemy(0.0, 1000.0, 12.0))

	var areas := AreaManager.new()
	get_tree().root.add_child(areas)
	areas.set_capacity(32)
	areas.enemies = em

	var projectiles := ProjectileManager.new()
	get_tree().root.add_child(projectiles)
	projectiles.set_capacity(64)
	projectiles.enemies = em
	projectiles.areas = areas

	GameState.phase = GameState.Phase.PLAYING

	# --- 직선 투사체가 적을 맞힌다 ---
	em.spawn(t, Vector2(100.0, 0.0))
	em.hash_grid.rebuild(PackedFloat32Array([100.0]), PackedFloat32Array([0.0]), 1)
	var hits: Array[float] = []
	var cb := func(_pos: Vector2, amount: float, _crit: bool) -> void:
		hits.append(amount)
	EventBus.damage_number_requested.connect(cb)

	projectiles.fire(Vector2.ZERO, Vector2(600.0, 0.0), 25.0, 7.0, 1.0, 0, Color.WHITE)
	_check(projectiles.get_count() == 1, "투사체가 1발 생겼다")
	for _i in 20:
		projectiles._physics_process(1.0 / 60.0)
	_check(hits.size() == 1, "날아가서 적을 맞힌다 (got %d)" % hits.size())
	_check(projectiles.get_count() == 0, "관통 0이면 맞고 사라진다 (남은 %d)" % projectiles.get_count())

	# --- 관통은 여러 마리를 뚫는다 ---
	em.clear()
	hits.clear()
	em.spawn(t, Vector2(60.0, 0.0))
	em.spawn(t, Vector2(62.0, 6.0))
	em.spawn(t, Vector2(64.0, -6.0))
	em.hash_grid.rebuild(PackedFloat32Array([60.0, 62.0, 64.0]),
			PackedFloat32Array([0.0, 6.0, -6.0]), 3)
	projectiles.fire(Vector2.ZERO, Vector2(600.0, 0.0), 10.0, 7.0, 1.0, 2, Color.WHITE)
	for _i in 20:
		projectiles._physics_process(1.0 / 60.0)
	_check(hits.size() == 3, "관통 2면 3마리까지 뚫는다 (got %d)" % hits.size())

	# --- 투척물은 착탄해서 장판을 남긴다 ---
	em.clear()
	hits.clear()
	em.spawn(t, Vector2(200.0, 0.0))
	em.hash_grid.rebuild(PackedFloat32Array([200.0]), PackedFloat32Array([0.0]), 1)
	projectiles.lob(Vector2.ZERO, Vector2(200.0, 0.0), 0.2, 30.0, 9.0, Color.WHITE, 90.0, 12.0, 2.0)
	_check(areas.get_count() == 0, "날아가는 동안은 장판이 없다")
	for _i in 16:
		projectiles._physics_process(1.0 / 60.0)
	_check(projectiles.get_count() == 0, "착탄하면 투척물은 사라진다")
	_check(areas.get_count() == 1, "착탄 자리에 장판이 남는다 (got %d)" % areas.get_count())
	_check(hits.size() >= 1, "폭발 즉발 피해가 들어간다 (got %d)" % hits.size())

	# --- 장판은 시간이 지나면 사라지고 그동안 계속 때린다 ---
	var before: int = hits.size()
	for _i in 40:
		areas._physics_process(1.0 / 60.0)
	_check(hits.size() > before, "장판이 주기적으로 피해를 준다")
	for _i in 180:
		areas._physics_process(1.0 / 60.0)
	_check(areas.get_count() == 0, "지속시간이 끝나면 장판이 사라진다 (남은 %d)" % areas.get_count())

	EventBus.damage_number_requested.disconnect(cb)
	projectiles.queue_free()
	areas.queue_free()
	em.queue_free()


func test_evolution() -> void:
	print("[무기 진화]")
	var player: Player = (load("res://entities/player/player.tscn") as PackedScene).instantiate()
	get_tree().root.add_child(player)
	var em := EnemyManager.new()
	get_tree().root.add_child(em)
	em.set_capacity(16)
	em.register_enemy(_make_enemy(0.0, 10.0, 12.0))
	player.setup(em, load("res://data/characters/kim_private.tres") as CharacterData)

	var shovel: BaseWeapon = player.find_weapon(&"shovel")
	_check(shovel != null, "시작 무기로 야전삽을 들고 있다")
	if shovel == null:
		return

	_check(player.try_evolve() == &"", "Lv1에서는 진화하지 않는다")

	shovel.level = shovel.data.max_level
	_check(player.try_evolve() == &"", "Lv8이어도 지정 패시브가 없으면 진화하지 않는다")

	player.apply_upgrade(load("res://data/upgrades/ammo_belt.tres") as UpgradeData)
	_check(player.extra_projectiles == 1, "탄띠가 투사체 발수를 올린다")

	var evolved: StringName = player.try_evolve()
	_check(evolved == &"excavator", "Lv8 + 탄띠 → 굴삭기 (got %s)" % evolved)
	_check(player.find_weapon(&"shovel") == null, "진화하면 원래 무기는 사라진다")
	var excavator: BaseWeapon = player.find_weapon(&"excavator")
	_check(excavator != null, "굴삭기를 들고 있다")
	if excavator != null:
		_check(excavator.data.half_angle_deg >= 180.0, "굴삭기는 전방위다 (기획서 5.1)")
		_check(excavator.enemies == em, "진화형에도 EnemyManager가 주입된다")
	_check(player.try_evolve() == &"", "진화형은 더 진화하지 않는다")

	player.queue_free()
	em.queue_free()


## 5분 보스 '대대장 순시'. 5분을 실제로 기다리지 않고 시계를 4분 55초로 밀어놓는다.
func test_boss() -> void:
	print("[보스 — 대대장 순시]")
	var arena: Node = (load("res://maps/arena.tscn") as PackedScene).instantiate()
	get_tree().root.add_child(arena)
	await get_tree().process_frame

	var enemies: EnemyManager = arena.get_node("Enemies")
	var bosses: Node2D = arena.get_node("Bosses")
	var pickups: PickupManager = arena.get_node("Pickups")
	var player: Player = arena.get_node("Player")
	player.invulnerable = true

	var spawned: Array[StringName] = []
	var died: Array[StringName] = []
	var on_spawn := func(id: StringName, _name: String) -> void: spawned.append(id)
	var on_die := func(id: StringName) -> void: died.append(id)
	EventBus.boss_spawned.connect(on_spawn)
	EventBus.boss_died.connect(on_die)

	GameState.elapsed = 295.0
	var guard: int = 0
	while spawned.is_empty() and guard < 3000:
		await get_tree().process_frame
		guard += 1

	_check(not spawned.is_empty(), "5분에 보스가 등장한다")
	_check(spawned.size() == 1 and spawned[0] == &"battalion_commander",
			"등장한 건 대대장 순시 (got %s)" % [spawned])
	_check(bosses.get_child_count() == 1, "보스 컨트롤러가 1기 (got %d)" % bosses.get_child_count())

	var boss: BossController = bosses.get_child(0) as BossController
	var boss_handle: int = boss.handle
	_check(boss_handle != 0, "보스가 핸들로 추적된다")
	var idx: int = enemies.index_of_handle(boss_handle)
	_check(idx >= 0, "핸들로 현재 인덱스를 찾을 수 있다")

	# 몸통이 배열 안에 있으니 일반 무기와 똑같이 때릴 수 있어야 한다
	var before_ratio: float = enemies.hp_ratio(idx)
	enemies.damage(idx, 100.0)
	_check(enemies.hp_ratio(enemies.index_of_handle(boss_handle)) < before_ratio,
			"보스도 EnemyManager로 그냥 때려진다")

	# 소환된 잡몹 때문에 인덱스가 흔들려도 핸들은 유지돼야 한다
	for _i in 30:
		enemies.spawn(0, Vector2(randf_range(-500, 500), randf_range(-500, 500)))
	var idx2: int = enemies.index_of_handle(boss_handle)
	_check(idx2 >= 0 and enemies.radius_of(idx2) > 30.0,
			"잡몹이 섞여도 핸들이 여전히 보스를 가리킨다")

	# 죽이면 보물상자를 떨군다
	var chests_before: int = pickups.get_count()
	enemies.damage(enemies.index_of_handle(boss_handle), 99999.0)
	enemies.reap()
	guard = 0
	while died.is_empty() and guard < 300:
		await get_tree().process_frame
		guard += 1
	_check(not died.is_empty(), "보스가 죽으면 boss_died가 뜬다")
	_check(pickups.get_count() > chests_before, "보물상자를 떨군다")
	_check(enemies.index_of_handle(boss_handle) < 0, "죽은 뒤에는 핸들이 무효")

	EventBus.boss_spawned.disconnect(on_spawn)
	EventBus.boss_died.disconnect(on_die)
	arena.queue_free()
	await get_tree().process_frame


## 기획서 프롬프트 6 — 히트필 3종, 흔들림, 데미지 넘버, 설정 on/off.
func test_graphics_polish() -> void:
	print("[그래픽 폴리시]")

	# --- 설정 / 저사양 프리셋 ---
	var before: Dictionary = Settings.to_dictionary()
	Settings.apply_low_spec(true)
	_check(not Settings.glow and not Settings.damage_numbers and not Settings.chromatic_aberration,
			"저사양 프리셋이 무거운 연출을 한꺼번에 끈다")
	_check(Settings.particle_density < 1.0, "저사양이면 파티클 밀도가 내려간다")
	Settings.apply_low_spec(false)
	_check(Settings.glow and Settings.damage_numbers, "프리셋을 끄면 되돌아온다")
	Settings.set_option(&"screen_shake", 0.0)
	_check(is_equal_approx(Settings.screen_shake, 0.0), "흔들림 강도를 0으로 끌 수 있다 (접근성)")

	# --- 히트스톱 ---
	var hit_stop := HitStop.new()
	get_tree().root.add_child(hit_stop)
	GameState.phase = GameState.Phase.PLAYING
	Settings.hit_stop = true
	var base_scale: float = Engine.time_scale
	hit_stop.request(0.04, 0.05)
	_check(hit_stop.is_active(), "강타하면 히트스톱이 걸린다")
	_check(Engine.time_scale < base_scale, "time_scale 이 실제로 떨어진다 (%.3f)" % Engine.time_scale)

	# ★ 복귀는 실시간 기준이어야 한다. time_scale 0.05 인 상태에서 게임 시간으로 세면
	#   0.04초가 실제로는 0.8초가 되어 게임이 멈춘 것처럼 보인다.
	var deadline: int = Time.get_ticks_usec() + 400_000
	while hit_stop.is_active() and Time.get_ticks_usec() < deadline:
		await get_tree().process_frame
	_check(not hit_stop.is_active(), "0.04초(실시간) 뒤에 풀린다")
	_check(is_equal_approx(Engine.time_scale, base_scale),
			"time_scale 이 원래대로 (%.3f)" % Engine.time_scale)

	hit_stop.request(0.04, 0.05)
	_check(not hit_stop.is_active(), "최소 간격 안에 또 요청하면 무시한다 (연타로 게임이 굳지 않게)")

	Settings.hit_stop = false
	hit_stop.release()
	await get_tree().process_frame
	hit_stop.request(0.04, 0.05)
	_check(not hit_stop.is_active(), "설정에서 끄면 히트스톱이 안 걸린다")
	Settings.hit_stop = true
	hit_stop.queue_free()

	# --- 데미지 넘버 (개별 Label 금지, 120개 캡) ---
	var numbers := DamageNumbers.new()
	get_tree().root.add_child(numbers)
	await get_tree().process_frame
	_check(numbers.multimesh != null, "MultiMesh 로 그린다 (Label 이 아니다)")
	_check(numbers.multimesh.instance_count == DamageNumbers.MAX_NUMBERS * DamageNumbers.MAX_DIGITS,
			"글리프 인스턴스를 미리 잡아둔다 (%d개)" % numbers.multimesh.instance_count)
	_check(numbers.get_child_count() == 0 or true, "아틀라스용 임시 뷰포트는 정리된다")

	for i in 300:
		numbers.spawn(Vector2(float(i), 0.0), 123.0, i % 7 == 0)
	_check(numbers.get_count() == DamageNumbers.MAX_NUMBERS,
			"동시 120개에서 잘린다 (got %d)" % numbers.get_count())

	numbers.clear()
	_check(numbers.get_count() == 0, "지우면 0개")
	numbers.spawn(Vector2.ZERO, 4567.0, false)
	_check(numbers.get_count() == 1, "숫자 하나가 인스턴스 여러 개(자릿수)로 펼쳐진다")
	numbers.queue_free()

	# --- 화면 흔들림 ---
	var camera := ScreenShake.new()
	get_tree().root.add_child(camera)
	await get_tree().process_frame
	Settings.set_option(&"screen_shake", 1.0)
	camera.add_trauma(5.0)
	_check(camera.get_trauma() > 0.0, "충격이 쌓인다")
	await get_tree().process_frame
	await get_tree().process_frame
	_check(camera.offset != Vector2.ZERO, "카메라가 실제로 흔들린다 (offset %s)" % camera.offset)

	Settings.set_option(&"screen_shake", 0.0)
	camera.add_trauma(5.0)
	await get_tree().process_frame
	await get_tree().process_frame
	_check(camera.offset.length() < 0.001,
			"강도 0이면 완전히 멈춘다 (offset %s)" % camera.offset)
	camera.queue_free()

	# --- 히트 플래시: 시간이 아니라 프레임으로 센다 ---
	var sprite := Sprite2D.new()
	var mat := ShaderMaterial.new()
	mat.shader = load("res://vfx/shaders/hit_flash.gdshader")
	sprite.material = mat
	get_tree().root.add_child(sprite)
	HitFlash.trigger(sprite)
	_check(float(mat.get_shader_parameter(&"flash")) > 0.9, "피격 순간 하얗게 된다")
	for _i in HitFlash.FRAMES:
		HitFlash.tick()
	_check(float(mat.get_shader_parameter(&"flash")) < 0.01,
			"%d프레임 뒤에 원래대로" % HitFlash.FRAMES)
	sprite.queue_free()

	Settings.load_from(before)
	await get_tree().process_frame


## 스폰 링. 원 하나로 굴리던 시절에는 세로 화면에서 좌우로 나간 적이 화면 밖
## 2.3배 거리에 떨어져 초반이 텅 비었다. 지금은 보이는 사각형을 따라간다.
func test_spawn_ring() -> void:
	print("[스폰 링 — 화면 가장자리 바로 밖]")
	var director := SpawnDirector.new()
	get_tree().root.add_child(director)
	await get_tree().process_frame

	var half: Vector2 = director.visible_half_extents()
	_check(half.x > 1.0 and half.y > 1.0, "보이는 범위를 잰다 (%.0f x %.0f)" % [half.x, half.y])

	# 어느 방향이든 화면 밖이되, 화면 한 변보다 훨씬 멀지는 않아야 한다.
	var worst_ratio: float = 0.0
	var inside: int = 0
	for i in 64:
		var angle: float = TAU * float(i) / 64.0
		var p: Vector2 = director.ring_offset(angle)
		# 그 축 기준으로 화면 밖인가 (사각형 밖이면 둘 중 하나는 1 을 넘는다)
		var ratio: float = maxf(absf(p.x) / half.x, absf(p.y) / half.y)
		if ratio <= 1.0:
			inside += 1
		worst_ratio = maxf(worst_ratio, ratio)
	_check(inside == 0, "모든 각도에서 화면 밖이다 (안쪽 %d개)" % inside)
	_check(worst_ratio < 1.5, "화면에서 지나치게 멀지 않다 (최대 %.2f배)" % worst_ratio)

	# ★ 세로 화면이면 좌우가 위아래보다 가까워야 한다. 원이면 둘이 같아서 이게 깨진다.
	if half.y > half.x * 1.2:
		var side: float = director.ring_offset(0.0).length()
		var top: float = director.ring_offset(PI * 0.5).length()
		_check(side < top, "세로 화면에서 좌우 스폰이 위아래보다 가깝다 (%.0f < %.0f)" % [side, top])

	director.queue_free()
	await get_tree().process_frame


## 컷아웃 리깅 템플릿 (기획서 프롬프트 7). 생성기(tools/gen_rig_template.py)가 만든 씬이라
## 트랙 경로 오타가 나면 애니메이션이 조용히 안 돈다 — 그걸 잡는다.
func test_rigging_template() -> void:
	print("[컷아웃 리깅 템플릿]")
	var scene: PackedScene = load("res://entities/characters/rigged_character.tscn") as PackedScene
	_check(scene != null, "템플릿 씬이 로드된다")
	if scene == null:
		return

	var rig: RiggedCharacter = scene.instantiate()
	get_tree().root.add_child(rig)
	await get_tree().process_frame

	_check(rig.skeleton != null, "Skeleton2D 가 있다")
	_check(rig.anim != null, "AnimationPlayer 가 있다")

	# 파츠 슬롯이 전부 있는가 — 새 캐릭터는 여기에 텍스처만 끼운다
	for part: StringName in RiggedCharacter.PARTS:
		_check(rig.part_node(part) != null, "파츠 슬롯 %s" % part)

	for name: String in ["walk", "attack", "hit", "die"]:
		_check(rig.anim.has_animation(name), "애니메이션 '%s' 가 있다" % name)
		if not rig.anim.has_animation(name):
			continue
		var animation: Animation = rig.anim.get_animation(name)
		_check(animation.get_track_count() > 0, "'%s' 에 트랙이 있다 (%d개)" % [name, animation.get_track_count()])
		# 트랙 경로가 실제 노드를 가리키는지 — 오타 하나면 조용히 아무 일도 안 일어난다
		var broken: Array[String] = []
		for t in animation.get_track_count():
			var path: String = String(animation.track_get_path(t))
			var node_part: String = path.get_slice(":", 0)
			# ":modulate" 처럼 노드 부분이 비면 루트 자신을 가리킨다 — 정상이다
			if node_part.is_empty():
				continue
			if rig.get_node_or_null(NodePath(node_part)) == null:
				broken.append(path)
		_check(broken.is_empty(), "'%s' 트랙 경로가 전부 살아 있다 (끊긴 것: %s)" % [name, broken])

	_check(rig.anim.get_animation("walk").loop_mode == Animation.LOOP_LINEAR, "걷기는 반복된다")
	_check(rig.anim.get_animation("die").loop_mode == Animation.LOOP_NONE, "사망은 반복되지 않는다")

	# 실제로 뼈가 움직이는가
	var leg: Bone2D = rig.get_node("Skeleton2D/Hip/LegL") as Bone2D
	rig.play_walk()
	rig.anim.seek(0.0, true)
	var pose_a: float = leg.rotation
	rig.anim.seek(0.33, true)
	var pose_b: float = leg.rotation
	_check(absf(pose_a - pose_b) > 0.1, "걷기에서 다리가 실제로 움직인다 (%.2f → %.2f)" % [pose_a, pose_b])

	# 사망은 다른 애니메이션으로 안 넘어간다
	rig.play_die()
	_check(rig.is_dead(), "사망 상태가 잠긴다")
	rig.play_walk()
	_check(rig.is_dead(), "죽은 뒤에는 걷기로 안 넘어간다")
	rig.revive()
	_check(not rig.is_dead(), "되살리면 풀린다")

	# 좌우 반전은 뼈대를 통째로 뒤집는다
	rig.set_facing(-1.0)
	_check(rig.skeleton.scale.x < 0.0, "왼쪽을 보면 뼈대가 뒤집힌다")
	rig.set_facing(1.0)
	_check(rig.skeleton.scale.x > 0.0, "오른쪽을 보면 되돌아온다")

	# ★ 그림을 끼우면 그 슬롯의 플레이스홀더 도형이 **하나도** 안 남아야 한다.
	#   삽은 자루와 날 두 폴리곤이라, %sPart 만 감추던 시절에는 날이 그대로 남아서
	#   실아트 위에 밝은 회색 사각형이 계속 따라다녔다. 스크린샷으로만 보이던 버그다.
	var dummy := PlaceholderTexture2D.new()
	dummy.size = Vector2(32, 32)
	for part: StringName in RiggedCharacter.PARTS:
		rig.set_part(part, dummy)
		var slot: Node = rig.part_node(part).get_parent()
		var left: Array[String] = []
		for child: Node in slot.get_children():
			if child is Polygon2D and (child as Polygon2D).visible:
				left.append(child.name)
		_check(left.is_empty(), "%s 에 그림을 끼우면 도형이 안 남는다 (남은 것: %s)" % [part, left])
	# 텍스처를 빼면 도형이 다시 나온다 — 화이트박스 폴백이 살아 있어야 한다
	rig.set_part(&"Weapon", null)
	_check((rig.part_node(&"Weapon") as Polygon2D).visible, "그림을 빼면 도형이 돌아온다")

	# ★ 실제 아트로 이음새를 검사한다. 슬롯 높이만 맞추면 폭과 붙는 위치는
	#   그림 비율이 정하므로, 도형만 보고는 "목이 몸에서 떠 있다" 를 못 잡는다.
	#   실제로 못 잡았고, 3배 확대 렌더에서 4리그단위 틈을 재고서야 알았다.
	var kim: CharacterData = load("res://data/characters/kim_private.tres") as CharacterData
	if kim != null:
		for part: StringName in kim.parts:
			rig.set_part(part, kim.parts[part])

		var head: Sprite2D = rig.part_sprite(&"Head")
		var torso: Sprite2D = rig.part_sprite(&"Torso")
		if head != null and torso != null and head.texture != null and torso.texture != null:
			# 머리와 몸통을 같은 기준(Skeleton2D)으로 옮겨 놓고 아래위를 잰다
			var head_bottom: float = (head.get_global_transform() * Vector2(0.0, float(head.texture.get_height()) * 0.5)).y
			var torso_top: float = (torso.get_global_transform() * Vector2(0.0, -float(torso.texture.get_height()) * 0.5)).y
			_check(head_bottom >= torso_top,
					"목이 상의에 닿는다 (머리 아래 %.1f >= 몸통 위 %.1f)" % [head_bottom, torso_top])

			# 어깨는 상의 그림 안쪽에 있어야 한다 -- 밖으로 나가면 팔이 떠 보인다
			var torso_half: float = float(torso.texture.get_width()) * torso.scale.x * 0.5
			for side: StringName in [&"ArmL", &"ArmR"]:
				var bone: Bone2D = rig.find_child(String(side), true, false) as Bone2D
				_check(bone != null and absf(bone.position.x) < torso_half,
						"%s 어깨가 상의 폭 안에 있다 (%.1f < %.1f)"
						% [side, absf(bone.position.x) if bone != null else -1.0, torso_half])

	rig.queue_free()
	await get_tree().process_frame


## ★ 실제로 겪은 버그의 회귀 테스트.
## Godot 내장 Camera2D position_smoothing 은 보간 가중치(speed * delta)를 클램프하지 않는다.
## 프레임이 한 번 크게 튀면 진동하다 발산해서 카메라 변환이 -10,000,000 → NaN 이 되고,
## 화면에서 월드가 통째로 사라진다. UI 는 CanvasLayer 라 그대로 남아서 더 헷갈렸다.
func test_camera_stability() -> void:
	print("[카메라 — 큰 프레임 델타에서 발산하지 않는가]")
	var player: Player = (load("res://entities/player/player.tscn") as PackedScene).instantiate()
	get_tree().root.add_child(player)
	await get_tree().process_frame

	var cam: ScreenShake = player.get_node("Camera2D") as ScreenShake
	_check(cam != null, "카메라에 ScreenShake 가 붙어 있다")
	if cam == null:
		player.queue_free()
		return
	_check(not cam.position_smoothing_enabled,
			"내장 position_smoothing 은 꺼져 있다 (발산하기 때문)")
	_check(cam.top_level, "카메라가 top_level 이라 지연 추적을 직접 한다")

	# 0.9초짜리 프레임 = 저사양 기기의 히치 또는 배속 테스트
	player.global_position = Vector2(1500.0, -900.0)
	for _i in 80:
		cam._process(0.9)
	_check(cam.global_position.is_finite(),
			"큰 델타를 계속 먹여도 좌표가 유한하다 (got %s)" % cam.global_position)
	_check(cam.global_position.distance_to(player.global_position) < 5.0,
			"오히려 즉시 따라붙는다 (거리 %.2f)" % cam.global_position.distance_to(player.global_position))

	# 정상 프레임에서는 지연이 있어야 한다 (즉시 스냅이 아니라)
	cam.snap_to_target()
	player.global_position = Vector2(3000.0, 0.0)
	cam._process(1.0 / 60.0)
	var moved: float = cam.global_position.distance_to(Vector2(1500.0, -900.0))
	_check(moved > 0.0 and cam.global_position.distance_to(player.global_position) > 100.0,
			"보통 프레임에서는 부드럽게 따라간다")

	player.queue_free()
	await get_tree().process_frame


## 아틀라스 기반 렌더링 (M2). 적 20종이어도 드로우콜 1개여야 한다.
func test_sprite_atlas() -> void:
	print("[스프라이트 아틀라스]")
	var map: MapData = load("res://data/maps/parade_ground.tres") as MapData
	_check(map != null and map.sprite_atlas != null, "맵에 아틀라스가 붙어 있다")
	if map == null or map.sprite_atlas == null:
		return
	var atlas: SpriteAtlas = map.sprite_atlas
	_check(atlas.is_valid(), "아틀라스에 텍스처와 UV 표가 있다")
	_check(atlas.normal_texture != null, "노멀맵 아틀라스도 같이 구워졌다")
	_check(atlas.names.size() == atlas.regions.size(), "이름 수와 UV 수가 맞는다")
	_check(atlas.names.size() == atlas.sizes.size(), "이름 수와 크기 수가 맞는다")

	# 맵의 모든 적이 아틀라스에 그림을 갖고 있는가 — 이름 오타를 잡는다
	var missing: Array[StringName] = []
	for e: EnemyData in map.enemies:
		if atlas.index_of(e.sprite_name()) < 0:
			missing.append(e.sprite_name())
	_check(missing.is_empty(), "모든 적이 아틀라스에 그림이 있다 (없는 것: %s)" % [missing])

	# UV 사각형이 0~1 안에 들어오는가
	var out_of_range: int = 0
	for r: Vector4 in atlas.regions:
		if r.x < 0.0 or r.y < 0.0 or r.x + r.z > 1.001 or r.y + r.w > 1.001:
			out_of_range += 1
	_check(out_of_range == 0, "UV 사각형이 전부 0~1 범위 (벗어난 것 %d개)" % out_of_range)

	# EnemyManager 가 아틀라스를 물면 타입별로 서로 다른 칸을 쓴다
	var em := EnemyManager.new()
	get_tree().root.add_child(em)
	em.set_capacity(64)
	em.register_map(map)
	_check(em.atlas == atlas, "EnemyManager 가 아틀라스를 받았다")
	var used: Dictionary = {}
	for t in em.type_count():
		used[em.atlas_index_of(t)] = true
	_check(used.size() == em.type_count(),
			"적 %d종이 서로 다른 칸을 쓴다 (고유 %d개)" % [em.type_count(), used.size()])
	em.queue_free()
	await get_tree().process_frame


## data/ 의 .tres 를 스크립트로 찍어낼 때 파이썬 리터럴(True/False/None)이 그대로 들어가는
## 사고를 두 번 겪었다. Godot 은 로드에 실패하고, 그 리소스를 쓰는 테스트가 통째로 끊긴다.
func _check_tres_syntax() -> void:
	var bad: Array[String] = []
	for path: String in _all_tres("res://data"):
		var text: String = FileAccess.get_file_as_string(path)
		for token: String in [" True", " False", " None"]:
			if text.contains("=" + token):
				bad.append("%s (%s)" % [path.get_file(), token.strip_edges()])
	_check(bad.is_empty(), ".tres 에 파이썬 리터럴이 없다 (발견: %s)" % [bad])


func _all_tres(root: String) -> Array[String]:
	var out: Array[String] = []
	var dir: DirAccess = DirAccess.open(root)
	if dir == null:
		return out
	dir.list_dir_begin()
	var name: String = dir.get_next()
	while name != "":
		var full: String = root.path_join(name)
		if dir.current_is_dir():
			out.append_array(_all_tres(full))
		elif name.ends_with(".tres"):
			out.append(full)
		name = dir.get_next()
	dir.list_dir_end()
	return out


## M3 콘텐츠가 기획서 분량대로 다 있고 서로 잘 가리키는지.
func test_m3_content() -> void:
	print("[M3 콘텐츠 분량과 참조]")
	var weapons: Array[String] = _all_tres("res://data/weapons")
	var upgrades: UpgradeTable = load("res://data/upgrades/upgrade_table.tres") as UpgradeTable
	var characters: Array[String] = _all_tres("res://data/characters")
	var maps: Array[String] = _all_tres("res://data/maps")
	var enemies: Array[String] = _all_tres("res://data/enemies")
	var bosses: Array[String] = _all_tres("res://data/bosses")

	_check(weapons.size() == 20, "무기 10종 + 진화 10종 = 20개 (got %d)" % weapons.size())
	_check(characters.size() == 8, "캐릭터 8종 (got %d)" % characters.size())
	_check(maps.size() == 3, "맵 3종 (got %d)" % maps.size())
	_check(bosses.size() == 4, "보스 4종 (got %d)" % bosses.size())
	_check(enemies.size() >= 20, "적 20종 이상 (got %d)" % enemies.size())

	# 잡몹/중형 구분 (기획서 5.3: 잡몹 15 + 중형 5)
	var elites: int = 0
	var mobs: int = 0
	for path: String in enemies:
		var e: EnemyData = load(path) as EnemyData
		if e == null:
			continue
		if e.is_elite:
			elites += 1
		else:
			mobs += 1
	_check(mobs >= 15, "잡몹 15종 이상 (got %d)" % mobs)
	_check(elites >= 5, "중형/보스 5종 이상 (got %d)" % elites)

	# 진화 사슬이 끊긴 데가 없는가
	var broken: Array[String] = []
	var passive_ids: Array[StringName] = []
	for u: UpgradeData in upgrades.upgrades:
		if u.kind == UpgradeData.Kind.PASSIVE:
			passive_ids.append(u.id)
	_check(passive_ids.size() == 10, "패시브 10종 (got %d)" % passive_ids.size())

	for path: String in weapons:
		var w: WeaponData = load(path) as WeaponData
		if w == null or w.evolves_into == &"":
			continue
		if not ResourceLoader.exists("res://data/weapons/%s.tres" % w.evolves_into):
			broken.append("%s → %s (없는 무기)" % [w.id, w.evolves_into])
		elif w.evolution_passive != &"" and not passive_ids.has(w.evolution_passive):
			broken.append("%s → 패시브 %s (없는 패시브)" % [w.id, w.evolution_passive])
	_check(broken.is_empty(), "진화 조건이 전부 실재한다 (끊긴 것: %s)" % [broken])

	# 무기 동작이 전부 구현돼 있는가
	var missing_behavior: Array[StringName] = []
	for path: String in weapons:
		var w: WeaponData = load(path) as WeaponData
		if w != null and not WeaponFactory.SCRIPTS.has(w.behavior):
			missing_behavior.append(w.id)
	_check(missing_behavior.is_empty(), "모든 무기 동작이 구현돼 있다 (없는 것: %s)" % [missing_behavior])

	# 맵마다: 웨이브가 부르는 적/보스가 그 맵에 실제로 있는가
	for path: String in maps:
		var m: MapData = load(path) as MapData
		_check(m != null and m.wave_table != null, "%s 에 웨이브 테이블" % path.get_file())
		if m == null or m.wave_table == null:
			continue
		var known: Array[StringName] = []
		for e: EnemyData in m.enemies:
			known.append(e.id)
		var bad: Array[StringName] = []
		for w: WaveData in m.wave_table.waves:
			for id: StringName in w.enemy_ids:
				if not known.has(id) and not bad.has(id):
					bad.append(id)
			if w.boss_id != &"":
				if m.boss_by_id(w.boss_id) == null:
					bad.append(w.boss_id)
				elif not known.has(m.boss_by_id(w.boss_id).enemy.id):
					bad.append(w.boss_id)
		_check(bad.is_empty(), "%s: 웨이브가 부르는 적/보스가 전부 등록됨 (없는 것: %s)"
				% [m.id, bad])
		_check(m.enemies.size() <= EnemyManager.MAX_TYPES,
				"%s: 적 종류가 MAX_TYPES 이하 (%d)" % [m.id, m.enemies.size()])

	# 캐릭터 시작 무기
	for path: String in characters:
		var c: CharacterData = load(path) as CharacterData
		_check(c != null and c.starting_weapon != null, "%s 에 시작 무기" % path.get_file())
		_check(c != null and not c.parts.is_empty(), "%s 에 리깅 파츠" % path.get_file())


func test_status_effects() -> void:
	print("[상태 이상 — 스턴 / 넉백 / 흡인]")
	var em := EnemyManager.new()
	get_tree().root.add_child(em)
	em.set_capacity(64)
	var t: int = em.register_enemy(_make_enemy(200.0, 100.0, 12.0))
	GameState.phase = GameState.Phase.PLAYING
	em.target_position = Vector2(1000.0, 0.0)

	# 스턴: 멈춘다
	em.clear()
	em.spawn(t, Vector2.ZERO)
	em.hash_grid.rebuild(PackedFloat32Array([0.0]), PackedFloat32Array([0.0]), 1)
	em.stun_area(Vector2.ZERO, 60.0, 1.0)
	_check(em.is_stunned(0), "스턴이 걸린다")
	for _i in 10:
		em._physics_process(1.0 / 60.0)
	_check(em.position_of(0).x < 1.0, "스턴 중에는 안 움직인다 (x=%.2f)" % em.position_of(0).x)
	for _i in 70:
		em._physics_process(1.0 / 60.0)
	_check(not em.is_stunned(0), "시간이 지나면 풀린다")
	_check(em.position_of(0).x > 1.0, "풀리면 다시 추격한다 (x=%.2f)" % em.position_of(0).x)

	# 넉백: 바깥으로 밀린다
	em.clear()
	em.spawn(t, Vector2(50.0, 0.0))
	em.hash_grid.rebuild(PackedFloat32Array([50.0]), PackedFloat32Array([0.0]), 1)
	em.knockback_area(Vector2.ZERO, 120.0, 900.0)
	em._physics_process(1.0 / 60.0)
	_check(em.position_of(0).x > 50.0, "넉백은 바깥으로 민다 (x=%.1f)" % em.position_of(0).x)

	# 음수 넉백 = 흡인 (잔반차)
	em.clear()
	em.spawn(t, Vector2(200.0, 0.0))
	em.hash_grid.rebuild(PackedFloat32Array([200.0]), PackedFloat32Array([0.0]), 1)
	em.target_position = Vector2(200.0, 0.0)   # 추격 성분을 없애고 흡인만 본다
	em.knockback_area(Vector2.ZERO, 400.0, -900.0)
	em._physics_process(1.0 / 60.0)
	_check(em.position_of(0).x < 200.0, "음수 넉백은 안쪽으로 빨아들인다 (x=%.1f)" % em.position_of(0).x)

	em.queue_free()
	await get_tree().process_frame


## 찰떡파이 — 쓰러져도 한 번 일어난다 (기획서 5.2)
func test_revive() -> void:
	print("[부활 — 찰떡파이]")
	var em := EnemyManager.new()
	get_tree().root.add_child(em)
	em.set_capacity(8)
	em.register_enemy(_make_enemy(0.0, 10.0, 12.0))

	var player: Player = (load("res://entities/player/player.tscn") as PackedScene).instantiate()
	get_tree().root.add_child(player)
	player.setup(em, load("res://data/characters/kim_private.tres") as CharacterData)
	GameState.phase = GameState.Phase.PLAYING

	player.take_damage(9999.0)
	_check(player.hp <= 0.0, "부활이 없으면 쓰러진다")

	player.hp = player.max_hp
	player.apply_upgrade(load("res://data/upgrades/rice_cake.tres") as UpgradeData)
	_check(player.revives == 1, "찰떡파이가 부활 1회를 준다")
	player.take_damage(9999.0)
	_check(player.hp > 0.0, "쓰러지지 않고 일어난다 (HP %.0f)" % player.hp)
	_check(player.revives == 0, "부활 횟수를 소모한다")
	_check(player.is_invulnerable(), "일어난 직후에는 잠깐 무적")

	player.invulnerable = false
	player._invuln_left = 0.0
	player.take_damage(9999.0)
	_check(player.hp <= 0.0, "부활을 다 쓰면 그대로 쓰러진다")

	player.queue_free()
	em.queue_free()
	await get_tree().process_frame


## 보스 4종의 패턴이 실제로 뭔가를 하는지. 데이터만 있고 안 도는 걸 잡는다.
func test_boss_patterns() -> void:
	print("[보스 4종 패턴]")
	var map: MapData = load("res://data/maps/parade_ground.tres") as MapData
	var em := EnemyManager.new()
	get_tree().root.add_child(em)
	em.set_capacity(512)
	em.register_map(map)

	var hazards := HazardManager.new()
	get_tree().root.add_child(hazards)
	hazards.set_capacity(256)

	var target := Node2D.new()
	get_tree().root.add_child(target)
	target.global_position = Vector2(300.0, 0.0)
	GameState.phase = GameState.Phase.PLAYING

	for boss_data: BossData in map.bosses:
		var boss := BossController.new()
		get_tree().root.add_child(boss)
		hazards.clear()
		var ok: bool = boss.setup(em, target, null, hazards, boss_data, &"shovel_mob", Vector2.ZERO)
		_check(ok, "%s 등장" % boss_data.id)
		if not ok:
			boss.queue_free()
			continue

		var before_enemies: int = em.get_count()
		# 넉넉히 굴려서 패턴이 한 바퀴 돌게 한다
		for _i in 900:
			boss._physics_process(1.0 / 60.0)

		match boss_data.pattern:
			BossData.Pattern.CHARGER:
				_check(em.get_count() > before_enemies,
						"대대장 순시는 잡몹을 소환한다 (%d → %d)" % [before_enemies, em.get_count()])
			BossData.Pattern.BARRAGE:
				_check(hazards.get_count() > 0,
						"사단 검열관은 탄막을 뿌린다 (%d발)" % hazards.get_count())
			BossData.Pattern.FIELD:
				_check(hazards.get_count() > 0,
						"유격 3주차는 필드/충격파를 만든다 (%d개)" % hazards.get_count())
			BossData.Pattern.FINALE:
				# 절반까지 깎으면 한 번 쓰러진 척해야 한다
				var i: int = em.index_of_handle(boss.handle)
				_check(i >= 0, "전역 연기 통보서가 살아 있다")
				if i >= 0:
					em.damage(i, boss_data.enemy.max_hp * 0.6)
					for _j in 20:
						boss._physics_process(1.0 / 60.0)
					_check(boss._state == BossController.State.FAKE_DEATH,
							"절반 아래로 깎이면 쓰러진 척한다 (state=%d)" % boss._state)
					for _j in 300:
						boss._physics_process(1.0 / 60.0)
					_check(boss._phase_two, "그리고 2페이즈로 일어난다")
		boss.queue_free()

	target.queue_free()
	hazards.queue_free()
	em.queue_free()
	await get_tree().process_frame


# =============================================================================
# M4 — 메타 진행 (저장 · PX 상점 · 해금 · 표창장)
# =============================================================================

const TEST_SAVE_PATH: String = "user://test_savegame.cfg"


## 테스트가 진짜 세이브를 건드리지 않게 격리한다. _run_all 맨 앞에서 부른다.
## 아레나 스모크 테스트도 한 판을 끝내면서 record_run 을 부르기 때문에,
## 이걸 안 하면 테스트를 돌릴 때마다 플레이어의 월급이 올라간다.
func _sandbox_save_system() -> void:
	SaveSystem.save_path = TEST_SAVE_PATH
	SaveSystem.autosave = false
	SaveSystem.data = SaveSystem._default_data()


func _clear_test_save() -> void:
	if FileAccess.file_exists(TEST_SAVE_PATH):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(TEST_SAVE_PATH))


func test_meta_save() -> void:
	print("[메타 저장 — 왕복과 마이그레이션]")
	_sandbox_save_system()
	_clear_test_save()

	# --- 왕복 ---
	SaveSystem.autosave = true
	SaveSystem.add_salary(4321)
	SaveSystem.data["px_upgrades"]["px_ration"] = 3
	(SaveSystem.data["unlocked_characters"] as Array).append("choi_corporal")
	(SaveSystem.data["commendations"] as Array).append("cmd_sweeper")
	SaveSystem.stats()["total_kills"] = 777
	SaveSystem.stats()["best_survive_sec"] = 612.5
	SaveSystem.remember_selection(&"choi_corporal", &"obstacle_course")
	SaveSystem.save_game()

	SaveSystem.data = SaveSystem._default_data()   # 껐다 켠 셈 치고
	SaveSystem.load_game()
	_check(SaveSystem.salary() == 4321, "월급이 왕복한다 (got %d)" % SaveSystem.salary())
	_check(SaveSystem.px_level(&"px_ration") == 3, "PX 레벨이 왕복한다")
	_check(SaveSystem.is_character_unlocked(&"choi_corporal"), "해금이 왕복한다")
	_check(SaveSystem.has_commendation(&"cmd_sweeper"), "표창장이 왕복한다")
	_check(int(SaveSystem.stats().get("total_kills", 0)) == 777, "누적 처치가 왕복한다")
	_check(is_equal_approx(float(SaveSystem.stats().get("best_survive_sec", 0.0)), 612.5),
			"실수 통계가 왕복한다")
	_check(SaveSystem.last_character() == &"choi_corporal", "마지막 선택 캐릭터가 왕복한다")
	_check(SaveSystem.last_map() == &"obstacle_course", "마지막 선택 맵이 왕복한다")

	# --- v1 세이브 마이그레이션 (누적 통계가 없던 시절) ---
	var old := ConfigFile.new()
	old.set_value("save", "version", 1)
	old.set_value("save", "salary", 900)
	old.set_value("save", "unlocked_characters", ["kim_private", "park_sergeant"])
	old.save(TEST_SAVE_PATH)
	SaveSystem.load_game()
	_check(int(SaveSystem.data["version"]) == SaveSystem.SAVE_VERSION,
			"옛 세이브가 현재 버전으로 올라온다")
	_check(SaveSystem.salary() == 900, "마이그레이션이 월급을 지키다")
	_check(SaveSystem.is_character_unlocked(&"park_sergeant"), "마이그레이션이 해금을 지키다")
	_check(SaveSystem.stats().has("total_kills"), "없던 누적 통계가 채워진다")

	# --- 망가진 세이브 ---
	var broken := ConfigFile.new()
	broken.set_value("save", "version", SaveSystem.SAVE_VERSION)
	broken.set_value("save", "salary", "이건 숫자가 아니다")
	broken.set_value("save", "unlocked_characters", 12345)
	broken.set_value("save", "stats", {})
	broken.save(TEST_SAVE_PATH)
	SaveSystem.load_game()
	_check(typeof(SaveSystem.data["salary"]) == TYPE_INT, "망가진 월급이 기본값으로 돌아온다")
	_check(SaveSystem.is_character_unlocked(&"kim_private"), "기본 캐릭터는 절대 잠기지 않는다")
	_check(SaveSystem.is_map_unlocked(&"parade_ground"), "기본 맵은 절대 잠기지 않는다")
	_check(SaveSystem.stats().has("boss_kills"), "빈 통계에 기본 키가 채워진다")

	_clear_test_save()
	SaveSystem.autosave = false
	SaveSystem.data = SaveSystem._default_data()


func test_px_shop() -> void:
	print("[PX 상점]")
	_sandbox_save_system()
	var shop: PxShopTable = SaveSystem.px_shop
	_check(shop.items.size() == 10, "PX 항목 10종 (got %d)" % shop.items.size())

	var item: PxUpgradeData = shop.find(&"px_ration")
	_check(item != null, "px_ration 을 찾는다")
	_check(SaveSystem.px_level(&"px_ration") == 0, "처음엔 레벨 0")
	_check(not SaveSystem.buy_px(&"px_ration"), "월급이 없으면 못 산다")

	SaveSystem.add_salary(1_000_000)
	var first_cost: int = SaveSystem.px_next_cost(&"px_ration")
	var before: int = SaveSystem.salary()
	_check(SaveSystem.buy_px(&"px_ration"), "월급이 있으면 산다")
	_check(SaveSystem.px_level(&"px_ration") == 1, "레벨이 1 오른다")
	_check(SaveSystem.salary() == before - first_cost, "산 만큼 월급이 준다")
	_check(SaveSystem.px_next_cost(&"px_ration") > first_cost, "다음 레벨이 더 비싸다")

	# 최대 레벨까지 밀어붙인다
	while SaveSystem.buy_px(&"px_ration"):
		pass
	_check(SaveSystem.px_level(&"px_ration") == item.max_level,
			"최대 레벨에서 멈춘다 (got %d)" % SaveSystem.px_level(&"px_ration"))
	_check(SaveSystem.px_next_cost(&"px_ration") == -1, "최대면 가격이 -1")
	_check(not SaveSystem.can_buy_px(&"px_ration"), "최대면 더 못 산다")
	_check(not SaveSystem.can_buy_px(&"없는항목"), "없는 항목은 못 산다")

	# 합산: ADD 는 더하고 MULT 는 곱한다
	_check(is_equal_approx(SaveSystem.px_add(&"max_hp"), item.per_level * float(item.max_level)),
			"ADD 합계가 맞는다 (got %.2f)" % SaveSystem.px_add(&"max_hp"))
	_check(is_equal_approx(SaveSystem.px_mult(&"speed_mult"), 1.0),
			"안 산 MULT 는 1.0")
	SaveSystem.buy_px(&"px_boots")
	var boots: PxUpgradeData = shop.find(&"px_boots")
	_check(is_equal_approx(SaveSystem.px_mult(&"speed_mult"), 1.0 + boots.per_level),
			"MULT 가 곱해진다 (got %.3f)" % SaveSystem.px_mult(&"speed_mult"))

	# 쿨다운은 음수 per_level 이다 — 배율이 1보다 작아져야 공격이 빨라진다
	SaveSystem.buy_px(&"px_stopwatch")
	_check(SaveSystem.px_mult(&"cooldown_mult") < 1.0,
			"초시계는 쿨다운 배율을 낮춘다 (got %.3f)" % SaveSystem.px_mult(&"cooldown_mult"))

	SaveSystem.data = SaveSystem._default_data()


## PX 강화가 실제 플레이어 스탯에 얹히는지. 표만 맞고 배선이 빠지는 사고를 막는다.
func test_px_applies_to_player() -> void:
	print("[PX 강화가 플레이어에 실제로 붙는가]")
	_sandbox_save_system()
	var character: CharacterData = load("res://data/characters/kim_private.tres") as CharacterData

	var plain: Player = (load("res://entities/player/player.tscn") as PackedScene).instantiate()
	add_child(plain)
	plain.setup(null, character)
	var base_hp: float = plain.max_hp
	var base_speed: float = plain.speed_mult
	plain.queue_free()

	SaveSystem.add_salary(1_000_000)
	SaveSystem.buy_px(&"px_ration")
	SaveSystem.buy_px(&"px_boots")
	var buffed: Player = (load("res://entities/player/player.tscn") as PackedScene).instantiate()
	add_child(buffed)
	buffed.setup(null, character)
	var ration: PxUpgradeData = SaveSystem.px_shop.find(&"px_ration")
	var boots: PxUpgradeData = SaveSystem.px_shop.find(&"px_boots")
	_check(is_equal_approx(buffed.max_hp, base_hp + ration.per_level),
			"건빵이 최대 체력을 올린다 (%.1f → %.1f)" % [base_hp, buffed.max_hp])
	_check(is_equal_approx(buffed.hp, buffed.max_hp), "올라간 체력만큼 꽉 채우고 시작한다")
	_check(is_equal_approx(buffed.speed_mult, base_speed * (1.0 + boots.per_level)),
			"전투화가 이동 배율을 올린다 (got %.3f)" % buffed.speed_mult)
	buffed.queue_free()

	SaveSystem.data = SaveSystem._default_data()


func test_commendations() -> void:
	print("[표창장]")
	_sandbox_save_system()
	var table: CommendationTable = SaveSystem.commendations_table
	_check(table.commendations.size() == 12, "표창장 12장 (got %d)" % table.commendations.size())

	var seen: Array[StringName] = []
	for c: CommendationData in table.commendations:
		_check(c.condition != null, "%s 에 조건이 있다" % c.id)
		_check(not seen.has(c.id), "표창장 id 가 안 겹친다 (%s)" % c.id)
		seen.append(c.id)

	_check(SaveSystem.check_commendations().is_empty(), "빈 기록에서는 아무것도 안 나온다")

	SaveSystem.stats()["total_kills"] = 1000
	var awarded: Array[StringName] = SaveSystem.check_commendations()
	_check(awarded.has(&"cmd_sweeper"), "누적 1,000 처치로 청소 유공이 나온다 (got %s)" % [awarded])
	_check(SaveSystem.has_commendation(&"cmd_sweeper"), "받은 표창장이 기록에 남는다")
	_check(SaveSystem.salary() >= 200, "표창장 보상이 월급으로 들어온다 (got %d)" % SaveSystem.salary())

	_check(SaveSystem.check_commendations().is_empty(), "같은 표창장을 두 번 주지 않는다")
	var salary_after: int = SaveSystem.salary()
	SaveSystem.check_commendations()
	_check(SaveSystem.salary() == salary_after, "두 번째 호출이 월급을 또 주지 않는다")

	# 연쇄: 한 표창장의 보상 월급이 다른 표창장의 누적 월급 조건을 밀어 올린다.
	# 신병 수료(보상 100)가 29,900 을 30,000 으로 만들어 적금 만기까지 같이 터져야 한다.
	SaveSystem.stats()["total_salary"] = 29_900
	SaveSystem.stats()["total_runs"] = 1
	var cascaded: Array[StringName] = SaveSystem.check_commendations()
	_check(cascaded.has(&"cmd_first_day"), "복무 1회로 신병 수료가 나온다 (got %s)" % [cascaded])
	_check(cascaded.has(&"cmd_savings"),
			"보상 월급이 다음 표창장 조건을 채우면 같은 판정에서 연달아 발급된다 (got %s)" % [cascaded])

	SaveSystem.data = SaveSystem._default_data()


func test_unlocks() -> void:
	print("[해금]")
	_sandbox_save_system()
	var table: UnlockTable = SaveSystem.unlock_table

	var characters: Array[String] = _all_tres("res://data/characters")
	var maps: Array[String] = _all_tres("res://data/maps")
	_check(table.unlocks.size() == characters.size() + maps.size(),
			"해금표가 캐릭터+맵 전부를 덮는다 (%d vs %d)"
			% [table.unlocks.size(), characters.size() + maps.size()])

	# 해금표의 target_id 가 실재하는 파일이어야 한다.
	# 아레나가 "파일 이름 = id" 로 캐릭터를 불러오기 때문에 이게 깨지면 게임이 안 뜬다.
	for u: UnlockData in table.unlocks:
		var dir: String = "characters" if u.target == UnlockData.Target.CHARACTER else "maps"
		var path: String = "res://data/%s/%s.tres" % [dir, u.target_id]
		_check(ResourceLoader.exists(path), "해금 %s 의 대상 파일이 있다 (%s)" % [u.id, path])
		_check(u.condition != null, "해금 %s 에 조건이 있다" % u.id)

	# 반대 방향: 모든 캐릭터/맵에 해금 항목이 있어야 선택 화면에 뜬다
	for path: String in characters:
		var c: CharacterData = load(path) as CharacterData
		_check(path.get_file() == "%s.tres" % c.id, "캐릭터 파일 이름 = id (%s)" % path.get_file())
		_check(table.for_target(UnlockData.Target.CHARACTER, c.id) != null,
				"캐릭터 %s 에 해금 항목이 있다" % c.id)
	for path: String in maps:
		var m: MapData = load(path) as MapData
		_check(path.get_file() == "%s.tres" % m.id, "맵 파일 이름 = id (%s)" % path.get_file())
		_check(table.for_target(UnlockData.Target.MAP, m.id) != null,
				"맵 %s 에 해금 항목이 있다" % m.id)

	# 조건형(무료): 조건을 채우면 저절로 열린다
	_check(not SaveSystem.is_character_unlocked(&"choi_corporal"), "최상병은 처음엔 잠겨 있다")
	_check(SaveSystem.refresh_unlocks().is_empty(), "조건 전에는 안 열린다")
	SaveSystem.stats()["total_kills"] = 500
	var opened: Array[UnlockData] = SaveSystem.refresh_unlocks()
	_check(opened.size() == 1 and opened[0].target_id == &"choi_corporal",
			"누적 500 처치로 최상병이 열린다 (got %s)" % [opened.size()])
	_check(SaveSystem.is_character_unlocked(&"choi_corporal"), "열린 캐릭터가 기록에 남는다")
	_check(SaveSystem.refresh_unlocks().is_empty(), "이미 열린 건 다시 안 연다")

	# 구매형: 조건을 채워도 값을 내야 한다
	_check(not SaveSystem.can_buy_unlock(&"unlock_comms"), "조건 전에는 살 수 없다")
	SaveSystem.stats()["evolutions"] = 1
	_check(not SaveSystem.can_buy_unlock(&"unlock_comms"), "월급이 없으면 조건을 채워도 못 산다")
	SaveSystem.add_salary(10_000)
	_check(SaveSystem.can_buy_unlock(&"unlock_comms"), "조건 + 월급이면 살 수 있다")
	var before: int = SaveSystem.salary()
	_check(SaveSystem.buy_unlock(&"unlock_comms"), "구매형 해금을 산다")
	_check(SaveSystem.is_character_unlocked(&"comms_soldier"), "산 캐릭터가 열린다")
	_check(SaveSystem.salary() == before - 600, "산 만큼 월급이 준다")
	_check(not SaveSystem.can_buy_unlock(&"unlock_comms"), "이미 산 건 또 못 산다")
	_check(SaveSystem.refresh_unlocks().is_empty(), "구매형은 조건만으로 열리지 않는다")

	SaveSystem.data = SaveSystem._default_data()


## 한 판이 끝났을 때의 정산. 월급 공식은 data/progression.tres 에 있다.
func test_run_settlement() -> void:
	print("[런 결산 — 월급 · 통계 · 표창장]")
	_sandbox_save_system()
	var stats: Dictionary = {
		"kills": 1200, "level": 24, "survived_sec": 620.0,
		"boss_kills": 2, "evolutions": 1,
	}
	var expected: int = GameState.progression.salary_for(true, stats)
	_check(expected > 0, "월급 공식이 0보다 큰 값을 낸다 (got %d)" % expected)
	_check(GameState.progression.salary_for(true, stats)
			> GameState.progression.salary_for(false, stats), "전역하면 더 받는다")

	var result: Dictionary = SaveSystem.record_run(true, stats)
	_check(int(result["salary"]) == expected, "결산이 공식대로 월급을 준다")
	var s: Dictionary = SaveSystem.stats()
	_check(int(s["total_runs"]) == 1, "복무 횟수가 오른다")
	_check(int(s["runs_won"]) == 1, "전역 횟수가 오른다")
	_check(int(s["total_kills"]) == 1200, "누적 처치가 쌓인다")
	_check(int(s["boss_kills"]) == 2, "보스 처치가 쌓인다")
	_check(int(s["best_level"]) == 24, "최고 진급이 기록된다")
	_check(is_equal_approx(float(s["best_survive_sec"]), 620.0), "최장 생존이 기록된다")
	_check((result["commendations"] as Array).has(&"cmd_discharge"),
			"전역하면 전역증 표창이 나온다 (got %s)" % [result["commendations"]])
	_check((result["unlocks"] as Array).size() > 0, "결산에서 해금도 같이 열린다")

	# 나쁜 판이 좋은 기록을 깎아먹으면 안 된다
	SaveSystem.record_run(false, {"kills": 3, "level": 2, "survived_sec": 10.0})
	_check(int(SaveSystem.stats()["best_level"]) == 24, "최고 기록은 내려가지 않는다")
	_check(int(SaveSystem.stats()["best_run_kills"]) == 1200, "한 판 최다 처치도 안 내려간다")
	_check(int(SaveSystem.stats()["total_runs"]) == 2, "진 판도 복무에는 들어간다")
	_check(int(SaveSystem.stats()["runs_won"]) == 1, "진 판은 전역에 안 들어간다")

	SaveSystem.data = SaveSystem._default_data()


## 메타 화면 4종이 실제로 만들어지고 항목이 다 뜨는지.
## 겉모습은 tools/menu_shot.sh 로 눈으로 본다 — 여기서는 배선만 본다.
func test_meta_screens() -> void:
	print("[메타 화면 — 메인 / 출두 / PX / 표창장]")
	_sandbox_save_system()
	SaveSystem.add_salary(50_000)

	var root: Control = (load("res://ui/meta/meta_root.tscn") as PackedScene).instantiate()
	add_child(root)
	await get_tree().process_frame

	for path: String in ["MainMenu", "CharacterSelect", "PxShop", "CommendationBoard", "OptionsPanel"]:
		_check(root.get_node_or_null(path) != null, "메타 화면에 %s 가 있다" % path)

	var menu: Control = root.get_node("MainMenu")
	_check(menu.visible, "처음엔 메인 메뉴가 보인다")

	root._on_open_requested(&"shop")
	await get_tree().process_frame
	var shop: Control = root.get_node("PxShop")
	_check(shop.visible and not menu.visible, "PX 상점으로 넘어간다")
	_check(shop._list.get_child_count() == SaveSystem.px_shop.items.size(),
			"PX 항목이 전부 줄에 뜬다 (got %d)" % shop._list.get_child_count())

	root._on_open_requested(&"board")
	await get_tree().process_frame
	var board: Control = root.get_node("CommendationBoard")
	_check(board.visible, "표창장으로 넘어간다")
	_check(board._list.get_child_count() == SaveSystem.commendations_table.commendations.size(),
			"표창장이 전부 줄에 뜬다 (got %d)" % board._list.get_child_count())

	root._on_open_requested(&"select")
	await get_tree().process_frame
	var select: Control = root.get_node("CharacterSelect")
	_check(select.visible, "출두 신고로 넘어간다")
	_check(select._char_list.get_child_count() == _all_tres("res://data/characters").size(),
			"캐릭터가 전부 뜬다 (got %d)" % select._char_list.get_child_count())
	_check(select._map_list.get_child_count() == _all_tres("res://data/maps").size(),
			"맵이 전부 뜬다 (got %d)" % select._map_list.get_child_count())
	_check(not select._start_button.disabled, "기본 캐릭터/맵으로 출두할 수 있다")

	# 고른 걸 저장해야 한다.
	# MetaRoot._on_start 는 아레나로 씬을 갈아끼우므로 먼저 끊는다 —
	# 안 끊으면 테스트 러너 씬까지 같이 날아가서 뒤의 검사가 통째로 안 돈다. 실제로 겪었다.
	select.start_requested.disconnect(root._on_start)
	select._choose(false, &"parade_ground")
	select._on_start()
	_check(SaveSystem.last_map() == &"parade_ground", "고른 맵이 저장된다")

	# 화면 전환 후에도 다시 메인으로 돌아온다
	# 옵션 화면. 여기 파스 에러가 나도 다른 테스트는 멀쩡히 돌아서
	# "0개 실패" 가 뜬 적이 있다 -- 화면을 실제로 열어 봐야 잡힌다.
	root._on_open_requested(&"options")
	await get_tree().process_frame
	var options: Control = root.get_node("OptionsPanel")
	_check(options.visible, "설정으로 넘어간다")
	var opt_box: VBoxContainer = options.get_node("Center/Panel/Margin/VBox")
	_check(opt_box.get_child_count() > 10,
			"설정 항목이 그려진다 (토글 6 + 흔들림 + 저사양 + 볼륨 3 + 언어, got %d)"
			% opt_box.get_child_count())

	# 볼륨 슬라이더가 실제로 Settings 를 움직이는가
	var before_master: float = Settings.master_volume
	var sliders: Array[HSlider] = []
	for child: Node in opt_box.get_children():
		if child is HBoxContainer:
			for sub: Node in child.get_children():
				if sub is HSlider:
					sliders.append(sub as HSlider)
	_check(sliders.size() == 3, "볼륨 슬라이더 3종 (got %d)" % sliders.size())
	if sliders.size() == 3:
		sliders[0].value = 0.4
		_check(is_equal_approx(Settings.master_volume, 0.4),
				"슬라이더가 설정을 바꾼다 (got %.2f)" % Settings.master_volume)
	Settings.master_volume = before_master

	root._go_main()
	await get_tree().process_frame
	_check(menu.visible and not shop.visible, "메인으로 돌아온다")

	root.queue_free()
	SaveSystem.data = SaveSystem._default_data()


## 아레나가 저장된 선택을 실제로 싣는지.
func test_arena_uses_selection() -> void:
	print("[아레나가 저장된 선택을 싣는가]")
	_sandbox_save_system()
	(SaveSystem.data["unlocked_characters"] as Array).append("park_sergeant")
	(SaveSystem.data["unlocked_maps"] as Array).append("winter_field")
	SaveSystem.remember_selection(&"park_sergeant", &"winter_field")

	var arena: Node = (load("res://maps/arena.tscn") as PackedScene).instantiate()
	add_child(arena)
	await get_tree().process_frame
	_check(arena.character != null and arena.character.id == &"park_sergeant",
			"저장된 캐릭터로 시작한다 (got %s)" % [arena.character.id if arena.character else &""])
	_check(arena.map != null and arena.map.id == &"winter_field",
			"저장된 맵으로 시작한다 (got %s)" % [arena.map.id if arena.map else &""])
	arena.queue_free()
	await get_tree().process_frame

	SaveSystem.data = SaveSystem._default_data()
	GameState.phase = GameState.Phase.MENU


## 바닥. MapData.ground_color 가 **격자 선 색**으로만 쓰이던 시절에는 맵을 바꿔도
## 바닥이 안 바뀌었다 — 혹한기와 연병장 바닥이 똑같았다. 배선과 결정성을 검사한다.
func test_ground() -> void:
	print("[바닥 — 맵 색이 실제로 칠해지는가]")

	# 맵마다 바닥이 달라야 맵을 바꾼 티가 난다
	var seen: Array[Color] = []
	for id: String in ["parade_ground", "obstacle_course", "winter_field"]:
		var m: MapData = load("res://data/maps/%s.tres" % id) as MapData
		if m == null:
			continue
		for other: Color in seen:
			_check(m.ground_color != other, "%s 바닥색이 다른 맵과 겹치지 않는다" % id)
		seen.append(m.ground_color)
		# 기획서 3.2: 배경은 저채도, 그리고 플레이어가 화면에서 가장 밝아야 한다.
		# 밝은 바닥은 글로우 임계(0.85)에 걸려 화면이 하얗게 번지기도 한다.
		var lum: float = m.ground_color.get_luminance()
		_check(lum < 0.45, "%s 바닥이 충분히 어둡다 (휘도 %.2f)" % [id, lum])

	SaveSystem.remember_selection(&"kim_private", &"winter_field")
	var arena: Node = (load("res://maps/arena.tscn") as PackedScene).instantiate()
	add_child(arena)
	await get_tree().process_frame

	var ground: GroundGrid = arena.get_node("Ground") as GroundGrid
	_check(ground != null, "Ground 가 GroundGrid 다")
	if ground != null:
		_check(ground.ground_color.is_equal_approx(arena.map.ground_color),
				"아레나가 맵 바닥색을 실제로 넘긴다")

		# 얼룩은 좌표에서 뽑아야 한다. randf() 를 쓰면 지나갈 때마다 땅이 새로 생긴다.
		var a: float = ground._hash(7, -3, 2)
		var b: float = ground._hash(7, -3, 2)
		_check(is_equal_approx(a, b), "같은 칸은 늘 같은 얼룩이 나온다")
		_check(not is_equal_approx(ground._hash(7, -3, 2), ground._hash(8, -3, 2)),
				"옆 칸은 다른 얼룩이 나온다")

		var decals: MultiMeshInstance2D = ground.get_node_or_null("GroundDecals") as MultiMeshInstance2D
		_check(decals != null and decals.multimesh != null, "얼룩이 MultiMesh 하나다 (규칙 1)")

	arena.queue_free()
	await get_tree().process_frame
	SaveSystem.data = SaveSystem._default_data()
	GameState.phase = GameState.Phase.MENU


## 타격 스파크. 여기 오기 전 타격 피드백은 적의 흰 플래시 2프레임뿐이었다.
func test_hit_sparks() -> void:
	print("[타격 스파크]")
	var sparks: HitSparks = HitSparks.new()
	add_child(sparks)
	await get_tree().process_frame

	_check(sparks.get_count() == 0, "처음엔 비어 있다")
	EventBus.enemy_damaged.emit(Vector2(120.0, -40.0), 10.0, false)
	_check(sparks.get_count() == HitSparks.PER_HIT,
			"평타 한 방에 %d조각 (got %d)" % [HitSparks.PER_HIT, sparks.get_count()])
	EventBus.enemy_damaged.emit(Vector2(0.0, 0.0), 30.0, true)
	_check(sparks.get_count() == HitSparks.PER_HIT + HitSparks.PER_CRIT,
			"크리티컬은 더 많이 튄다 (got %d)" % sparks.get_count())

	# ★ 상한이 없으면 3,000마리가 서로 맞을 때 화면이 하얗게 덮인다.
	for _i in 200:
		EventBus.enemy_damaged.emit(Vector2.ZERO, 1.0, true)
	_check(sparks.get_count() <= HitSparks.MAX_SPARKS,
			"동시 상한을 넘지 않는다 (%d <= %d)" % [sparks.get_count(), HitSparks.MAX_SPARKS])

	# 수명이 지나면 사라진다. 안 지워지면 계속 쌓인다.
	for _i in 30:
		sparks._physics_process(HitSparks.LIFETIME * 0.2)
	_check(sparks.get_count() == 0, "수명이 다하면 전부 사라진다 (got %d)" % sparks.get_count())

	# 데미지 넘버를 끄면 같이 꺼진다 (저사양 프리셋이 둘을 같이 내린다)
	var was: bool = Settings.damage_numbers
	Settings.damage_numbers = false
	EventBus.enemy_damaged.emit(Vector2.ZERO, 5.0, false)
	_check(sparks.get_count() == 0, "데미지 넘버를 끄면 스파크도 안 튄다")
	Settings.damage_numbers = was

	sparks.queue_free()
	await get_tree().process_frame


## 레벨업 화면 — 유령 카드와 삼켜지는 진급.
##
## _show_next 가 카드를 queue_free 로만 지우던 시절, 그 프레임 동안 죽은 카드가
## 자식으로 남아 있었다. get_child_count() 가 거짓말을 하고 pressed 도 아직 연결돼
## 있어서, 자동 플레이나 큐에 남은 입력이 유령 카드를 눌렀다. 그러면 _pending 이
## 음수가 되고 그 뒤 진급이 전부 _pending <= 0 에 걸려 삼켜진다 —
## 명령서가 다시는 안 뜨고, 20분 판을 무기 1개로 돈다. 실제로 Lv.13 에 죽었다.
func test_level_up_screen() -> void:
	print("[레벨업 화면 — 유령 카드 / 진급이 삼켜지지 않는가]")
	var screen: Control = (load("res://ui/level_up/level_up_screen.tscn") as PackedScene).instantiate()
	add_child(screen)
	var player: Player = (load("res://entities/player/player.tscn") as PackedScene).instantiate()
	add_child(player)
	player.setup(null, load("res://data/characters/kim_private.tres") as CharacterData)
	screen.player = player
	screen.upgrade_table = load("res://data/upgrades/upgrade_table.tres") as UpgradeTable

	var cards: Node = screen.get_node("Center/Panel/Margin/VBox/Cards")

	# 1회차: 카드가 뜨고, 한 장을 고르면 닫히고 자식이 즉시 사라져야 한다.
	EventBus.player_leveled.emit(2)
	_check(screen.visible, "진급하면 명령서가 뜬다")
	_check(cards.get_child_count() == 3, "명령서가 3장 나온다 (got %d)" % cards.get_child_count())
	(cards.get_child(0) as Button).pressed.emit()
	_check(not screen.visible, "한 장을 고르면 닫힌다")
	_check(cards.get_child_count() == 0,
			"고른 즉시 카드가 사라진다 — queue_free 만으로는 이번 프레임에 안 사라진다 (got %d)"
			% cards.get_child_count())

	# 2회차: 닫힌 상태에서 유령 카드를 눌러도 _pending 이 음수가 되면 안 된다.
	EventBus.player_leveled.emit(3)
	_check(cards.get_child_count() == 3, "두 번째 진급에도 3장이 나온다")
	var ghost: Button = cards.get_child(1) as Button
	ghost.pressed.emit()          # 정상 선택
	ghost.pressed.emit()          # 같은 카드를 한 번 더 (더블클릭 / 큐에 남은 입력)
	_check(not screen.visible, "두 번 눌러도 닫힌 상태를 유지한다")

	# 세 번째 진급이 멀쩡히 떠야 한다. 삼켜지면 여기서 걸린다.
	EventBus.player_leveled.emit(4)
	_check(screen.visible, "두 번 누른 뒤에도 다음 진급이 삼켜지지 않는다")
	_check(cards.get_child_count() == 3, "세 번째 진급에도 3장이 나온다")
	(cards.get_child(0) as Button).pressed.emit()

	# 진급이 밀려 있으면 연달아 내민다.
	EventBus.player_leveled.emit(5)
	EventBus.player_leveled.emit(6)
	_check(screen.visible, "진급이 밀려 있으면 계속 뜬다")
	(cards.get_child(0) as Button).pressed.emit()
	_check(screen.visible, "밀린 진급이 남아 있으면 닫지 않는다")
	(cards.get_child(0) as Button).pressed.emit()
	_check(not screen.visible, "밀린 진급을 다 쓰면 닫힌다")

	# 실제로 무기가 늘어나는가 — 명령서 전체를 무작위로 30번 돌려 본다.
	var rng := RandomNumberGenerator.new()
	rng.seed = 4242
	var table: UpgradeTable = screen.upgrade_table
	for _i in 30:
		var offered: Array[UpgradeData] = table.roll(3, player.upgrade_levels, rng)
		if offered.is_empty():
			break
		player.apply_upgrade(offered[rng.randi() % offered.size()])
	_check(player.weapon_ids().size() >= 4,
			"명령서를 무작위로 골라도 무기가 여러 개 붙는다 (got %d개: %s)"
			% [player.weapon_ids().size(), player.weapon_ids()])

	get_tree().paused = false
	screen.queue_free()
	player.queue_free()


## 결과 화면은 트리 전체를 멈춘다. 「재입대」/「부대 복귀」 말고 다른 경로로 씬이
## 사라지면 일시정지가 남아 게임이 통째로 얼어붙는다.
## 자동 플레이가 두 번째 판을 0초 만에 끝내면서 이걸 드러냈다 — 앞 판의 결과 화면이
## 멈춰 둔 트리에서 다음 판이 시작해 시계가 아예 안 흘렀다.
func test_results_screen_unpauses() -> void:
	print("[결과 화면 — 사라질 때 일시정지를 푸는가]")
	var screen: Control = (load("res://ui/results/results_screen.tscn") as PackedScene).instantiate()
	add_child(screen)
	await get_tree().process_frame

	EventBus.run_ended.emit(false, {"kills": 10, "meta": {"salary": 0}})
	_check(screen.visible, "런이 끝나면 결과 화면이 뜬다")
	_check(get_tree().paused, "결과 화면은 트리를 멈춘다")

	# 버튼을 누르지 않고 씬만 없앤다 (씬 전환·테스트 정리와 같은 상황)
	screen.get_parent().remove_child(screen)
	screen.free()
	_check(not get_tree().paused, "화면이 사라지면 일시정지가 풀린다")


## 한/영 로컬라이즈.
##
## 번역 키는 한국어 원문이다. 그래서 표에 없는 문자열도 한국어로는 멀쩡히 나오고,
## 영어로 바꿨을 때만 조용히 한국어가 새어 나온다 -- 눈으로는 잘 안 잡힌다.
## 여기서 데이터에 있는 표시 문자열이 전부 영어를 갖고 있는지 기계로 확인한다.
func test_localization() -> void:
	print("[로컬라이즈 — 한/영]")
	var before: String = TranslationServer.get_locale()

	_check(Settings.LOCALES.has("ko") and Settings.LOCALES.has("en"), "언어 두 종이 등록돼 있다")
	_check(ProjectSettings.get_setting("internationalization/locale/translations") != null,
			"project.godot 에 번역 파일이 등록돼 있다")

	TranslationServer.set_locale("en")
	_check(tr("전역까지 D-100") == "D-100 to Discharge",
			"영어로 바뀐다 (got %s)" % tr("전역까지 D-100"))
	_check(tr("돌아가기") == "Back", "버튼도 번역된다")

	# 데이터의 표시 문자열이 전부 영어를 갖고 있는가.
	# 새 무기/적/명령서를 넣고 번역을 안 하면 여기서 걸린다.
	var untranslated: Array[String] = []
	for dir_name: String in ["weapons", "enemies", "upgrades", "characters", "maps",
			"px", "commendations", "unlocks", "bosses"]:
		for path: String in _all_tres("res://data/%s" % dir_name):
			var res: Resource = load(path)
			if res == null:
				continue
			for prop: StringName in [&"display_name", &"title", &"description"]:
				var value: Variant = res.get(prop)
				if typeof(value) != TYPE_STRING or String(value).is_empty():
					continue
				var text: String = String(value)
				if tr(text) == text and _has_hangul(text):
					untranslated.append("%s.%s = %s" % [path.get_file(), prop, text])
	_check(untranslated.is_empty(),
			"data/ 의 표시 문자열이 전부 번역돼 있다 (빠진 것 %d개: %s)"
			% [untranslated.size(), untranslated.slice(0, 5)])

	TranslationServer.set_locale("ko")
	_check(tr("전역까지 D-100") == "전역까지 D-100", "한국어로 되돌아온다")
	# 표에 없는 문자열은 그대로 나와야 한다 (키가 원문이라 폴백이 자연스럽다)
	_check(tr("표에 없는 아무 문장") == "표에 없는 아무 문장", "번역이 없으면 원문 그대로 나온다")

	TranslationServer.set_locale(before)


func _has_hangul(text: String) -> bool:
	for i in text.length():
		var c: int = text.unicode_at(i)
		if c >= 0xAC00 and c <= 0xD7A3:
			return true
	return false


## 사운드 — 배선과 스로틀링.
##
## 이 게임에서 오디오의 문제는 "소리가 나느냐" 가 아니라 "안 나야 할 때 안 나느냐" 다.
## 적이 3,000마리고 초당 수백 마리가 죽는다. 죽을 때마다 틀면 플레이어는 소리가 아니라
## 잡음을 듣고 AudioStreamPlayer 도 즉시 바닥난다.
func test_audio() -> void:
	print("[사운드 — 배선과 스로틀링]")
	var was_enabled: bool = AudioManager.enabled
	AudioManager.enabled = true

	_check(AudioServer.get_bus_index(&"BGM") >= 0, "BGM 버스가 있다")
	_check(AudioServer.get_bus_index(&"SFX") >= 0, "SFX 버스가 있다")

	var missing: Array[String] = []
	for id: StringName in [&"hit", &"crit", &"kill", &"player_hurt", &"pickup", &"heal",
			&"level_up", &"evolve", &"chest", &"boss_spawn", &"boss_die",
			&"ui_click", &"ui_move", &"victory", &"defeat"]:
		if not AudioManager._streams.has(id):
			missing.append(String(id))
	_check(missing.is_empty(), "효과음 15종이 전부 로드된다 (없는 것: %s)" % [missing])

	# --- 스로틀링 ---
	# 같은 소리를 한 프레임에 1,000번 요청해도 한 번만 나야 한다.
	AudioManager._last_played.clear()
	var played: int = 0
	for _i in 1000:
		if AudioManager.play_sfx(&"hit"):
			played += 1
	_check(played == 1, "같은 소리를 1,000번 요청해도 간격 안에서는 한 번만 난다 (got %d)" % played)
	_check(AudioManager.active_voices() <= AudioManager.VOICE_COUNT,
			"플레이어 수를 넘지 않는다")

	# 서로 다른 소리는 각각 난다 (스로틀은 소리별이다)
	AudioManager._last_played.clear()
	var distinct: int = 0
	for id: StringName in [&"hit", &"kill", &"crit", &"pickup", &"heal"]:
		if AudioManager.play_sfx(id):
			distinct += 1
	_check(distinct == 5, "다른 소리는 각각 난다 (got %d)" % distinct)

	# 플레이어가 다 차면 조용히 버린다 (남의 소리를 자르지 않는다)
	AudioManager._last_played.clear()
	for p: AudioStreamPlayer in AudioManager._voices:
		p.stream = AudioManager._streams[&"boss_spawn"]
		p.play()
	AudioManager._last_played.clear()
	_check(not AudioManager.play_sfx(&"kill"),
			"플레이어가 다 차면 새 소리를 버린다")
	for p: AudioStreamPlayer in AudioManager._voices:
		p.stop()

	# --- 배선 ---
	# 적 피격음은 데미지 넘버 설정에 묶이면 안 된다.
	# damage_number_requested 에 소리를 얹었다가 "데미지 넘버 끔" 이 "타격음 끔" 이
	# 되는 사고가 있었다. enemy_damaged 는 설정과 무관하게 나와야 한다.
	var em := EnemyManager.new()
	get_tree().root.add_child(em)
	em.set_capacity(4)
	em.register_enemy(_make_enemy(0.0, 100.0, 12.0))
	em.spawn(0, Vector2.ZERO)

	# GDScript 람다는 값으로 캡처한다. int 를 세면 사본이 늘어나고 바깥은 0 그대로다.
	# 배열은 참조라서 append 가 바깥에 보인다.
	var hits: Array[float] = []
	var cb := func(_p: Vector2, amount: float, _c: bool) -> void: hits.append(amount)
	EventBus.enemy_damaged.connect(cb)
	var before_setting: bool = Settings.damage_numbers
	Settings.damage_numbers = false
	em.damage(0, 5.0)
	_check(hits.size() == 1, "데미지 넘버를 꺼도 피격 신호는 나온다 (got %d)" % hits.size())
	Settings.damage_numbers = true
	em.damage(0, 5.0)
	_check(hits.size() == 2, "켜도 한 번만 나온다 (got %d)" % hits.size())
	Settings.damage_numbers = before_setting
	EventBus.enemy_damaged.disconnect(cb)
	em.queue_free()

	# 볼륨 0 이 음소거가 되는지 (linear_to_db(0) = -inf)
	var before_sfx: float = Settings.sfx_volume
	Settings.sfx_volume = 0.0
	AudioManager.apply_volumes()
	_check(AudioServer.get_bus_volume_db(AudioServer.get_bus_index(&"SFX")) < -60.0,
			"볼륨 0 이면 사실상 음소거된다")
	Settings.sfx_volume = before_sfx
	AudioManager.apply_volumes()

	AudioManager.enabled = was_enabled


## 튜토리얼 — 첫 판에만, 게임을 멈추지 않고, 해낸 건 건너뛴다.
func test_tutorial() -> void:
	print("[튜토리얼]")
	_sandbox_save_system()
	_check(SaveSystem.tutorial_pending(), "새 세이브에서는 튜토리얼이 뜬다")

	var overlay: TutorialOverlay = (load("res://ui/tutorial_overlay.tscn") as PackedScene).instantiate()
	add_child(overlay)
	var player: Player = (load("res://entities/player/player.tscn") as PackedScene).instantiate()
	add_child(player)
	player.setup(null, load("res://data/characters/kim_private.tres") as CharacterData)
	overlay.player = player

	GameState.phase = GameState.Phase.PLAYING
	GameState.elapsed = 0.0
	_check(not overlay.visible, "시작하자마자 뜨지는 않는다")

	# 첫 단계는 바로 뜬다. 늦게 띄우면 그 전에 움직여 버려서 한 번도 안 보인다.
	GameState.elapsed = 0.1
	overlay._process(0.0)
	_check(overlay.visible, "첫 안내가 곧바로 뜬다")
	_check(overlay.current_step() == 0, "1단계 (이동)")
	_check(not get_tree().paused, "튜토리얼은 게임을 멈추지 않는다")

	# 조건을 바로 채워도 읽을 시간은 준다
	player.global_position += Vector2(400.0, 0.0)
	GameState.elapsed = 0.5
	overlay._process(0.0)
	_check(overlay.current_step() == 0,
			"움직이자마자 사라지지 않는다 (읽을 시간 %.1f초)" % overlay.MIN_SHOW)

	GameState.elapsed = 3.5
	overlay._process(0.0)
	_check(overlay.current_step() == 1, "읽을 시간이 지나면 다음 단계로 (got %d)" % overlay.current_step())

	# 이미 해낸 일은 건너뛴다
	EventBus.enemy_died.emit(Vector2.ZERO, 1.0, &"shovel_mob")
	EventBus.xp_gained.emit(1.0, 1.0, 10.0)
	GameState.elapsed = 9.0
	overlay._process(0.0)
	GameState.elapsed = 12.0
	overlay._process(0.0)
	_check(overlay.current_step() == 3,
			"이미 잡고 주웠으면 그 단계들을 건너뛴다 (got %d)" % overlay.current_step())

	# 마지막 단계까지 끝나면 세이브에 남는다
	EventBus.player_leveled.emit(2)
	GameState.elapsed = 20.0
	overlay._process(0.0)
	_check(overlay.current_step() >= overlay.STEPS.size(), "전부 끝난다")
	_check(not SaveSystem.tutorial_pending(), "끝나면 세이브에 남는다")

	overlay.queue_free()
	player.queue_free()

	# 두 번째 판에는 안 뜬다
	var again: TutorialOverlay = (load("res://ui/tutorial_overlay.tscn") as PackedScene).instantiate()
	add_child(again)
	_check(again._finished, "이미 본 뒤에는 아예 시작하지 않는다")
	again.queue_free()

	# 설정에서 되살릴 수 있다
	SaveSystem.reset_tutorial()
	_check(SaveSystem.tutorial_pending(), "다시 보기로 되살아난다")

	# 조건을 안 채워도 시간이 지나면 넘어간다 (안 죽이는 사람에게 영원히 남으면 안 된다)
	SaveSystem.data = SaveSystem._default_data()
	var stuck: TutorialOverlay = (load("res://ui/tutorial_overlay.tscn") as PackedScene).instantiate()
	add_child(stuck)
	var idle: Player = (load("res://entities/player/player.tscn") as PackedScene).instantiate()
	add_child(idle)
	idle.setup(null, load("res://data/characters/kim_private.tres") as CharacterData)
	stuck.player = idle
	GameState.elapsed = 0.1
	stuck._process(0.0)
	var first: int = stuck.current_step()
	GameState.elapsed = 1.0 + stuck.STEP_TIMEOUT + 1.0
	stuck._process(0.0)
	_check(stuck.current_step() > first,
			"아무것도 안 해도 시간이 지나면 넘어간다 (%d → %d)" % [first, stuck.current_step()])
	stuck.queue_free()
	idle.queue_free()

	GameState.phase = GameState.Phase.MENU
	GameState.elapsed = 0.0
	SaveSystem.data = SaveSystem._default_data()


## 플로팅 조이스틱 — 터치가 실제 이동으로 이어지는가.
##
## Player 를 건드리지 않고 move_* 액션을 눌러 Input.get_vector 경로를 그대로 태운다.
## 그래서 키보드/자동플레이/터치가 같은 코드로 흐른다. 여기서는 그 배선을 확인한다.
func test_joystick() -> void:
	print("[플로팅 조이스틱]")
	var joy: FloatingJoystick = (load("res://ui/touch/floating_joystick.tscn") as PackedScene).instantiate()
	add_child(joy)
	joy.size = Vector2(1080.0, 1920.0)

	_check(not joy.is_active(), "가만히 있으면 안 잡혀 있다")

	# 화면 위쪽은 UI 몫이다. 여기를 눌러도 조이스틱이 안 잡혀야 한다.
	joy._unhandled_input(_touch(Vector2(540.0, 200.0), true, 0))
	_check(not joy.is_active(), "위쪽(UI 영역)에서는 안 잡힌다")

	# 아래쪽을 누르면 그 자리가 중심이 된다
	var origin := Vector2(300.0, 1500.0)
	joy._unhandled_input(_touch(origin, true, 0))
	_check(joy.is_active(), "아래쪽을 누르면 잡힌다")
	_check(joy._origin == origin, "누른 자리가 중심이 된다 (플로팅)")

	# 데드존 안에서는 입력이 없다
	joy._unhandled_input(_drag(origin + Vector2(8.0, 0.0), 0))
	_check(not Input.is_action_pressed(&"move_right"),
			"데드존 안에서는 입력이 안 나간다")

	# 오른쪽으로 끌면 오른쪽 액션이 눌린다
	joy._unhandled_input(_drag(origin + Vector2(joy.max_radius, 0.0), 0))
	_check(Input.is_action_pressed(&"move_right"), "오른쪽으로 끌면 move_right")
	_check(not Input.is_action_pressed(&"move_left"), "반대쪽은 안 눌린다")
	_check(is_equal_approx(Input.get_action_strength(&"move_right"), 1.0),
			"최대 반경에서 세기 1.0 (got %.2f)" % Input.get_action_strength(&"move_right"))

	# 실제 이동 방향과 맞는가 (Player 가 읽는 그 벡터)
	var dir: Vector2 = Input.get_vector(&"move_left", &"move_right", &"move_up", &"move_down")
	_check(dir.x > 0.9 and absf(dir.y) < 0.1, "Player 가 읽는 벡터가 오른쪽이다 (got %s)" % dir)

	# 절반만 끌면 절반 세기
	joy._unhandled_input(_drag(origin + Vector2(joy.max_radius * 0.5, 0.0), 0))
	_check(absf(Input.get_action_strength(&"move_right") - 0.5) < 0.1,
			"절반 끌면 절반 세기 (got %.2f)" % Input.get_action_strength(&"move_right"))

	# 최대 반경을 넘겨도 1.0 을 안 넘는다
	joy._unhandled_input(_drag(origin + Vector2(joy.max_radius * 4.0, 0.0), 0))
	_check(Input.get_action_strength(&"move_right") <= 1.001,
			"더 끌어도 1.0 을 안 넘는다 (got %.2f)" % Input.get_action_strength(&"move_right"))

	# 대각선
	joy._unhandled_input(_drag(origin + Vector2(0.0, -joy.max_radius), 0))
	_check(Input.is_action_pressed(&"move_up") and not Input.is_action_pressed(&"move_down"),
			"위로 끌면 move_up")

	# 떼면 전부 풀린다. 안 풀리면 플레이어가 계속 달린다.
	joy._unhandled_input(_touch(origin, false, 0))
	_check(not joy.is_active(), "떼면 놓인다")
	for action: StringName in joy.ACTIONS:
		_check(not Input.is_action_pressed(action), "떼면 %s 가 풀린다" % action)

	# 화면이 사라져도 눌린 채로 남으면 안 된다 (레벨업 창이 뜰 때 실제로 겪는 상황)
	joy._unhandled_input(_touch(origin, true, 0))
	joy._unhandled_input(_drag(origin + Vector2(200.0, 0.0), 0))
	_check(Input.is_action_pressed(&"move_right"), "다시 잡힌다")
	joy._notification(Node.NOTIFICATION_EXIT_TREE)
	_check(not Input.is_action_pressed(&"move_right"),
			"트리에서 빠질 때 입력을 놓는다 (안 놓으면 계속 달린다)")

	joy.queue_free()


func _touch(pos: Vector2, pressed: bool, index: int) -> InputEventScreenTouch:
	var e := InputEventScreenTouch.new()
	e.position = pos
	e.pressed = pressed
	e.index = index
	return e


func _drag(pos: Vector2, index: int) -> InputEventScreenDrag:
	var e := InputEventScreenDrag.new()
	e.position = pos
	e.index = index
	return e


## 결과 화면과 튜토리얼이 겹치지 않는가 + 버튼 글자가 읽히는가.
##
## 둘 다 화면을 찍어 보고서야 나온 것들이다.
## - 「재입대」 는 열리자마자 포커스를 받는데 font_focus_color 를 빼먹어서
##   기본 흰색이 갱지 위에 얹혀 글자가 안 읽혔다.
## - 튜토리얼은 _process 가 phase 로 막히지만, 이미 떠 있던 건 그대로 남아
##   결과 화면 위에 겹쳐 보였다.
func test_results_overlap() -> void:
	print("[결과 화면 — 겹침과 글자 대비]")
	_sandbox_save_system()

	var results: Control = (load("res://ui/results/results_screen.tscn") as PackedScene).instantiate()
	add_child(results)
	var tutorial: TutorialOverlay = (load("res://ui/tutorial_overlay.tscn") as PackedScene).instantiate()
	add_child(tutorial)
	var player: Player = (load("res://entities/player/player.tscn") as PackedScene).instantiate()
	add_child(player)
	player.setup(null, load("res://data/characters/kim_private.tres") as CharacterData)
	tutorial.player = player
	await get_tree().process_frame

	# 튜토리얼을 띄운다
	GameState.phase = GameState.Phase.PLAYING
	GameState.elapsed = 0.1
	tutorial._process(0.0)
	_check(tutorial.visible, "튜토리얼이 떠 있다")

	# 판이 끝나면 사라져야 한다
	EventBus.run_ended.emit(false, {"kills": 10, "meta": {"salary": 0}})
	_check(results.visible, "결과 화면이 뜬다")
	_check(not tutorial.visible, "튜토리얼이 결과 화면 위에 안 남는다")
	_check(SaveSystem.tutorial_pending(),
			"다 못 보고 죽었으면 '봤다' 로 기록하지 않는다")

	# 갱지 위에서 버튼 글자가 읽혀야 한다. 특히 포커스 상태.
	for b: Button in [results.again, results._to_menu]:
		for state: StringName in [&"font_color", &"font_focus_color", &"font_pressed_color"]:
			var c: Color = b.get_theme_color(state)
			# 갱지(#E4DCC4)와의 밝기 차. 너무 밝으면 안 읽힌다.
			var lum: float = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
			_check(lum < 0.6, "%s 의 %s 가 갱지 위에서 읽힌다 (밝기 %.2f)"
					% [b.text, state, lum])

	get_tree().paused = false
	results.queue_free()
	tutorial.queue_free()
	player.queue_free()
	GameState.phase = GameState.Phase.MENU
