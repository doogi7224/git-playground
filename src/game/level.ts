import {
  BIOCOIL_HEIGHT,
  BIOCOIL_WIDTH,
  BOSS_HEIGHT,
  BOSS_HP,
  BOSS_WIDTH,
  BOW_PICKUP_SIZE,
  CHESTNUT_ROLLER_HEIGHT,
  CHESTNUT_ROLLER_PATROL_SPEED,
  CHESTNUT_ROLLER_WIDTH,
  COG_PICKUP_SIZE,
  COIN_SIZE,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
  FLAG_HEIGHT,
  FLAG_WIDTH,
  JUMPER_HEIGHT,
  JUMPER_WIDTH,
  PISTON_HEIGHT,
  PISTON_WIDTH,
  PORTAL_HEIGHT,
  PORTAL_WIDTH,
  ROOTHOOK_SIZE,
  SPORE_SPRITE_HEIGHT,
  SPORE_SPRITE_WIDTH,
  STEAMBLOWER_HEIGHT,
  STEAMBLOWER_HP,
  STEAMBLOWER_WIDTH,
  TREASURE_CACHE_HEIGHT,
  TREASURE_CACHE_WIDTH,
  TURRET_HEIGHT,
  TURRET_WIDTH,
  VIEWPORT_HEIGHT,
} from './constants';
import {
  BioCoil,
  BowPickup,
  Boss,
  ChestnutRoller,
  CogPickup,
  CogType,
  Coin,
  Enemy,
  Jumper,
  Level,
  Platform,
  Portal,
  PressurePiston,
  RootPoint,
  SporeSprite,
  SteamBlower,
  TreasureCache,
  TreasureCacheKind,
  TreasureReward,
  Turret,
} from './types';

const GROUND_Y = VIEWPORT_HEIGHT - 40;
const GROUND_HEIGHT = 200; // extends below the visible viewport so pits look bottomless

// Ground is built from segments with gaps (pits) in between to force jumping.
const groundSegments: [number, number][] = [
  [0, 700],
  [860, 1400],
  [1520, 2200],
  [2340, 3200],
  [3350, 3900],
  [4030, 4600],
  // Area 3, extending the level further past the original area-2 flag.
  [4750, 5300],
  [5450, 6150],
  [6220, 6800],
  // Boss arena: one flat, pit-free room reached through the portal at the end
  // of area 3. No jump challenges here — the boss itself is the obstacle.
  [6800, 7700],
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
  // Area 2, beyond the original flag position.
  { id: 'p11', x: 3220, y: GROUND_Y - 70, width: 100, height: 20 }, // bridges the pit into area 2
  { id: 'p12', x: 3450, y: GROUND_Y - 110, width: 100, height: 20 },
  { id: 'p13', x: 3700, y: GROUND_Y - 70, width: 90, height: 20 },
  { id: 'p14', x: 3920, y: GROUND_Y - 60, width: 90, height: 20 }, // bridges the pit before ground-5
  { id: 'p15', x: 4100, y: GROUND_Y - 100, width: 110, height: 20 },
  { id: 'p16', x: 4540, y: GROUND_Y - 60, width: 60, height: 20 },
  // Area 3.
  { id: 'p17', x: 4680, y: GROUND_Y - 70, width: 90, height: 20 }, // bridges the pit into area 3
  { id: 'p18', x: 4900, y: GROUND_Y - 60, width: 100, height: 20 },
  { id: 'p19', x: 5150, y: GROUND_Y - 110, width: 90, height: 20 },
  { id: 'p20', x: 5380, y: GROUND_Y - 70, width: 90, height: 20 }, // bridges the next pit
  { id: 'p21', x: 5600, y: GROUND_Y - 60, width: 110, height: 20 },
  { id: 'p22', x: 5850, y: GROUND_Y - 90, width: 100, height: 20 },
  { id: 'p23', x: 6140, y: GROUND_Y - 70, width: 90, height: 20 }, // bridges the final pit, alongside root3
  { id: 'p24', x: 6740, y: GROUND_Y - 60, width: 60, height: 20 },
];

