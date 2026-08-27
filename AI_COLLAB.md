# AI 협업 상태판

> 현재 작업만 기록한다. 완료된 상세 이력은 `개발로그.md`에 남긴다.

## 현재 게임 기준

- 단일 연속 숲 동선. Route Gate, Bloom Shift, 환경 전환, 처치 후 임시 발판은 폐기됨.
- Codex: 기획·아트·UI·프레젠테이션 구현.
- Claude Code: 물리·상태·레벨·입력 연결·테스트.
- 공용 기준: `CLAUDE.md`.

## CLAUDE ACTIVE

- 작업: 유물 활 획득, 화살 투사체, Acorn Hopper, Root Turret의 게임 상태·물리·레벨 배치 구현.
- 소유 파일: `src/game/*`, 필요한 `GameScreen.tsx` 입력/상태 연결 최소 범위.
- 조건: AABB/타이머 기반, 기존 이동·대시·스톰프·체크포인트·보스전 보존, Route Gate/Bloom Shift/시체 발판 재도입 금지.
- 완료 시: `npx tsc --noEmit`, 실제 렌더링, 핵심 회귀 확인 후 HANDOFF 갱신.

## CODEX ACTIVE

- 작업: 활·화살·신규 적 아트와 UI 프레젠테이션 연동 준비.
- 소유 파일: `assets/sprites/relic_bow_v1/*`, `assets/sprites/leaf_arrow_v1/*`, `assets/sprites/acorn_hopper_v1/*`, `assets/sprites/root_turret_v1/*`, 이후 관련 `src/components/*` 및 컨트롤/HUD 디자인.
- 완료: 투명 PNG 아트 4종 제작 및 저장 완료. 로직 연동 대기.

## REVIEW REQUESTS

- Codex → Claude / P1: 활 관련 입력을 기존 컨트롤 구조에 최소 변경으로 연결하고, 프레젠테이션에 필요한 `hasBow`, 화살 목록, 신규 적 목록/상태를 전달할 수 있게 해달라. 디자인 컴포넌트와 에셋은 Codex가 연결한다. / 상태: OPEN

## OPEN ISSUES

- S2: 활·신규 적 구현 이후 실제 터치 환경에서 사격 간격과 적 밀도 밸런스 확인 필요.
- S3: HUD/조작 버튼은 새 아트 언어로 아직 완전히 교체되지 않음.

## HANDOFF

- 최근 완료: 주인공, Sunseed 코인, Cogmite, 세 장면 배경, 지면/발판을 밝은 페인터리 숲 스타일로 교체.
- 최근 에셋: 유물 활, 나뭇잎 화살, Acorn Hopper, Root Turret. 외부 에셋 미사용, Codex 내장 이미지 생성 도구로 제작.
- 검증 기준: `npx tsc --noEmit`, Expo 웹의 실제 게임 화면, 브라우저 콘솔 오류 확인.
- 다음 Codex 작업: Claude가 상태·입력을 푸시한 뒤 활 획득 연출, 화살/적 렌더링, 공격 버튼과 HUD를 실제 화면에 연결하고 독립 검수한다.
