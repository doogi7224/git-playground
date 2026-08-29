// Presentation catalog for the stage-select screen. Adding a future stage is
// intentionally data-only: append one entry here and provide its level data
// to createLevel(stageId); the menu, next-stage button, and selection flow do
// not need new conditional UI.
export type StageId = number;

export interface StagePresentation {
  id: StageId;
  title: string;
  subtitle: string;
  detail: string;
  image: number;
  badge: string;
}

export const STAGE_CATALOG: StagePresentation[] = [
  {
    id: 1,
    title: '1. 태양씨앗의 길',
    subtitle: 'SUNSEED TRAIL',
    detail: '숲의 흐름을 익히고 Rootwarden을 물리치세요.',
    image: require('../assets/backgrounds/scene_forest_waterfall_v3.png'),
    badge: 'BEGINNER',
  },
  {
    id: 2,
    title: '2. 가라앉은 기어웍스',
    subtitle: 'SUNKEN GEARWORKS',
    detail: '훅과 벽점프로 어두운 기계 유적을 돌파하세요.',
    image: require('../assets/backgrounds/scene_mechanical_v3.png'),
    badge: 'CHALLENGE',
  },
];

export function nextStageId(stageId: StageId): StageId | null {
  const currentIndex = STAGE_CATALOG.findIndex((stage) => stage.id === stageId);
  return currentIndex >= 0 ? STAGE_CATALOG[currentIndex + 1]?.id ?? null : null;
}
