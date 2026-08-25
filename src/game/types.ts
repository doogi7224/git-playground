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
}

export interface Coin extends Rect {
  id: string;
  collected: boolean;
}

export interface Flag extends Rect {}

export interface Level {
  worldWidth: number;
  groundY: number;
  spawn: { x: number; y: number };
  platforms: Platform[];
  enemies: Enemy[];
  coins: Coin[];
  flag: Flag;
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
}

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
}
