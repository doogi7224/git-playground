extends Node
## 런타임 instantiate() 금지. 투사체·파티클·픽업은 전부 여기서 빌려 쓰고 반납한다.
## (적은 풀링 대상이 아니다 — EnemyManager가 배열로 직접 관리한다.)
##
## TODO(M1): 씬별 prewarm 개수를 .tres 설정으로 뺀다

var _pools: Dictionary = {}   ## StringName -> Array[Node]
var _scenes: Dictionary = {}  ## StringName -> PackedScene


## 게임 시작 시 필요한 수만큼 미리 만들어 둔다. 런 중에는 절대 새로 만들지 않는다.
func register(pool_id: StringName, scene: PackedScene, prewarm: int) -> void:
	_scenes[pool_id] = scene
	var bucket: Array = []
	for _i: int in prewarm:
		var node: Node = scene.instantiate()
		node.process_mode = Node.PROCESS_MODE_DISABLED
		add_child(node)
		bucket.append(node)
	_pools[pool_id] = bucket


func acquire(pool_id: StringName) -> Node:
	var bucket: Array = _pools.get(pool_id, [])
	if bucket.is_empty():
		push_warning("ObjectPool: '%s' 고갈. prewarm 개수를 늘려라." % pool_id)
		return null
	var node: Node = bucket.pop_back()
	node.process_mode = Node.PROCESS_MODE_INHERIT
	return node


func release(pool_id: StringName, node: Node) -> void:
	if node == null:
		return
	node.process_mode = Node.PROCESS_MODE_DISABLED
	if node.get_parent() != self:
		node.reparent(self)
	var bucket: Array = _pools.get(pool_id, [])
	bucket.append(node)
	_pools[pool_id] = bucket
