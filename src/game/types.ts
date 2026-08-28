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
// (the Overdrive dash's invincibility frames) does.
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
  homeX: number;
  groundY: number;
  phase: BioCoilPhase;
  /** Countdown for 'windup'/'landed'; unused during 'coiled'/'launch'. */
  timer: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  alive: boolean;
}

// Fixed mini-boss with two independently-cycling attacks: a steam gust
// (knockback only, no damage — the risk is being pushed into a pit) and a
// flame-spore lob (direct damage). While mechanical its cap is closed, so
// stomping bounces the player off with no effect; while wild the cap is
// open and stompable, needing HP hits to defeat.
export interface SteamBlower extends Rect {
  id: string;
  steamTimer: number;
  sporeTimer: number;
  hp: number;
  alive: boolean;
}

// Marks the transition from the main level into the boss arena. Purely a
// trigger rect (no collision) — crossing it once fires a one-time effect
// burst via `portalActivated` in GameState.
export interface Portal extends Rect {
  id: string;
}

export type BossPhase = 'idle' | 'telegraph' | 'attack' | 'vulnerable';

// Area 3's finale — new content with no prior established design to match
// (see CLAUDE.md decision log). Cycles idle (safe to approach) -> telegraph
// (clear visual warning) -> attack (damage/knockback zone) -> vulnerable
// (weak point exposed, stompable) -> back to idle. While alive it is added
// to the solid collision platform list in stepGame, so it physically blocks
// the path to the goal instead of being a walk-through hazard.
export interface Boss extends Rect {
  id: string;
  phase: BossPhase;
  timer: number;
  hp: number;
  alive: boolean;
  facing: 1 | -1;
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

// Gear Socket, adapted for a single continuous level (no stage-clear/equip
// screen to reassign cogs between runs): picking one up auto-equips it into
// its slot for the rest of the current attempt, replacing whatever was
// already there. Only the head slot has one cog implemented (Mirror) —
// Photosyn is design-doc only since it depends on Overgrowth Blocks, which
// don't exist in this prototype.
export type CogType = 'spring' | 'magnet' | 'steamBoost' | 'rootHookCog' | 'mirror';
export type CogSlot = 'head' | 'body' | 'foot';

export interface CogPickup extends Rect {
  id: string;
  cogType: CogType;
  collected: boolean;
}

// Relic Bow: a single permanent pickup early in the level. Before it's
// collected the player plays the existing jump/dash/stomp kit only; after,
// an attack input fires a straight-line arrow. Modeled after CogPickup
// (single flag flip on contact) rather than a separate GameState boolean,
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
// design brief: no chase AI). Hops straight up in place from a fixed homeX,
// so it can never hop off the edge of the platform it's placed on. The brief
// 'windup' before launch mirrors Bio-Coil's telegraph pattern so the hop is
// always readable, never a surprise.
export interface Jumper extends Rect {
  id: string;
  homeX: number;
  groundY: number;
  phase: JumperPhase;
  timer: number;
  vy: number;
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
  age: number;
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
  steamBlowers: SteamBlower[];
  rootPoints: RootPoint[];
  cogPickups: CogPickup[];
  portal: Portal;
  boss: Boss;
  bowPickup: BowPickup;
  jumpers: Jumper[];
  turrets: Turret[];
  chestnutRollers: ChestnutRoller[];
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
  /** 0-OVERDRIVE_MAX combo meter, filled by stomps/dashes; resets if the chain goes idle too long. */
  overdriveGauge: number;
  /** Seconds since the last stomp/dash; a full reset of this (and the gauge) means the combo broke. */
  comboIdleFor: number;
  /** Seconds remaining on an active Overdrive boost (speed/jump/coin bonus). */
  overdriveTimer: number;
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
  equippedFoot: CogType | null;
  /** Extra fixed-velocity coast after a dash ends, granted by the Steam Boost cog. */
  steamBoostTimer: number;
  /** Rolling position history (only maintained while Mirror is equipped) used as an alternate respawn point. */
  mirrorTrail: { x: number; y: number; age: number }[];
  /** While airborne and pressed against a wall (wall-slide), the direction a wall-jump would push (away from the wall); 0 = not touching one. Consumed by a wall-jump. */
  touchingWall: -1 | 0 | 1;
  /** True once the Relic Bow pickup has been collected; gates whether an attack input fires an arrow. */
  hasBow: boolean;
  /** Seconds until another arrow may be fired, so mashing attack can't produce a solid stream of arrows. */
  arrowCooldown: number;
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
  steamBlowers: SteamBlower[];
  cogPickups: CogPickup[];
  boss: Boss;
  bowPickup: BowPickup;
  arrows: Arrow[];
  jumpers: Jumper[];
  turrets: Turret[];
  chestnutRollers: ChestnutRoller[];
  seeds: SeedProjectile[];
  /** Monotonic counter used only to mint unique Arrow ids, same pattern as effectSeq. */
  arrowSeq: number;
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
