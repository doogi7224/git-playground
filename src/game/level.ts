import {
  BIOCOIL_HEIGHT,
  BIOCOIL_WIDTH,
  COIN_SIZE,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
  FLAG_HEIGHT,
  FLAG_WIDTH,
  PISTON_HEIGHT,
  PISTON_WIDTH,
  SHIFT_NODE_SIZE,
  SPORE_SPRITE_HEIGHT,
  SPORE_SPRITE_WIDTH,
  VIEWPORT_HEIGHT,
} from './constants';
import { BioCoil, Coin, Enemy, Level, Platform, PressurePiston, ShiftNode, SporeSprite } from './types';

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

// Only exist once the world is shifted into the "wild" bloom state — bonus
// platforms that demonstrate the Bloom Shift mechanic. Three zones are
// spread across the level: an early tutorial zone, the original mid-level
// zone, and a late zone just before the flag.
const bloomPlatforms: Platform[] = [
  { id: 'bloom-early', x: 470, y: GROUND_Y - 150, width: 80, height: 16, visibleIn: 'wild' },
  { id: 'bloom1', x: 1910, y: GROUND_Y - 150, width: 80, height: 16, visibleIn: 'wild' },
  { id: 'bloom-late', x: 2650, y: GROUND_Y - 140, width: 80, height: 16, visibleIn: 'wild' },
];

function makeShiftNodes(): ShiftNode[] {
  return [
    { id: 'shift-early', x: 220, y: GROUND_Y - SHIFT_NODE_SIZE, width: SHIFT_NODE_SIZE, height: SHIFT_NODE_SIZE },
    { id: 'shift1', x: 1700, y: GROUND_Y - SHIFT_NODE_SIZE, width: SHIFT_NODE_SIZE, height: SHIFT_NODE_SIZE },
    { id: 'shift-late', x: 2450, y: GROUND_Y - SHIFT_NODE_SIZE, width: SHIFT_NODE_SIZE, height: SHIFT_NODE_SIZE },
  ];
}

function makeSporeSprites(): SporeSprite[] {
  const defs: [string, number, number, number][] = [
    ['spore1', 1150, GROUND_Y - 160, 0],
    ['spore2', 2050, GROUND_Y - 150, Math.PI],
  ];
  return defs.map(([id, x, baseY, phase]) => ({
    id,
    x,
    y: baseY,
    width: SPORE_SPRITE_WIDTH,
    height: SPORE_SPRITE_HEIGHT,
    baseY,
    phase,
  }));
}

function makePressurePistons(): PressurePiston[] {
  const defs: [string, number][] = [['piston1', 650]];
  return defs.map(([id, x]) => ({
    id,
    x,
    y: GROUND_Y - PISTON_HEIGHT,
    width: PISTON_WIDTH,
    height: PISTON_HEIGHT,
    phase: 0,
  }));
}

function makeBioCoils(): BioCoil[] {
  const defs: [string, number][] = [['coil1', 3060]];
  return defs.map(([id, x]) => ({
    id,
    x,
    y: GROUND_Y - BIOCOIL_HEIGHT,
    width: BIOCOIL_WIDTH,
    height: BIOCOIL_HEIGHT,
    homeX: x,
    groundY: GROUND_Y - BIOCOIL_HEIGHT,
    phase: 'coiled',
    timer: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    alive: true,
  }));
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
    [490, GROUND_Y - 180],
    [520, GROUND_Y - 180],
    [2670, GROUND_Y - 170],
    [2700, GROUND_Y - 170],
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
    sporeSprites: makeSporeSprites(),
    pressurePistons: makePressurePistons(),
    bioCoils: makeBioCoils(),
  };
}