// A few high routes remain as permanent optional shortcuts. They reward a
// clean jump without asking the player to learn a second world-state rule.
const bonusPlatforms: Platform[] = [
  { id: 'bonus-early', x: 470, y: GROUND_Y - 150, width: 80, height: 16 },
  { id: 'bonus-mid', x: 1910, y: GROUND_Y - 150, width: 80, height: 16 },
  { id: 'bonus-late', x: 2650, y: GROUND_Y - 140, width: 80, height: 16 },
  { id: 'bonus-final', x: 4450, y: GROUND_Y - 140, width: 80, height: 16 },
  { id: 'bonus-deep', x: 5700, y: GROUND_Y - 150, width: 80, height: 16 },
];

function makeSporeSprites(): SporeSprite[] {
  const defs: [string, number, number, number][] = [
    ['spore1', 1150, GROUND_Y - 160, 0],
    ['spore2', 2050, GROUND_Y - 150, Math.PI],
    ['spore3', 3960, GROUND_Y - 140, Math.PI / 2],
    ['spore4', 5500, GROUND_Y - 150, Math.PI / 3],
  ];
  return defs.map(([id, x, baseY, phase]) => ({
    id,
    x,
    y: baseY,
    width: SPORE_SPRITE_WIDTH,
    height: SPORE_SPRITE_HEIGHT,
    baseY,
    phase,
    alive: true,
  }));
}

