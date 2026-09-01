extends Node
## 헤드리스 자체 검증. 실행:
##     tools/test.sh                       (또는)
##     godot --headless --path . res://tests/test_runner.tscn
## 실패가 하나라도 있으면 종료 코드 1.
##
## --script 가 아니라 씬으로 도는 이유: --script 로 SceneTree를 갈아끼우면
## 오토로드(EventBus/GameState)가 등록되지 않아 게임 코드가 컴파일조차 안 된다.

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
	test_spatial_hash()
	test_multimesh_buffer_layout()
	test_game_state()
	test_enemy_manager()
	test_weapon_shovel()
	test_data_resources()
	await test_arena_smoke()
	print("--- %d개 검사 중 %d개 실패, %d개 건너뜀 ---" % [_checks, _failures, _skipped])
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
	_check(enemies.get_count() > 20, "적이 쌓인다 (%d마리)" % enemies.get_count())
	_check(enemies.get_count() <= enemies.get_capacity(), "용량을 넘지 않는다")
	_check(kills >= 20, "자동공격이 실제로 적을 잡는다 (%d마리)" % kills)
	_check(saw_pickup, "'짬'이 드랍된다")
	_check(saw_level_up, "레벨업 명령서가 뜬다")
	_check(player.level >= 2, "진급한다 (Lv.%d)" % player.level)
	_check(player.speed_mult > 1.0 or player.damage_mult > 1.0 or player.max_hp > 100.0
			or player.magnet_mult > 1.0, "고른 업그레이드가 실제로 반영된다")
	_check(player.hp < player.max_hp, "접촉 피해를 받는다 (HP %.0f/%.0f)" % [player.hp, player.max_hp])

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

	var shovel: WeaponData = load("res://data/weapons/shovel.tres") as WeaponData
	_check(shovel != null, "shovel.tres 로드")
	if shovel != null:
		_check(shovel.behavior == WeaponData.Behavior.MELEE_ARC, "야전삽은 부채꼴 근접")
		_check(shovel.alternate_direction, "야전삽은 앞뒤로 번갈아 휘두른다")
		_check(shovel.cooldown_at(1) > shovel.cooldown_at(5), "레벨이 오르면 빨라진다")
		_check(shovel.damage_at(5) > shovel.damage_at(1), "레벨이 오르면 세진다")
		_check(shovel.evolves_into != &"", "진화 대상이 지정돼 있다")
