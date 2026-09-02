extends Resource
class_name CommendationData
## 표창장 1장 = 도전과제. 조건을 채우면 자동으로 발급되고 월급이 따라온다.

@export var id: StringName = &""
@export var display_name: String = ""
@export_multiline var description: String = ""
## 발급 조건. null 이면 발급되지 않는다(자리표시자).
@export var condition: MetaCondition = null
## 발급 시 일시금. 0 이면 명예직.
@export var salary_reward: int = 0
