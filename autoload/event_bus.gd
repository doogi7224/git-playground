extends Node
## 전역 시그널 허브. UI·오디오·VFX는 게임 로직을 직접 참조하지 않고 여기만 구독한다.
##
## 규칙: 시그널은 값(위치·수치·id)만 넘긴다. 노드 참조를 넘기면 결합도가 다시 올라간다.
## 적은 개별 Node가 아니라 EnemyManager 배열의 인덱스이므로, 적 관련 시그널은
## 노드가 아니라 위치/타입 id로만 표현한다.

# --- 런(한 판) 흐름 ---
signal run_started(character_id: StringName)
signal run_ended(victory: bool, stats: Dictionary)
signal day_changed(days_left: int)          ## D-100 → D-DAY 카운트다운
signal game_paused(paused: bool)

# --- 플레이어 ---
signal player_damaged(amount: float, hp_ratio: float)
signal player_healed(amount: float, hp_ratio: float)
signal player_died()
signal player_leveled(level: int)
signal rank_changed(rank_id: StringName)    ## 이등병 → 일병 → 상병 → 병장 → 말년
signal xp_gained(amount: float, total: float, to_next: float)

# --- 적 ---
signal enemy_died(pos: Vector2, xp: float, enemy_type: StringName)
signal enemy_damaged(pos: Vector2, amount: float, is_crit: bool)
signal boss_spawned(boss_id: StringName)
signal boss_hp_changed(ratio: float)
signal boss_died(boss_id: StringName)
signal chest_dropped(pos: Vector2)
signal wave_changed(minute: int)

# --- 업그레이드 / 명령서 ---
signal level_up_offered(upgrade_ids: Array[StringName])
signal upgrade_picked(upgrade_id: StringName)
signal weapon_evolved(from_id: StringName, to_id: StringName)

# --- 연출 훅 (VFX/오디오 전용) ---
signal hit_stop_requested(duration: float, time_scale: float)
signal screen_shake_requested(strength: float, duration: float)
signal damage_number_requested(pos: Vector2, amount: float, is_crit: bool)

# --- 메타 진행 ---
signal salary_earned(amount: int)
signal commendation_unlocked(id: StringName)   ## 표창장 = 도전과제
