import {
  BIOCOIL_LANDED_DURATION,
  BIOCOIL_LAUNCH_VY_MECHANICAL,
  BIOCOIL_LAUNCH_VY_WILD,
  BIOCOIL_LEAP_VX_MECHANICAL,
  BIOCOIL_LEAP_VX_WILD,
  BIOCOIL_RANGE,
  BIOCOIL_WINDUP_WILD,
  DEATH_Y,
  FLAME_LOB_ACTIVE,
  FLAME_LOB_CHARGE,
  FLAME_LOB_CYCLE,
  FLAME_LOB_RANGE,
  FRICTION,
  GRAVITY,
  INVULNERABLE_TIME,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  MOVE_SPEED,
  PISTON_BLAST_DURATION,
  PISTON_CHARGE_DURATION,
  PISTON_CYCLE,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SPORE_AMPLITUDE,
  SPORE_PERIOD,
  SPORE_RADIUS_MECHANICAL,
  SPORE_RADIUS_WILD,
  SPORE_SLOW_DURATION,
  SPORE_SLOW_FACTOR,
  STEAM_GUST_ACTIVE,
  STEAM_GUST_CHARGE,
  STEAM_GUST_CYCLE,
  STEAM_GUST_KNOCKBACK,
  STEAM_GUST_RANGE,
  STOMP_BOUNCE,
  STOMP_TOLERANCE,
} from './constants';
import {
  BioCoil,
  BloomState,
  GamePhase,
  GameState,
  InputState,
  Level,
  Platform,
  PressurePiston,
  Rect,
  SporeSprite,
  SteamBlower,
} from './types';

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
    pressurePistons: level.pressurePistons.map((p) => ({ ...p })),
    bioCoils: level.bioCoils.map((c) => ({ ...c })),
    steamBlowers: level.steamBlowers.map((b) => ({ ...b })),
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

function stepPressurePistons(prev: PressurePiston[], dt: number): PressurePiston[] {
  return prev.map((p) => ({ ...p, phase: (p.phase + dt) % PISTON_CYCLE }));
}

export function isPistonDangerous(piston: PressurePiston, bloomState: BloomState): boolean {
  if (bloomState === 'wild') return false; // vines smother it — fully neutralized, not just paused
  return piston.phase >= PISTON_CHARGE_DURATION && piston.phase < PISTON_CHARGE_DURATION + PISTON_BLAST_DURATION;
}

function stepBioCoils(prev: BioCoil[], player: Rect, bloomState: BloomState, dt: number): BioCoil[] {
  return prev.map((c) => {
    if (!c.alive) return c;

    if (c.phase === 'coiled') {
      const dx = player.x + player.width / 2 - (c.homeX + c.width / 2);
      if (Math.abs(dx) > BIOCOIL_RANGE) return c;
      if (bloomState === 'mechanical') {
        // No telegraph in the mechanical form: it springs the instant it detects the player.
        const facing: 1 | -1 = dx < 0 ? -1 : 1;
        return { ...c, phase: 'launch', facing, vx: facing * BIOCOIL_LEAP_VX_MECHANICAL, vy: BIOCOIL_LAUNCH_VY_MECHANICAL };
      }
      return { ...c, phase: 'windup', timer: BIOCOIL_WINDUP_WILD };
    }

    if (c.phase === 'windup') {
      const timer = c.timer - dt;
      if (timer > 0) return { ...c, timer };
      const dx = player.x + player.width / 2 - (c.homeX + c.width / 2);
      const facing: 1 | -1 = dx < 0 ? -1 : 1;
      return { ...c, phase: 'launch', facing, vx: facing * BIOCOIL_LEAP_VX_WILD, vy: BIOCOIL_LAUNCH_VY_WILD, timer: 0 };
    }

    if (c.phase === 'launch') {
      const vy = c.vy + GRAVITY * dt;
      const x = c.x + c.vx * dt;
      const y = c.y + vy * dt;
      if (y >= c.groundY) {
        return { ...c, x: c.homeX, y: c.groundY, vx: 0, vy: 0, phase: 'landed', timer: BIOCOIL_LANDED_DURATION };
      }
      return { ...c, x, y, vy };
    }

    // 'landed'
    const timer = c.timer - dt;
    if (timer > 0) return { ...c, timer };
    return { ...c, phase: 'coiled', timer: 0, x: c.homeX, y: c.groundY };
  });
}

