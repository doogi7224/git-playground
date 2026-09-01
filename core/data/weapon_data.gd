extends Resource
class_name WeaponData
## 무기 1종의 정의. 동작 방식은 behavior로 고르고 수치는 전부 여기 있다.
## 새 무기를 추가한다 = 이 .tres를 하나 더 만든다. GDScript는 건드리지 않는다.

## 무기가 실제로 어떻게 때리는가. 같은 behavior면 스크립트를 공유한다.
enum Behavior {
	MELEE_ARC,     ## 부채꼴 베기 (야전삽, 예초기)
	PROJECTILE,    ## 최근접 적에게 발사 (K-2식 소총)
	AURA,          ## 주변 상시 판정 (예초기 진화형, 방탄모)
	GROUND_AREA,   ## 장판 (수통, 행군화)
	THROWN,        ## 포물선 투척 (연막탄)
	UTILITY,       ## 직접 피해가 아닌 것 (위생병, 기상나팔)
}

@export var id: StringName = &""
@export var display_name: String = ""
@export_multiline var description: String = ""
@export var behavior: Behavior = Behavior.MELEE_ARC

@export_group("기본 수치")
@export var cooldown: float = 0.8
@export var damage: float = 10.0
@export var reach: float = 150.0
@export var half_angle_deg: float = 70.0
@export var projectiles: int = 1
@export var knockback: float = 0.0

@export_group("MELEE_ARC")
## 한 번은 앞, 한 번은 뒤로 휘두른다. 플레이어가 적보다 빠르면 적이 전부 등 뒤로
## 몰리기 때문에, 전방 전용으로 두면 거의 안 맞는다. (docs/performance.md 옆 M0 기록 참조)
@export var alternate_direction: bool = true

@export_group("레벨당 증가")
@export var per_level_damage: float = 0.0
@export var per_level_cooldown: float = 0.0   ## 음수면 빨라진다
@export var per_level_reach: float = 0.0
@export var per_level_projectiles: float = 0.0
@export var max_level: int = 8

@export_group("진화")
## 기획서 5.1: 무기 Lv8 + 지정 패시브 보유 시 진화
@export var evolves_into: StringName = &""
@export var evolution_passive: StringName = &""


func damage_at(level: int) -> float:
	return damage + per_level_damage * float(level - 1)


func cooldown_at(level: int) -> float:
	return maxf(0.05, cooldown + per_level_cooldown * float(level - 1))


func reach_at(level: int) -> float:
	return reach + per_level_reach * float(level - 1)


func projectiles_at(level: int) -> int:
	return maxi(1, projectiles + int(per_level_projectiles * float(level - 1)))
