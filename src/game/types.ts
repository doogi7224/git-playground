export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Platform extends Rect {
  id: string;
}

export interface Enemy extends Rect {
  id: string;
  vx: number;
  minX: number;
  maxX: number;
  alive: boolean;
  /** Locked-in charge direction once the player is detected; 0 = patrolling normally. */
  chargeDir: -1 | 0 | 1;
}

export interface Coin extends Rect {
  id: string;
  collected: boolean;
}

export interface Flag extends Rect {}

// A floating hazard that hovers on a fixed sine-wave path and slows the
// player on approach instead of dealing direct damage. Per the monster
// design doc, normal contact never defeats it — only dashing through it
// (the dash's invincibility frames) does.
export interface SporeSprite extends Rect {
  id: string;
  baseY: number;
  phase: number;
  alive: boolean;
}

// A fixed environmental hazard embedded in the ground. Cycles charge -> blast
// (contact damages the player) -> rest in a clear, fixed cycle. It is a
// permanent environmental hazard rather than a mode-dependent exception.
export interface PressurePiston extends Rect {
  id: string;
  /** Position within [0, PISTON_CYCLE), advanced by dt every frame. */
  phase: number;
}

export type BioCoilPhase = 'coiled' | 'windup' | 'launch' | 'landed';

// A vine-and-spring enemy that waits coiled at a home spot, then telegraphs
// a leap when the player enters range. Only stompable while 'landed'
// (post-leap, defenseless); stomping it coiled/mid-leap bounces the player
// off and damages them instead of defeating it.
export interface BioCoil extends Rect {
  id: string;
  /** Safe x range on one authored ground segment; never snaps back to spawn. */
  minX: number;
  maxX: number;
  groundY: number;
  phase: BioCoilPhase;
  /** Countdown for 'windup'/'landed'; unused during 'coiled'/'launch'. */
  timer: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  alive: boolean;
}

// Marks the transition from the main level into the boss arena. Purely a
// trigger rect (no collision) — crossing it once fires a one-time effect
// burst via `portalActivated` in GameState.
export interface Portal extends Rect {
  id: string;
}

export type BossPhase = 'idle' | 'telegraph' | 'attack' | 'vulnerable';
export type BossAttackKind = 'volley' | 'rootWave';

// Area 3's finale — new content with no prior established design to match
// (see CLAUDE.md decision log). Cycles idle (safe to approach) -> telegraph
// (clear visual warning) -> attack (damage/knockback zone) -> vulnerable
// (weak point exposed, stompable) -> back to idle. While alive it is added
// to the solid collision platform list in stepGame, so it physically blocks
// the path to the goal instead of being a walk-through hazard.
export interface Boss extends Rect {
  id: string;
  /** Authored horizontal patrol limits for the flat boss arena. */
  minX: number;
  maxX: number;
  phase: BossPhase;
  timer: number;
  hp: number;
  alive: boolean;
  facing: 1 | -1;
  /** Alternates each telegraph, so the warning always belongs to a known attack. */
  attackKind: BossAttackKind;
  attackCycle: number;
}

// A short-lived, presentation-only record of "something happened here" —
// physics.ts appends one per stomp/hit/pickup and never reads the list back,
// so this can't influence gameplay; it only exists for effect components
// (particle bursts etc.) to render against.
export type EffectKind = 'impact' | 'hit' | 'pickup' | 'gearPickup';

export interface EffectEvent {
  id: string;
  kind: EffectKind;
  x: number;
  y: number;
  timeLeft: number;
}

// A fixed anchor the player can grapple onto with Root-Hook. Unlike a free
// grapple, it only responds at these designated points, so the level
// designer controls exactly where a swing can happen.
export interface RootPoint extends Rect {
  id: string;
}

// Gear Socket pickup types retained for the continuous single-level run.
export type CogType = 'magnet' | 'mirror';

// Relic Bow: a single permanent pickup early in the level. Before it's
// collected the player plays the existing jump/dash/stomp kit only; after,
// an attack input fires a straight-line arrow. Modeled as a single contact
// flag rather than a separate GameState boolean,
// since there's exactly one and its own `collected` field is the source of
// truth for whether `Player.hasBow` should already be true.
export interface BowPickup extends Rect {
  id: string;
  collected: boolean;
}

// Player-fired projectile. Deliberately has no `alive` flag: unlike
// Enemy/BioCoil (which persist as inert corpses so their level-authored ids
// stay stable), an arrow that hits something or leaves bounds is just
// spliced out of GameState.arrows entirely — there's no reason to keep a
// dead arrow around.
export interface Arrow extends Rect {
  id: string;
  vx: number;
  /** Seconds since fired; a safety despawn even over open ground with no wall to hit. */
  age: number;
}

