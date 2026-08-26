export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type BloomState = 'mechanical' | 'wild';

export interface Platform extends Rect {
  id: string;
  /** Only exists (renders + collides) while bloomState matches. Undefined = always present. */
  visibleIn?: BloomState;
}

export interface Enemy extends Rect {
  id: string;
  vx: number;
  minX: number;
  maxX: number;
  alive: boolean;
  /** Locked-in charge direction once the player is detected (mechanical bloom only); 0 = patrolling normally. */
  chargeDir: -1 | 0 | 1;
}

export interface Coin extends Rect {
  id: string;
  collected: boolean;
}

export interface Flag extends Rect {}

export interface ShiftNode extends Rect {
  id: string;
}

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
// (contact damages the player) -> rest while in the mechanical bloom state;
// shifting to wild neutralizes it completely instead of "defeating" it —
// per the monster design doc, it's the one hazard with no kill condition.
export interface PressurePiston extends Rect {
  id: string;
  /** Position within [0, PISTON_CYCLE), advanced by dt every frame. */
  phase: number;
}

export type BioCoilPhase = 'coiled' | 'windup' | 'launch' | 'landed';

// A vine-and-spring enemy that waits coiled at a home spot, then leaps at the
// player when they're in range. Bloom Shift trades a big/telegraphed wild
// leap for a short/instant mechanical one. Only stompable while 'landed'
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

// A defeated monster's remains, per the monster design doc: Cogmite, Bio-Coil,
// and Steam Blower all leave a temporary solid platform for a few seconds
// after being defeated. Bio-Coil's is additionally a bonus-bounce spring.
export type CorpsePlatformSource = 'enemy' | 'bioCoil' | 'steamBlower';

export interface CorpsePlatform extends Rect {
  id: string;
  source: CorpsePlatformSource;
  timeLeft: number;
}

// A short-lived, presentation-only record of "something happened here" —
// physics.ts appends one per stomp/hit/pickup and never reads the list back,
// so this can't influence gameplay; it only exists for effect components
// (particle bursts etc.) to render against. Same timeLeft-countdown pattern
// as CorpsePlatform.
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
  shiftNodes: ShiftNode[];
  sporeSprites: SporeSprite[];
  pressurePistons: PressurePiston[];
  bioCoils: BioCoil[];
  steamBlowers: SteamBlower[];
  rootPoints: RootPoint[];
  cogPickups: CogPickup[];
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
  /** True while standing on a defeated Bio-Coil's corpse platform, which gives the next ground-jump a bonus bounce. */
  standingOnBounceCorpse: boolean;
}

export type GamePhase = 'start' | 'playing' | 'gameover' | 'win';

export interface GameState {
  player: Player;
  enemies: Enemy[];
  coins: Coin[];
  score: number;
  lives: number;
  phase: GamePhase;
  bloomState: BloomState;
  /** True once the player has left every shift node's rect, so touching one again re-triggers a toggle. */
  bloomNodeArmed: boolean;
  sporeSprites: SporeSprite[];
  pressurePistons: PressurePiston[];
  bioCoils: BioCoil[];
  steamBlowers: SteamBlower[];
  cogPickups: CogPickup[];
  corpsePlatforms: CorpsePlatform[];
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
}
