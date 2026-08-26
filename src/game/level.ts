import { COIN_SIZE, ENEMY_HEIGHT, ENEMY_WIDTH, FLAG_HEIGHT, FLAG_WIDTH, SHIFT_NODE_SIZE, VIEWPORT_HEIGHT } from './constants';
import { Coin, Enemy, Level, Platform, ShiftNode } from './types';

const GROUND_Y = VIEWPORT_HEIGHT - 40;
const GROUND_HEIGHT = 200; // extends below the visible viewport so pits look bottomless

// Ground is built from segments with gaps (pits) in between to force jumping.
const groundSegments: [number, number][] = [
  [0, 700],
  [860, 1400],
  [1520, 2200],
  [2340, 3200],
];

function makeGroundPlatforms(): Platform[] {
  return groundSegments.map(([x1, x2], i) => ({
    id: `ground-${i}`,
    x: x1,
    y: GROUND_Y,
    width: x2 - x1,
    height: GROUND_HEIGHT,
  }));
}

const floatingPlatforms: Platform[] = [
  { id: 'p1', x: 300, y: GROUND_Y - 90, width: 120, height: 20 },
  { id: 'p2', x: 740, y: GROUND_Y - 60, width: 100, height: 20 },
  { id: 'p3', x: 980, y: GROUND_Y - 110, width: 110, height: 20 },
  { id: 'p4', x: 1250, y: GROUND_Y - 70, width: 100, height: 20 },
  { id: 'p5', x: 1440, y: GROUND_Y - 60, width: 90, height: 20 },
  { id: 'p6', x: 1650, y: GROUND_Y - 120, width: 110, height: 20 },
  { id: 'p7', x: 1900, y: GROUND_Y - 70, width: 100, height: 20 },
  { id: 'p8', x: 2260, y: GROUND_Y - 60, width: 90, height: 20 },
  { id: 'p9', x: 2500, y: GROUND_Y - 110, width: 120, height: 20 },
  { id: 'p10', x: 2800, y: GROUND_Y - 70, width: 110, height: 20 },
];

// Only exists once the world is shifted into the "wild" bloom state — a
// small bonus reachable from p7 that demonstrates the Bloom Shift mechanic.
const bloomPlatforms: Platform[] = [
  { id: 'bloom1', x: 1910, y: GROUND_Y - 150, width: 80, height: 16, visibleIn: 'wild' },
];

function makeShiftNodes(): ShiftNode[] {
  return [{ id: 'shift1', x: 1700, y: GROUND_Y - SHIFT_NODE_SIZE, width: SHIFT_NODE_SIZE, height: SHIFT_NODE_SIZE }];
}

function makeEnemies(): Enemy[] {
  const defs: [string, number, number, number][] = [
    ['e1', 400, 620, GROUND_Y],
    ['e2', 900, 1350, GROUND_Y],
    ['e3', 1560, 2000, GROUND_Y],
    ['e4', 2400, 2700, GROUND_Y],
    ['e5', 2900, 3150, GROUND_Y],
  ];
  return defs.map(([id, minX, maxX, groundY]) => ({
    id,
    x: minX,
    y: groundY - ENEMY_HEIGHT,
    width: ENEMY_WIDTH,
    height: ENEMY_HEIGHT,
    vx: 60,
    minX,
    maxX,
    alive: true,
  }));
}

function makeCoins(): Coin[] {
  const coinDefs: [number, number][] = [
    [340, GROUND_Y - 130],
    [400, GROUND_Y - 130],
    [780, GROUND_Y - 100],
    [1010, GROUND_Y - 150],
    [1280, GROUND_Y - 110],
    [1470, GROUND_Y - 100],
    [1690, GROUND_Y - 160],
    [1720, GROUND_Y - 160],
    [1930, GROUND_Y - 110],
    [2290, GROUND_Y - 100],
    [2540, GROUND_Y - 150],
    [2570, GROUND_Y - 150],
    [2830, GROUND_Y - 110],
    [3000, GROUND_Y - 60],
    [1930, GROUND_Y - 180],
    [1965, GROUND_Y - 180],
  ];
  return coinDefs.map(([x, y], i) => ({
    id: `coin-${i}`,
    x,
    y,
    width: COIN_SIZE,
    height: COIN_SIZE,
    collected: false,
  }));
}

export function createLevel(): Level {
  return {
    worldWidth: 3300,
    groundY: GROUND_Y,
    spawn: { x: 40, y: GROUND_Y - 100 },
    platforms: [...makeGroundPlatforms(), ...floatingPlatforms, ...bloomPlatforms],
    enemies: makeEnemies(),
    coins: makeCoins(),
    flag: { x: 3220, y: GROUND_Y - FLAG_HEIGHT, width: FLAG_WIDTH, height: FLAG_HEIGHT },
    shiftNodes: makeShiftNodes(),
  };
}