function makePressurePistons(): PressurePiston[] {
  const defs: [string, number][] = [
    ['piston1', 650],
    ['piston2', 4300],
    ['piston3', 5950],
  ];
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

function makeSteamBlowers(): SteamBlower[] {
  const defs: [string, number][] = [['blower1', 2980]];
  return defs.map(([id, x]) => ({
    id,
    x,
    y: GROUND_Y - STEAMBLOWER_HEIGHT,
    width: STEAMBLOWER_WIDTH,
    height: STEAMBLOWER_HEIGHT,
    steamTimer: 0,
    sporeTimer: 0,
    hp: STEAMBLOWER_HP,
    alive: true,
  }));
}

function makeRootPoints(): RootPoint[] {
  const defs: [string, number, number][] = [
    ['root1', 780, GROUND_Y - 150], // over the first pit, an alternate to the p1/p2 jump route
    ['root2', 3275, GROUND_Y - 160], // over the pit into area 2, alongside the p11 bridge
    ['root3', 6110, GROUND_Y - 160], // over the final pit in area 3, alongside the p23 bridge
  ];
  return defs.map(([id, x, y]) => ({ id, x, y, width: ROOTHOOK_SIZE, height: ROOTHOOK_SIZE }));
}

function makeCogPickups(): CogPickup[] {
  const defs: [string, CogType, number, number][] = [
    ['cog-spring', 'spring', 350, GROUND_Y - 160],
    ['cog-roothook', 'rootHookCog', 830, GROUND_Y - 190],
    ['cog-magnet', 'magnet', 1300, GROUND_Y - 150],
    ['cog-steamboost', 'steamBoost', 3550, GROUND_Y - 180],
    ['cog-mirror', 'mirror', 4150, GROUND_Y - 160],
  ];
  return defs.map(([id, cogType, x, y]) => ({
    id,
    cogType,
    x,
    y,
    width: COG_PICKUP_SIZE,
    height: COG_PICKUP_SIZE,
    collected: false,
  }));
}

// Relic Bow: one permanent pickup early in Area 1, clear of every existing
// hazard/platform in this stretch (p1 starts at x=300, cog-spring/e1 start
// at x=350/400) so grabbing it is never contested by anything else. Placed
// on the ground so it's easy to walk into.
function makeBowPickup(): BowPickup {
  return { id: 'bow1', x: 250, y: GROUND_Y - BOW_PICKUP_SIZE, width: BOW_PICKUP_SIZE, height: BOW_PICKUP_SIZE, collected: false };
}

// Jumpers sit on existing wide floating platforms rather than the ground —
// every current ground-level Cogmite patrols at GROUND_Y, so any floating
// platform is guaranteed free of hazard overlap without needing to re-check
// the (already densely packed) ground lanes. Centered on the platform with
// its own groundY set to that platform's top, so its straight-up hop can
// never carry it off the edge.
function makeJumpers(): Jumper[] {
  const defs: [string, number, number][] = [
    ['jumper1', 1650 + 41, 60], // centered on p6 (x=1650, width110)
    ['jumper2', 4100 + 41, 80], // centered on p15 (x=4100, width110)
  ];
  return defs.map(([id, x, groundY]) => ({
    id,
    x,
    y: groundY - JUMPER_HEIGHT,
    width: JUMPER_WIDTH,
    height: JUMPER_HEIGHT,
    homeX: x,
    groundY: groundY - JUMPER_HEIGHT,
    phase: 'grounded',
    timer: 0,
    vy: 0,
    alive: true,
  }));
}

// Turrets, same reasoning as Jumpers -- placed on existing wide floating
// platforms, clear of ground-level patrol/hazard lanes.
function makeTurrets(): Turret[] {
  const defs: [string, number, number][] = [
    ['turret1', 2500 + 45, 70], // centered on p9 (x=2500, width120)
    ['turret2', 5850 + 35, 90], // on p22 (x=5850, width100), offset from center to keep clear of piston3 at x=5950
  ];
  return defs.map(([id, x, groundY]) => ({
    id,
    x,
    y: groundY - TURRET_HEIGHT,
    width: TURRET_WIDTH,
    height: TURRET_HEIGHT,
    timer: 0,
    alive: true,
  }));
}

// Chestnut Roller: two wide ground patrol zones, chosen by scanning every
// other ground-level entity's occupied x-range (existing enemies, pistons,
// Bio-Coil, Steam Blower, the spawn/bow/cog-spring cluster) and picking the
// two widest gaps left over (a computed check, not eyeballed -- see
// 개발로그.md for the exact free-gap list). No new pits, platforms, or
// level segments were added.
function makeChestnutRollers(): ChestnutRoller[] {
  const defs: [string, number, number][] = [
    ['roller1', 2720, 2880], // gap between e4 (ends 2700) and e5 (starts 2900)
    ['roller2', 6260, 6760], // fully open ground stretch before the boss portal
  ];
  return defs.map(([id, minX, maxX]) => ({
    id,
    x: minX,
    y: GROUND_Y - CHESTNUT_ROLLER_HEIGHT,
    width: CHESTNUT_ROLLER_WIDTH,
    height: CHESTNUT_ROLLER_HEIGHT,
    minX,
    maxX,
    vx: CHESTNUT_ROLLER_PATROL_SPEED,
    facing: 1,
    phase: 'walk',
    timer: 0,
    cooldown: 0,
    alive: true,
  }));
}

// Treasure Cache: the 5 existing "bonus" platforms (see `bonusPlatforms`
// above) are already the level's optional, backtrack-worthy high routes --
// per (35)'s coin-placement notes they're skill rewards that never block the
// required path, exactly what the design brief asks for. Reusing them means
// no new coordinates to verify for overlap. 3 Root Cache (dash-only) then 2
// Relic Pod (arrow-only, both well after the Relic Bow pickup at x=250).
function makeTreasureCaches(): TreasureCache[] {
  const defs: [string, TreasureCacheKind, TreasureReward][] = [
    ['cache-root1', 'rootCache', 'sunseedBurst'],
    ['cache-root2', 'rootCache', 'flowSpark'],
    ['cache-root3', 'rootCache', 'sunseedBurst'],
    ['cache-pod1', 'relicPod', 'lifeBloom'],
    ['cache-pod2', 'relicPod', 'sunseedBurst'],
  ];
  return defs.map(([id, kind, reward], i) => {
    const platform = bonusPlatforms[i];
    return {
      id,
      kind,
      reward,
      x: platform.x + (platform.width - TREASURE_CACHE_WIDTH) / 2,
      y: platform.y - TREASURE_CACHE_HEIGHT,
      width: TREASURE_CACHE_WIDTH,
      height: TREASURE_CACHE_HEIGHT,
      opened: false,
    };
  });
}

function makeEnemies(): Enemy[] {
  const defs: [string, number, number, number][] = [
    ['e1', 400, 620, GROUND_Y],
    ['e2', 900, 1350, GROUND_Y],
    ['e3', 1560, 2000, GROUND_Y],
    ['e4', 2400, 2700, GROUND_Y],
    ['e5', 2900, 3150, GROUND_Y],
    ['e6', 3400, 3850, GROUND_Y],
    ['e7', 4060, 4550, GROUND_Y],
    ['e8', 4800, 5250, GROUND_Y],
    ['e9', 5500, 6050, GROUND_Y],
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
    chargeDir: 0,
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
    [3250, GROUND_Y - 100],
    [3480, GROUND_Y - 140],
    [3510, GROUND_Y - 140],
    [3730, GROUND_Y - 100],
    [4130, GROUND_Y - 130],
    [4160, GROUND_Y - 130],
    [4470, GROUND_Y - 170],
    [4500, GROUND_Y - 170],
    [4550, GROUND_Y - 90],
    // Area 3.
    [4700, GROUND_Y - 100],
    [4730, GROUND_Y - 100],
    [4920, GROUND_Y - 90],
    [4950, GROUND_Y - 90],
    [5170, GROUND_Y - 140],
    [5400, GROUND_Y - 100],
    [5620, GROUND_Y - 90],
    [5650, GROUND_Y - 90],
    [5870, GROUND_Y - 150],
    [6200, GROUND_Y - 100],
    [6760, GROUND_Y - 90],
    // Route Gate foundation: reachable only while the matching gate is
    // active, since nothing else at these heights is solid over the gap.
    [100, GROUND_Y - 65],
    [145, GROUND_Y - 80],
    [187, GROUND_Y - 65],
    [150, GROUND_Y - 105],
    [170, GROUND_Y - 130],
    [195, GROUND_Y - 145],
    [205, GROUND_Y - 135],
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

function makePortal(): Portal {
  return { id: 'portal1', x: 6830, y: GROUND_Y - PORTAL_HEIGHT, width: PORTAL_WIDTH, height: PORTAL_HEIGHT };
}

function makeBoss(): Boss {
  return {
    id: 'boss1',
    x: 7300,
    y: GROUND_Y - BOSS_HEIGHT,
    width: BOSS_WIDTH,
    height: BOSS_HEIGHT,
    phase: 'idle',
    timer: 0,
    hp: BOSS_HP,
    alive: true,
    facing: -1,
  };
}

// Respawn points, one near the start of each later ground segment (well clear
// of pit edges). [0] matches spawn — death respawns at the highest one the
// player has already crossed, not always the level start; with the level now
// spanning 6900px, sending every death back to x=40 would make the back half
// of the level feel disproportionately punishing.
function makeCheckpoints(): { x: number; y: number }[] {
  return [
    { x: 40, y: GROUND_Y - 100 },
    { x: 900, y: GROUND_Y - 100 },
    { x: 1560, y: GROUND_Y - 100 },
    { x: 2380, y: GROUND_Y - 100 },
    { x: 3390, y: GROUND_Y - 100 },
    { x: 4060, y: GROUND_Y - 100 },
    { x: 4750, y: GROUND_Y - 100 },
    { x: 5600, y: GROUND_Y - 100 },
    { x: 6830, y: GROUND_Y - 100 }, // just past the portal, so dying mid-boss-fight doesn't send the player all the way back
  ];
}

export function createLevel(): Level {
  return {
    worldWidth: 7800,
    groundY: GROUND_Y,
    spawn: { x: 40, y: GROUND_Y - 100 },
    checkpoints: makeCheckpoints(),
    platforms: [...makeGroundPlatforms(), ...floatingPlatforms, ...bonusPlatforms],
    enemies: makeEnemies(),
    coins: makeCoins(),
    // Decorative now — reaching it no longer wins on its own, since the boss
    // physically blocks the path there while alive (see stepGame). Defeating
    // the boss is what actually triggers the win.
    flag: { x: 7650, y: GROUND_Y - FLAG_HEIGHT, width: FLAG_WIDTH, height: FLAG_HEIGHT },
    sporeSprites: makeSporeSprites(),
    pressurePistons: makePressurePistons(),
    bioCoils: makeBioCoils(),
    steamBlowers: makeSteamBlowers(),
    rootPoints: makeRootPoints(),
    cogPickups: makeCogPickups(),
    portal: makePortal(),
    boss: makeBoss(),
    bowPickup: makeBowPickup(),
    jumpers: makeJumpers(),
    turrets: makeTurrets(),
    chestnutRollers: makeChestnutRollers(),
    treasureCaches: makeTreasureCaches(),
  };
}
