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
  COIN_SIZE,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
  FLAG_HEIGHT,
  FLAG_WIDTH,
  JUMPER_HEIGHT,
  JUMPER_LAUNCH_VX,
  JUMPER_WIDTH,
  GEAR_GLIDER_HEIGHT,
  GEAR_GLIDER_WIDTH,
  PISTON_HEIGHT,
  PISTON_WIDTH,
  PORTAL_HEIGHT,
  PORTAL_WIDTH,
  ROOTHOOK_SIZE,
  SPORE_SPRITE_HEIGHT,
  SPORE_SPRITE_WIDTH,
  TREASURE_CACHE_HEIGHT,
  TREASURE_CACHE_WIDTH,
  TURRET_HEIGHT,
  TURRET_WIDTH,
  THORN_SLINGER_HEIGHT,
  THORN_SLINGER_WIDTH,
  VIEWPORT_HEIGHT,
} from './constants';
import {
  BioCoil,
  BowPickup,
  Boss,
  ChestnutRoller,
  Coin,
  Enemy,
  GearGlider,
  Jumper,
  Level,
  Platform,
  Portal,
  PressurePiston,
  RootPoint,
  SporeSprite,
  TreasureCache,
  TreasureCacheKind,
  TreasureReward,
  ThornSlinger,
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
  // Stage 2 — Sunken Gearworks. Required pits stay at or below 150px.
  [7700, 8420],
  [8560, 9180],
  [9320, 9950],
  [10080, 10760],
  [10900, 11520],
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
  { id: 'p6', x: 1650, y: GROUND_Y - 120, width: 170, height: 20 },
  { id: 'p7', x: 1900, y: GROUND_Y - 70, width: 100, height: 20 },
  { id: 'p8', x: 2260, y: GROUND_Y - 60, width: 90, height: 20 },
  { id: 'p9', x: 2500, y: GROUND_Y - 110, width: 120, height: 20 },
  { id: 'p10', x: 2800, y: GROUND_Y - 70, width: 110, height: 20 },
  // Area 2, beyond the original flag position.
  { id: 'p11', x: 3220, y: GROUND_Y - 70, width: 100, height: 20 }, // bridges the pit into area 2
  { id: 'p12', x: 3450, y: GROUND_Y - 110, width: 100, height: 20 },
  { id: 'p13', x: 3700, y: GROUND_Y - 70, width: 90, height: 20 },
  { id: 'p14', x: 3920, y: GROUND_Y - 60, width: 90, height: 20 }, // bridges the pit before ground-5
  { id: 'p15', x: 4100, y: GROUND_Y - 100, width: 180, height: 20 },
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
  { id: 'g1', x: 8290, y: GROUND_Y - 78, width: 100, height: 20 },
  { id: 'g2', x: 9120, y: GROUND_Y - 110, width: 120, height: 20 },
  { id: 'g3', x: 9840, y: GROUND_Y - 72, width: 95, height: 20 },
  { id: 'g4', x: 10670, y: GROUND_Y - 108, width: 110, height: 20 },
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
  // This lane is clear after shortening e5's patrol below. It stays on the
  // same solid ground segment and leaves a full sprite gap at both ends.
  const defs: [string, number, number][] = [['coil1', 3020, 3170]];
  return defs.map(([id, minX, maxX]) => ({
    id,
    x: minX + (maxX - minX) / 2,
    y: GROUND_Y - BIOCOIL_HEIGHT,
    width: BIOCOIL_WIDTH,
    height: BIOCOIL_HEIGHT,
    minX,
    maxX,
    groundY: GROUND_Y - BIOCOIL_HEIGHT,
    phase: 'coiled',
    timer: 0,
    vx: 0,
    vy: 0,
    facing: 1,
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

// Relic Bow: one permanent pickup early in Area 1, clear of every existing
// hazard/platform in this stretch (p1 starts at x=300 and e1 starts
// at x=350/400) so grabbing it is never contested by anything else. Placed
// on the ground so it's easy to walk into.
function makeBowPickup(): BowPickup {
  return { id: 'bow1', x: 250, y: GROUND_Y - BOW_PICKUP_SIZE, width: BOW_PICKUP_SIZE, height: BOW_PICKUP_SIZE, collected: false };
}

// Jumpers sit on wide floating platforms rather than the ground —
// every current ground-level Cogmite patrols at GROUND_Y, so any floating
// platform is guaranteed free of hazard overlap without needing to re-check
// the (already densely packed) ground lanes. Their authored x span is the
// platform's safe interior: each timed hop moves forward and reverses at an
// edge rather than snapping back to its spawn point.
function makeJumpers(): Jumper[] {
  const defs: [string, number, number, number][] = [
    ['jumper1', 1658, 1812, 60], // p6 safe interior, widened for a real forward hop
    ['jumper2', 4108, 4272, 80], // p15 safe interior, widened for a real forward hop
  ];
  return defs.map(([id, minX, platformRight, groundY], index) => {
    const maxX = platformRight - JUMPER_WIDTH;
    const x = minX + (maxX - minX) / 2;
    const facing: 1 | -1 = index % 2 === 0 ? 1 : -1;
    return {
    id,
    x,
    y: groundY - JUMPER_HEIGHT,
    width: JUMPER_WIDTH,
    height: JUMPER_HEIGHT,
    minX,
    maxX,
    groundY: groundY - JUMPER_HEIGHT,
    phase: 'grounded',
    timer: 0,
    vx: facing * JUMPER_LAUNCH_VX,
    vy: 0,
    facing,
    alive: true,
  };
  });
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
// Bio-Coil and spawn/bow cluster) and picking the
// two widest gaps left over (a computed check, not eyeballed -- see
// 개발로그.md for the exact free-gap list). No new pits, platforms, or
// level segments were added.
function makeChestnutRollers(): ChestnutRoller[] {
  const defs: [string, number, number][] = [
    ['roller1', 2500, 2900], // widened safe lane between the shortened e4 patrol and e5
    ['roller2', 6260, 6760], // fully open ground stretch before the boss portal
  ];
  return defs.map(([id, minX, maxX]) => ({
    id,
    // Begin in the middle, not against a patrol wall. Otherwise a player
    // approaching from the near side can trigger a roll with no visible
    // travel before the boundary immediately cancels it.
    x: minX + (maxX - minX - CHESTNUT_ROLLER_WIDTH) / 2,
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

// Three Root Caches are compact overhead mystery blocks on safe stretches of
// the main route. Their underside sits 72px above the ground: a normal jump
// reaches them, while the 28px block leaves clear running space underneath.
// Each rolls its reward on opening. Two Relic Pods remain on optional high
// platforms after the bow pickup with their authored arrow-only rewards.
function makeTreasureCaches(): TreasureCache[] {
  const defs: [string, TreasureCacheKind, TreasureReward | null][] = [
    ['cache-root1', 'rootCache', null],
    ['cache-root2', 'rootCache', null],
    ['cache-root3', 'rootCache', null],
    ['cache-pod1', 'relicPod', 'lifeBloom'],
    // Arrow-only targets should pay back a useful consumable, not a score
    // burst that reads like another floating coin pickup.
    ['cache-pod2', 'relicPod', 'arrowBundle'],
  ];
  const mysteryBlockXs = [1120, 2150, 3650];
  return defs.map(([id, kind, reward], i) => {
    const platform = bonusPlatforms[i];
    const isMysteryBlock = kind === 'rootCache';
    return {
      id,
      kind,
      reward,
      x: isMysteryBlock ? mysteryBlockXs[i] : platform.x + (platform.width - TREASURE_CACHE_WIDTH) / 2,
      y: isMysteryBlock ? GROUND_Y - 100 : platform.y - TREASURE_CACHE_HEIGHT,
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
    ['e4', 2400, 2480, GROUND_Y], // preserves a broad, non-overlapping Roller lane
    ['e5', 2900, 2960, GROUND_Y], // leaves a collision-free Bio-Coil leap lane
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
  // A low entry marker welcomes each safe ground segment. Platform coins are
  // centered on stable, unoccupied platforms so their placement teaches the
  // route instead of forming arbitrary floating clusters.
  const entryCoins: [number, number][] = [
    [130, GROUND_Y - 45], [680, GROUND_Y - 45], [875, GROUND_Y - 45],
    [1400, GROUND_Y - 45], [1525, GROUND_Y - 45], [2355, GROUND_Y - 45],
    [3200, GROUND_Y - 45], [3355, GROUND_Y - 45], [4035, GROUND_Y - 45],
    [4755, GROUND_Y - 45], [5455, GROUND_Y - 45], [6225, GROUND_Y - 45],
    [6765, GROUND_Y - 45],
    [7720, GROUND_Y - 45], [8580, GROUND_Y - 45], [9340, GROUND_Y - 45],
    [10100, GROUND_Y - 45], [10920, GROUND_Y - 45],
  ];
  const occupiedPlatformIds = new Set(['p6', 'p9', 'p15', 'p22']);
  const platformCoins: [number, number][] = floatingPlatforms
    .filter((platform) => !occupiedPlatformIds.has(platform.id))
    .map((platform) => [
      platform.x + (platform.width - COIN_SIZE) / 2,
      platform.y - COIN_SIZE - 6,
    ]);
  const bonusCoins: [number, number][] = bonusPlatforms.slice(0, 3).flatMap((platform) => [
    [platform.x + 12, platform.y - COIN_SIZE - 6],
    [platform.x + platform.width - COIN_SIZE - 12, platform.y - COIN_SIZE - 6],
  ]);
  const coinDefs = [...entryCoins, ...platformCoins, ...bonusCoins];
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
    // Keep Rootwarden in the flat final room, with clear room at both edges
    // for a player to retreat and read each warning.
    minX: 6980,
    maxX: 7540,
    phase: 'idle',
    timer: 0,
    hp: BOSS_HP,
    alive: true,
    facing: -1,
    attackKind: 'volley',
    attackCycle: 0,
  };
}

function makeThornSlingers(): ThornSlinger[] {
  const defs: [string, number][] = [
    ['slinger1', 8040], ['slinger2', 8840], ['slinger3', 9560],
    ['slinger4', 10410], ['slinger5', 11130],
  ];
  return defs.map(([id, x], index) => ({
    id, x, y: GROUND_Y - THORN_SLINGER_HEIGHT,
    width: THORN_SLINGER_WIDTH, height: THORN_SLINGER_HEIGHT,
    phase: 'idle', timer: 0, cooldown: index * 0.25, facing: -1, alive: true,
  }));
}

function makeGearGliders(): GearGlider[] {
  const defs: [string, number, number, number][] = [
    ['glider1', 7820, 8260, GROUND_Y - 120], ['glider2', 8660, 9100, GROUND_Y - 138],
    ['glider3', 9440, 9880, GROUND_Y - 122], ['glider4', 10180, 10610, GROUND_Y - 142],
    ['glider5', 10950, 11370, GROUND_Y - 126],
  ];
  return defs.map(([id, minX, maxX, baseY], index) => ({
    id, x: minX + (maxX - minX) / 2, y: baseY,
    width: GEAR_GLIDER_WIDTH, height: GEAR_GLIDER_HEIGHT,
    minX, maxX, baseY, groundY: GROUND_Y - GEAR_GLIDER_HEIGHT,
    phase: 'patrol', timer: 0, pathPhase: index * (Math.PI / 2),
    vx: index % 2 === 0 ? 95 : -95, vy: 0, facing: index % 2 === 0 ? 1 : -1, alive: true,
  }));
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
    { x: 7820, y: GROUND_Y - 100 },
    { x: 9250, y: GROUND_Y - 100 },
    { x: 10250, y: GROUND_Y - 100 },
  ];
}

export function createLevel(): Level {
  const treasureCaches = makeTreasureCaches();
  return {
    worldWidth: 11520,
    groundY: GROUND_Y,
    spawn: { x: 40, y: GROUND_Y - 100 },
    checkpoints: makeCheckpoints(),
    platforms: [
      ...makeGroundPlatforms(),
      ...floatingPlatforms,
      ...bonusPlatforms,
      // Mystery blocks remain solid after use, matching their spent visual.
      ...treasureCaches
        .filter((cache) => cache.kind === 'rootCache')
        .map(({ x, y, width, height, id }) => ({ id: `${id}-solid`, x, y, width, height })),
    ],
    enemies: makeEnemies(),
    coins: makeCoins(),
    // The Rootwarden guards the Stage 2 entrance. The far Gearworks banner is
    // the only completion trigger.
    flag: { x: 11455, y: GROUND_Y - FLAG_HEIGHT, width: FLAG_WIDTH, height: FLAG_HEIGHT },
    sporeSprites: makeSporeSprites(),
    pressurePistons: makePressurePistons(),
    bioCoils: makeBioCoils(),
    rootPoints: makeRootPoints(),
    portal: makePortal(),
    boss: makeBoss(),
    bowPickup: makeBowPickup(),
    jumpers: makeJumpers(),
    turrets: makeTurrets(),
    chestnutRollers: makeChestnutRollers(),
    thornSlingers: makeThornSlingers(),
    gearGliders: makeGearGliders(),
    treasureCaches,
  };
}
