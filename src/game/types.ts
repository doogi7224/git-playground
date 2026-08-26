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

export interface Level {
  worldWidth: number;
  groundY: number;
  spawn: { x: number; y: number };
  platforms: Platform[];
  enemies: Enemy[];
  coins: Coin[];
  flag: Flag;
  shiftNodes: ShiftNode[];
}

export interface Player extends Rect {
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  invulnerableFor: number;
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
}

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
}