export type JumperPhase = 'grounded' | 'windup' | 'airborne';

// A timer-driven hopping enemy with no player-detection at all (per the
// design brief: no chase AI). It makes forward hops inside a level-authored
// platform span, reversing at either edge so it never hops into a pit.
export interface Jumper extends Rect {
  id: string;
  minX: number;
  maxX: number;
  groundY: number;
  phase: JumperPhase;
  timer: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  alive: boolean;
}

// A fixed turret that periodically fires one SeedProjectile toward whichever
// side the player is on *at the moment it fires* (locked in then, like
// Cogmite's chargeDir and Bio-Coil's facing) — never continuously homing.
export interface Turret extends Rect {
  id: string;
  timer: number;
  alive: boolean;
}

// A Turret's projectile. Same "no alive flag, just spliced out" reasoning as
// Arrow. Can hit the player (damage) or be destroyed by the player (stomp or
// arrow), matching the design brief's "투사체와 적 모두 스톰프 또는 화살로
// 대응 가능".
export interface SeedProjectile extends Rect {
  id: string;
  vx: number;
  /** Zero for turrets/root waves; shallow fan for the three boss seeds. */
  vy: number;
  age: number;
  source: 'turret' | 'boss' | 'bossWave' | 'slinger';
}

export type ThornSlingerPhase = 'idle' | 'telegraph' | 'betweenShots';

/** A stationary Stage 2 plant artillery enemy. It locks its aim during the
 * warning, then fires a low, readable two-seed burst. */
export interface ThornSlinger extends Rect {
  id: string;
  phase: ThornSlingerPhase;
  timer: number;
  cooldown: number;
  facing: 1 | -1;
  alive: boolean;
}

export type GearGliderPhase = 'patrol' | 'telegraph' | 'drop' | 'recover';

/** An aerial Stage 2 enemy. It glides across a fixed span, dives only after
 * its target has been clearly warned, then remains vulnerable on landing. */
export interface GearGlider extends Rect {
  id: string;
  minX: number;
  maxX: number;
  baseY: number;
  groundY: number;
  phase: GearGliderPhase;
  timer: number;
  pathPhase: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  alive: boolean;
}

export type ChestnutRollerPhase = 'walk' | 'windup' | 'rolling' | 'recover';

// A ground patrol enemy that alternates a slow, vulnerable walk with a fast,
// arrow/stomp-immune roll once the player is close (and off cooldown).
// Shaped like Cogmite's "lock a direction, telegraph, then commit" pattern,
// with an added invincible-while-rolling window and a post-recover cooldown
// so it can't roll back-to-back. Shell-kick/deflection is explicitly out of
// scope for this pass (see CLAUDE.md 4장).
export interface ChestnutRoller extends Rect {
  id: string;
  minX: number;
  maxX: number;
  vx: number;
  facing: 1 | -1;
  phase: ChestnutRollerPhase;
  /** Counts up within the current phase; meaning depends on phase (windup/rolling/recover progress). */
  timer: number;
  /** Seconds until another roll may start; only checked while 'walk'. */
  cooldown: number;
  alive: boolean;
}

export type TreasureCacheKind = 'rootCache' | 'relicPod';
export type TreasureReward = 'sunseedBurst' | 'arrowBundle' | 'lifeBloom' | 'magnetCog' | 'mirrorCog';

// An optional-route pickup opened by a specific committed action rather than
// a touch: a Root Cache is struck from below by a jump and rolls its reward
// on opening (`null` until then); a Relic Pod uses an authored arrow reward.
export interface TreasureCache extends Rect {
  id: string;
  kind: TreasureCacheKind;
  reward: TreasureReward | null;
  opened: boolean;
}

// A short-lived, presentation-only record of "this cache just opened and
// produced X" -- same "physics writes it, never reads it back" shape as
// EffectEvent, but carries which reward fired so a popup can show the
// specific outcome instead of a generic burst.
export interface LootReveal {
  id: string;
  reward: TreasureReward;
  x: number;
  y: number;
  timeLeft: number;
}

export interface Level {
  worldWidth: number;
  groundY: number;
  spawn: { x: number; y: number };
  /** Respawn points reached by crossing their x, in order; [0] matches spawn. Death respawns at the highest one crossed, not always the level start. */
  checkpoints: { x: number; y: number }[];
  platforms: Platform[];
  enemies: Enemy[];
  coins: Coin[];
  flag: Flag;
  sporeSprites: SporeSprite[];
  pressurePistons: PressurePiston[];
  bioCoils: BioCoil[];
  rootPoints: RootPoint[];
  portal: Portal;
  boss: Boss;
  bowPickup: BowPickup;
  jumpers: Jumper[];
  turrets: Turret[];
  chestnutRollers: ChestnutRoller[];
  thornSlingers: ThornSlinger[];
  gearGliders: GearGlider[];
  treasureCaches: TreasureCache[];
}

