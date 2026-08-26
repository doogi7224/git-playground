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

export interface Level {
  worldWidth: number;
  groundY: number;
  spawn: { x: number; y: number };
  platforms: Platform[];
  enemies: Enemy[];
  coins: Coin[];
  flag: Flag;
  shiftNodes: ShiftNode[];
  sporeSprites: SporeSprite[];
  pressurePistons: PressurePiston[];
  bioCoils: BioCoil[];
  steamBlowers: SteamBlower[];
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
}

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  dashPressed: boolean;
}
