extends Node
## 적 시뮬레이션 비용을 적 수별로 측정한다. 렌더링은 빼고 CPU(=GDScript) 쪽만 본다.
## 이 컨테이너는 소프트웨어 렌더러(llvmpipe)라 GPU 프레임타임은 의미가 없다.
## GPU 쪽은 실제 머신에서 tests/stress_test.tscn + F3 오버레이로 확인할 것.
##
##   tools/bench.sh

const STEP: float = 1.0 / 60.0
const WARMUP: int = 20
const SAMPLES: int = 120
const COUNTS: Array[int] = [500, 1000, 2000, 3000, 4000]
const CAPACITY: int = 8192


func _ready() -> void:
	_run.call_deferred()


func _run() -> void:
	print("=== 적 시뮬레이션 벤치마크 (물리 1틱당 ms) ===")
	print("%6s | %8s | %8s | %8s | %8s | %9s" % ["적", "해시재구성", "이동+분리", "버퍼갱신", "합계", "60fps예산"])
	print("-------|----------|----------|----------|----------|----------")

	for n: int in COUNTS:
		var em := EnemyManager.new()
		get_tree().root.add_child(em)
		em.set_capacity(CAPACITY)
		em.register_type(&"bench", 130.0, 20.0, 13.0, 5.0, 1.0, Color("#8A7B5E"))
		_fill(em, n)
		GameState.phase = GameState.Phase.PLAYING

		for _i in WARMUP:
			em._physics_process(STEP)
			em._update_buffer()

		var t0: int = Time.get_ticks_usec()
		for _i in SAMPLES:
			em._physics_process(STEP)
		var t_sim: float = float(Time.get_ticks_usec() - t0) / float(SAMPLES) / 1000.0

		t0 = Time.get_ticks_usec()
		for _i in SAMPLES:
			em.hash_grid.rebuild(em._px, em._py, em.get_count())
		var t_hash: float = float(Time.get_ticks_usec() - t0) / float(SAMPLES) / 1000.0

		t0 = Time.get_ticks_usec()
		for _i in SAMPLES:
			em._update_buffer()
		var t_buf: float = float(Time.get_ticks_usec() - t0) / float(SAMPLES) / 1000.0

		var t_move: float = maxf(0.0, t_sim - t_hash)
		var total: float = t_sim + t_buf
		print("%6d | %8.2f | %8.2f | %8.2f | %8.2f | %8.0f%%" % [n, t_hash, t_move, t_buf, total, 100.0 * total / 16.67])

		em.queue_free()
		await get_tree().process_frame

	print("(60fps 예산 = 16.67ms. 여유는 적 시뮬레이션이 그중 몇 %를 먹는지)")
	get_tree().quit(0)


func _fill(em: EnemyManager, n: int) -> void:
	# 플레이어 주변 반경 900 원판에 고르게 뿌린다 — 실제 전투와 비슷한 밀도
	em.target_position = Vector2.ZERO
	for i in n:
		var a: float = randf() * TAU
		var r: float = sqrt(randf()) * 900.0
		em.spawn(0, Vector2(cos(a), sin(a)) * r)
