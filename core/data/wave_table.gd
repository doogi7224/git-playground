extends Resource
class_name WaveTable
## 한 판 전체의 웨이브 테이블. 분 단위 구간의 배열.
##
## 기획서 5.4 밀도 곡선: 0~5분 완만 → 5분 보스 → 6~10분 급증 → 15분 이후 화면 절반이 적.
## 20분 직전 1분은 의도적 소강(긴장 완화 후 최종전).

@export var waves: Array[WaveData] = []


## 경과 시간에 해당하는 구간. 테이블에 없는 분은 마지막 정의 구간을 이어 쓴다.
func wave_for_minute(minute: int) -> WaveData:
	var best: WaveData = null
	for w: WaveData in waves:
		if w.minute <= minute and (best == null or w.minute > best.minute):
			best = w
	return best