function stepSteamBlowers(prev: SteamBlower[], dt: number): SteamBlower[] {
  return prev.map((b) => {
    if (!b.alive) return b;
    return {
      ...b,
      steamTimer: (b.steamTimer + dt) % STEAM_GUST_CYCLE,
      sporeTimer: (b.sporeTimer + dt) % FLAME_LOB_CYCLE,
    };
  });
}

export function isSteamGustActive(blower: SteamBlower): boolean {
  return blower.steamTimer >= STEAM_GUST_CHARGE && blower.steamTimer < STEAM_GUST_CHARGE + STEAM_GUST_ACTIVE;
}

export function isFlameLobActive(blower: SteamBlower): boolean {
  return blower.sporeTimer >= FLAME_LOB_CHARGE && blower.sporeTimer < FLAME_LOB_CHARGE + FLAME_LOB_ACTIVE;
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

  const bioCoilsStepped = stepBioCoils(prev.bioCoils, prev.player, bloomState, dt);
  const resolvedBioCoils = bioCoilsStepped.map((c) => {
    if (!c.alive) return c;
    if (!rectIntersect(player, c)) return c;

    const isStomp = wasFalling && prevBottom <= c.y + STOMP_TOLERANCE;

    if (c.phase === 'landed' && isStomp) {
      player.vy = STOMP_BOUNCE;
      score += 100;
      return { ...c, alive: false };
    }

    // Stomping while coiled/winding up/mid-leap doesn't defeat it — the
    // spring rejects the player's weight instead of yielding to it, dealing
    // damage same as any other hit (which already sends the player back to
    // the level start, so there's no separate "bounce" velocity to track).
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
    return c;
  });

  const resolvedSteamBlowers = stepSteamBlowers(prev.steamBlowers, dt).map((b) => {
    if (!b.alive) return b;

    // Steam gust: a wide knockback-only zone, active in a short window each 3s cycle.
    if (isSteamGustActive(b)) {
      const gustZone: Rect = { x: b.x - STEAM_GUST_RANGE, y: b.y, width: b.width + STEAM_GUST_RANGE * 2, height: b.height };
      if (rectIntersect(player, gustZone)) {
        const center = b.x + b.width / 2;
        const dir = player.x + player.width / 2 < center ? -1 : 1;
        player.vx = dir * STEAM_GUST_KNOCKBACK;
      }
    }

    // Flame spore: a wider damage zone, active in a short window each 5s cycle.
    if (isFlameLobActive(b)) {
      const lobZone: Rect = { x: b.x - FLAME_LOB_RANGE, y: b.y - 20, width: b.width + FLAME_LOB_RANGE * 2, height: b.height + 20 };
      if (rectIntersect(player, lobZone) && player.invulnerableFor <= 0) {
        lives -= 1;
        player.invulnerableFor = INVULNERABLE_TIME;
        if (lives > 0) {
          player.x = level.spawn.x;
          player.y = level.spawn.y;
          player.vx = 0;
          player.vy = 0;
        }
      }
    }

    if (!rectIntersect(player, b)) return b;

    const isStomp = wasFalling && prevBottom <= b.y + STOMP_TOLERANCE;

    if (isStomp) {
      player.vy = STOMP_BOUNCE;
      // Cap closed (mechanical): stomp just bounces off, no effect on the boss.
      if (bloomState !== 'wild') return b;
      const hp = b.hp - 1;
      if (hp <= 0) {
        score += 300;
        return { ...b, hp: 0, alive: false };
      }
      score += 50;
      return { ...b, hp };
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
    return b;
  });

  const pressurePistons = stepPressurePistons(prev.pressurePistons, dt);
  for (const piston of pressurePistons) {
    if (!isPistonDangerous(piston, bloomState)) continue;
    if (!rectIntersect(player, piston)) continue;
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
  }

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
    pressurePistons,
    bioCoils: resolvedBioCoils,
    steamBlowers: resolvedSteamBlowers,
  };
}

export function computeCameraX(playerX: number, viewportWidth: number, worldWidth: number): number {
  return clamp(playerX - viewportWidth / 2, 0, Math.max(0, worldWidth - viewportWidth));
}