export interface Player extends Rect {
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  invulnerableFor: number;
  /** Seconds remaining on the Spore Sprite proximity slow debuff. */
  slowFor: number;
  /** Seconds remaining on an active dash; while >0, movement is a fixed horizontal burst. */
  dashTimer: number;
  /** Seconds until another dash may be started (ground or air). */
  dashCooldown: number;
  /** Consumed by dashing while airborne; refills on landing. Grounded dashes don't spend it. */
  airDashAvailable: boolean;
  /** True while attached to a Root-Hook point; normal movement/gravity are suspended in favor of pendulum physics. */
  grappling: boolean;
  grappleAnchorX: number;
  grappleAnchorY: number;
  /** Radians from straight down (0 = hanging at rest). */
  grappleAngle: number;
  grappleAngularVel: number;
  grappleRadius: number;
  /** Currently-equipped cog per slot, or null. Auto-equipped on pickup; lost on a full restart, not on a per-life respawn. */
  equippedHead: CogType | null;
  equippedBody: CogType | null;
  /** Seconds remaining on the temporary Magnet Cog auto-collection effect. */
  magnetFor: number;
  /** One-hit protection supplied by the Mirror Cog. It is consumed instead of a life on the next ordinary hit. */
  shieldCharges: number;
  /** While airborne and pressed against a wall (wall-slide), the direction a wall-jump would push (away from the wall); 0 = not touching one. Consumed by a wall-jump. */
  touchingWall: -1 | 0 | 1;
  /** True once the Relic Bow pickup has been collected; gates whether an attack input fires an arrow. */
  hasBow: boolean;
  /** Seconds until another arrow may be fired, so mashing attack can't produce a solid stream of arrows. */
  arrowCooldown: number;
  /** Current arrow ammo; 0 (meaningless until hasBow) until the bow is picked up, then RELIC_BOW_STARTING_ARROWS. Firing consumes one; a Treasure Cache's arrowBundle reward restores some, clamped to maxArrows. */
  arrows: number;
  /** Ammo capacity, set once on bow pickup; arrows is clamped to this. */
  maxArrows: number;
}

export type GamePhase = 'start' | 'playing' | 'gameover' | 'win';

export interface GameState {
  player: Player;
  enemies: Enemy[];
  coins: Coin[];
  score: number;
  lives: number;
  phase: GamePhase;
  sporeSprites: SporeSprite[];
  pressurePistons: PressurePiston[];
  bioCoils: BioCoil[];
  boss: Boss;
  bowPickup: BowPickup;
  arrows: Arrow[];
  jumpers: Jumper[];
  turrets: Turret[];
  chestnutRollers: ChestnutRoller[];
  thornSlingers: ThornSlinger[];
  gearGliders: GearGlider[];
  treasureCaches: TreasureCache[];
  lootReveals: LootReveal[];
  /** Monotonic counter used only to mint unique LootReveal ids, same pattern as effectSeq. */
  lootRevealSeq: number;
  /** Per-run pseudo-random state for mystery-block rewards. */
  lootRandomSeed: number;
  seeds: SeedProjectile[];
  /** Monotonic counter used only to mint unique Arrow ids, same pattern as effectSeq. */
  arrowSeq: number;
  /** Monotonic counter used only to mint unique SeedProjectile ids, same pattern as effectSeq (previously derived from a rounded turret timer, which collided every fire cycle since a turret's timer is always ~TURRET_FIRE_INTERVAL at the moment it fires). */
  seedSeq: number;
  /** True once the player has crossed the portal into the boss arena; only used to fire the one-time crossing effect. */
  portalActivated: boolean;
  /** Index into level.checkpoints of the highest one crossed so far; death respawns here. */
  checkpointIndex: number;
  /** Recent stomp/hit/pickup moments for effect components to render; never read by physics itself. */
  effects: EffectEvent[];
  /** Monotonic counter used only to mint unique EffectEvent ids. */
  effectSeq: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  dashPressed: boolean;
  /** Held (not edge-triggered) — stays attached to a Root-Hook point for as long as this is true. */
  grappleHeld: boolean;
  /** Edge-triggered, like jumpPressed/dashPressed. No-op until the Relic Bow is collected. */
  attackPressed: boolean;
}
