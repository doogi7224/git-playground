extends RefCounted
class_name SpatialHash
## 균일 격자 공간 해시. Godot 물리 엔진 대신 근접 질의를 담당한다. (CLAUDE.md 규칙 2)
##
## 매 프레임 counting sort로 통째로 다시 만든다. 삽입/삭제 관리보다 이게 더 빠르고
## 할당이 전혀 없다. 3,000개 기준 rebuild는 O(n) 두 패스 + 버킷 배열 fill 한 번.
##
## 사용법:
##     var hash := SpatialHash.new(64.0, 4096)
##     hash.rebuild(pos_x, pos_y, count)
##     var n := hash.query_circle(px, py, r, scratch)   # 후보 인덱스 개수
##     for k in n:
##         var i := scratch[k]
##         ... 실제 거리 검사는 호출자 몫 ...
##
## query_circle은 "이 셀들에 들어 있는 후보"만 돌려준다. 정확한 원 판정은 하지 않는다.

const BUCKET_COUNT: int = 8192          ## 2의 거듭제곱이어야 한다
const BUCKET_MASK: int = BUCKET_COUNT - 1

var cell_size: float = 64.0

var _inv_cell: float = 1.0 / 64.0
var _counts: PackedInt32Array = PackedInt32Array()  ## rebuild 후 [b] = 버킷 b 시작 인덱스
var _items: PackedInt32Array = PackedInt32Array()   ## 버킷 순으로 정렬된 원소 인덱스
var _cell_key: PackedInt64Array = PackedInt64Array()  ## 원소별 셀 좌표를 int 하나로 (해시 충돌 검증용)
var _cell_bucket: PackedInt32Array = PackedInt32Array()  ## 원소별 버킷 (배치 패스에서 재계산 안 하려고)
var _count: int = 0


func _init(p_cell_size: float = 64.0, p_capacity: int = 4096) -> void:
	cell_size = p_cell_size
	_inv_cell = 1.0 / p_cell_size
	_counts.resize(BUCKET_COUNT + 1)
	reserve(p_capacity)


func reserve(p_capacity: int) -> void:
	if _items.size() >= p_capacity:
		return
	_items.resize(p_capacity)
	_cell_key.resize(p_capacity)
	_cell_bucket.resize(p_capacity)


static func hash_cell(cx: int, cy: int) -> int:
	return ((cx * 73856093) ^ (cy * 19349663)) & BUCKET_MASK


## 셀 좌표를 int 하나로 접는다. GDScript int는 64비트라 충돌이 없다.
## 후보를 걸러낼 때 배열 두 번 읽고 두 번 비교하던 걸 한 번으로 줄인다.
static func pack_cell(cx: int, cy: int) -> int:
	return cx * 4294967296 + cy


func cell_coord(v: float) -> int:
	return int(floor(v * _inv_cell))


## pos_x/pos_y의 앞 count개를 격자에 다시 담는다.
func rebuild(pos_x: PackedFloat32Array, pos_y: PackedFloat32Array, count: int) -> void:
	_count = count
	reserve(count)
	_counts.fill(0)
	if count == 0:
		return

	# 1) 셀 좌표를 구하고 버킷별 개수를 센다.
	for i in count:
		var cx: int = int(floor(pos_x[i] * _inv_cell))
		var cy: int = int(floor(pos_y[i] * _inv_cell))
		var b: int = ((cx * 73856093) ^ (cy * 19349663)) & BUCKET_MASK
		_cell_key[i] = cx * 4294967296 + cy
		_cell_bucket[i] = b
		_counts[b] += 1

	# 2) 누적합 → _counts[b] = 버킷 b의 끝(exclusive). 마지막 칸에 전체 개수.
	var running: int = 0
	for b in BUCKET_COUNT:
		running += _counts[b]
		_counts[b] = running
	_counts[BUCKET_COUNT] = running

	# 3) 뒤에서부터 채우면 _counts[b]가 그대로 "시작 인덱스"로 바뀐다.
	#    버킷은 연속이므로 버킷 b의 끝 = _counts[b + 1]이 된다. 커서 배열이 필요 없다.
	for i in count:
		var b: int = _cell_bucket[i]
		_counts[b] -= 1
		_items[_counts[b]] = i


## (px, py) 반경 radius에 걸친 셀들의 후보 인덱스를 out에 채우고 개수를 돌려준다.
## out은 재사용 버퍼여야 한다(할당 금지). out 크기를 넘으면 거기서 끊는다.
func query_circle(px: float, py: float, radius: float, out: PackedInt32Array) -> int:
	if _count == 0:
		return 0
	var written: int = 0
	var cap: int = out.size()
	var min_cx: int = int(floor((px - radius) * _inv_cell))
	var max_cx: int = int(floor((px + radius) * _inv_cell))
	var min_cy: int = int(floor((py - radius) * _inv_cell))
	var max_cy: int = int(floor((py + radius) * _inv_cell))

	for cy in range(min_cy, max_cy + 1):
		for cx in range(min_cx, max_cx + 1):
			var b: int = hash_cell(cx, cy)
			var start: int = _counts[b]
			var end: int = _counts[b + 1]
			var key: int = cx * 4294967296 + cy
			for k in range(start, end):
				var idx: int = _items[k]
				# 다른 셀이 같은 버킷에 해시됐을 수 있다.
				if _cell_key[idx] != key:
					continue
				if written >= cap:
					return written
				out[written] = idx
				written += 1
	return written


func get_count() -> int:
	return _count


## --- 내부 배열 직통 접근 ---
## EnemyManager가 이웃 검사를 직접 인라인하기 위해 쓴다. GDScript에서는 적 1마리마다
## 메서드를 부르는 것 자체가 큰 비용이라, 3,000번의 query_circle() 호출을 없애려면
## 배열을 지역 변수로 받아가야 한다. 읽기만 하면 CoW 덕분에 복사도 일어나지 않는다.
## 절대 수정하지 말 것.
func get_counts() -> PackedInt32Array:
	return _counts


func get_items() -> PackedInt32Array:
	return _items


func get_cell_keys() -> PackedInt64Array:
	return _cell_key


func get_inv_cell() -> float:
	return _inv_cell
