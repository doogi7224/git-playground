import {
  DEATH_Y,
  FRICTION,
  GRAVITY,
  INVULNERABLE_TIME,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  MOVE_SPEED,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SPORE_AMPLITUDE,
  SPORE_PERIOD,
  SPORE_RADIUS_MECHANICAL,
  SPORE_RADIUS_WILD,
  SPORE_SLOW_DURATION,
  SPORE_SLOW_FACTOR,
  STOMP_BOUNCE,
  STOMP_TOLERANCE,
} from './constants';
import { BloomState, GamePhase, GameState, InputState, Level, Platform, Rect, SporeSprite } from './types';

export function rectIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function activePlatforms(level: Level, bloomState: BloomState): Platform[] {
  return level.platforms.filter((p) => !p.visibleIn || p.visibleIn === bloomState);
}

export function createInitialState(level: Level): GameState {
  return {
    player: {
      x: level.spawn.x,
      y: level.spawn.y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      invulnerableFor: 0,
      slowFor: 0,
    },
    enemies: level.enemies.map((e) => ({ ...e })),
    coins: level.coins.map((c) => ({ ...c })),
    score: 0,
    lives: 3,
    phase: 'playing',
    bloomState: 'mechanical',
    bloomNodeArmed: true,
    sporeSprites: level.sporeSprites.map((s) => ({ ...s })),
  };
}

function rectCenter(r: Rect): { x: number; y: number } {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

function stepSporeSprites(prev: SporeSprite[], dt: number): SporeSprite[] {
  return prev.map((s) => {
    const phase = s.phase + (dt * (2 * Math.PI)) / SPORE_PERIOD;
    return { ...s, phase, y: s.baseY + Math.sin(phase) * SPORE_AMPLITUDE };
  });
}

export function stepGame(prev: GameState, input: InputState, level: Level, dt: number): GameState {
  if (prev.phase !== 'playing') return prev;

  const player = { ...prev.player };

  // Bloom Shift: decided from where the player was at the start of this
  // frame (before this frame's own movement), so the toggle and the
  // platform set used for this frame's collision stay in sync (no
  // one-frame lag between what's drawn and what's solid).
  let bloomState = prev.bloomState;
  let bloomNodeArmed = prev.bloomNodeArmed;
  const touchingShiftNode = level.shiftNodes.some((n) => rectIntersect(prev.player, n));
  if (touchingShiftNode && bloomNodeArmed) {
    bloomState = bloomState === 'mechanical' ? 'wild' : 'mechanical';
    bloomNodeArmed = false;
  } else if (!touchingShiftNode) {
    bloomNodeArmed = true;
  }
  const platforms = activePlatforms(level, bloomState);

  // Spore Sprite proximity slow: decided from the pre-frame debuff timer so
  // this frame's move speed matches what's shown (no one-frame mismatch).
  const moveSpeed = prev.player.slowFor > 0 ? MOVE_SPEED * SPORE_SLOW_FACTOR : MOVE_SPEED;

  if (input.left && !input.right) {
    player.vx = -moveSpeed;
    player.facing = -1;
  } else if (input.right && !input.left) {
    player.vx = moveSpeed;
    player.facing = 1;
  } else if (player.vx > 0) {
    player.vx = Math.max(0, player.vx - FRICTION * dt);
  } else if (player.vx < 0) {
    player.vx = Math.min(0, player.vx + FRICTION * dt);
  }

  if (input.jumpPressed && player.onGround) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
  }

  player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL_SPEED);

  // Horizontal movement + collision
  player.x += player.vx * dt;
  for (const plat of platforms) {
    if (rectIntersect(player, plat)) {
      if (player.vx > 0) player.x = plat.x - player.width;
      else if (player.vx < 0) player.x = plat.x + plat.width;
      player.vx = 0;
    }
  }
  player.x = clamp(player.x, 0, level.worldWidth - player.width);

  // Vertical movement + collision
  player.onGround = false;
  player.y += player.vy * dt;
  for (const plat of platforms) {
    if (rectIntersect(player, plat)) {
      if (player.vy > 0) {
        player.y = plat.y - player.height;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = plat.y + plat.height;
        player.vy = 0;
      }
    }
  }

  if (player.invulnerableFor > 0) {
    player.invulnerableFor = Math.max(0, player.invulnerableFor - dt);
  }

  // Enemy patrol
  const enemies = prev.enemies.map((e) => {
    if (!e.alive) return e;
    let nx = e.x + e.vx * dt;
    let vx = e.vx;
    if (nx < e.minX) {
      nx = e.minX;
      vx = Math.abs(vx);
    } else if (nx + e.width > e.maxX) {
      nx = e.maxX - e.width;
      vx = -Math.abs(vx);
    }
    return { ...e, x: nx, vx };
  });

  let score = prev.score;
  let lives = prev.lives;
  let phase: GamePhase = prev.phase;

  // Captured once, before mutating player.vy in the loop below: a stomp on one
  // enemy must not change whether a *different* enemy overlapping this same
  // frame also counts as a stomp. Using the pre-frame bottom (rather than the
  // post-movement one) also makes the check independent of fall speed/frame
  // size, since it asks "did the player start this frame above the enemy?"
  // instead of "how deep is the overlap after moving?".
  const wasFalling = prev.player.vy > 0;
  const prevBottom = prev.player.y + prev.player.height;

  const resolvedEnemies = enemies.map((e) => {
    if (!e.alive) return e;
    if (!rectIntersect(player, e)) return e;

    const isStomp = wasFalling && prevBottom <= e.y + STOMP_TOLERANCE;

    if (isStomp) {
      player.vy = STOMP_BOUNCE;
      score += 100;
      return { ...e, alive: false };
    }

    if (player.invulnerableFor <= 0) {
      lives -= 1;
      player.invulnerableFor = INVULNERABLE_TIME;
      if (lives > 0) {
        player.x = level.spawn.x;
        player.y = level.spawn.y;
        player.vx = 0;
        player.vy = 0;
      }
    }
    return e;
  });

  const resolvedCoins = prev.coins.map((c) => {
    if (c.collected) return c;
    if (rectIntersect(player, c)) {
      score += 10;
      return { ...c, collected: true };
    }
    return c;
  });

  const sporeSprites = stepSporeSprites(prev.sporeSprites, dt);
  const sporeRadius = bloomState === 'wild' ? SPORE_RADIUS_WILD : SPORE_RADIUS_MECHANICAL;
  const playerCenter = rectCenter(player);
  const nearSporeSprite = sporeSprites.some((s) => {
    const c = rectCenter(s);
    return Math.hypot(c.x - playerCenter.x, c.y - playerCenter.y) <= sporeRadius;
  });
  player.slowFor = nearSporeSprite ? SPORE_SLOW_DURATION : Math.max(0, prev.player.slowFor - dt);

  if (player.y > DEATH_Y) {
    lives -= 1;
    if (lives > 0) {
      player.x = level.spawn.x;
      player.y = level.spawn.y;
      player.vx = 0;
      player.vy = 0;
      player.invulnerableFor = INVULNERABLE_TIME;
    }
  }

  if (lives <= 0) {
    phase = 'gameover';
  } else if (rectIntersect(player, level.flag)) {
    phase = 'win';
  }

  return {
    player,
    enemies: resolvedEnemies,
    coins: resolvedCoins,
    score,
    lives,
    phase,
    bloomState,
    bloomNodeArmed,
    sporeSprites,
  };
}

export function computeCameraX(playerX: number, viewportWidth: number, worldWidth: number): number {
  return clamp(playerX - viewportWidth / 2, 0, Math.max(0, worldWidth - viewportWidth));
}
