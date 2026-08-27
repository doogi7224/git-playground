import {
  AIR_CONTROL_MULT,
  BIOCOIL_LANDED_DURATION,
  BOSS_ATTACK_DURATION,
  BOSS_ATTACK_KNOCKBACK,
  BOSS_ATTACK_RANGE,
  BOSS_IDLE_DURATION,
  BOSS_TELEGRAPH_DURATION,
  BOSS_VULNERABLE_DURATION,
  BIOCOIL_LAUNCH_VY_WILD,
  BIOCOIL_LEAP_VX_WILD,
  BIOCOIL_RANGE,
  BIOCOIL_WINDUP_WILD,
  COG_CANNON_JUMP_MULT,
  COG_MAGNET_RADIUS,
  COG_MIRROR_TRAIL_SECONDS,
  COG_ROOTHOOK_RANGE_MULT,
  COG_SPRING_JUMP_MULT,
  COG_STEAMBOOST_EXTRA_DURATION,
  COG_WALLJUMP_HORIZ_MULT,
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_INVULN,
  DASH_SPEED,
  DEATH_Y,
  EFFECT_DURATION,
  ENEMY_CHARGE_SPEED,
  ENEMY_DETECT_RANGE,
  ENEMY_SPEED,
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
  OVERDRIVE_COIN_MULT,
  OVERDRIVE_COMBO_BREAK_TIME,
  OVERDRIVE_DASH_GAIN,
  OVERDRIVE_DURATION,
  OVERDRIVE_MAX,
  OVERDRIVE_SPEED_MULT,
  OVERDRIVE_STOMP_GAIN,
  OVERDRIVE_WALLJUMP_GAIN,
  PISTON_BLAST_DURATION,
  PISTON_CHARGE_DURATION,
  PISTON_CYCLE,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  ROOTHOOK_DAMPING,
  ROOTHOOK_MAX_ANGULAR_VEL,
  ROOTHOOK_PUMP_ACCEL,
  ROOTHOOK_RANGE,
  ROOTHOOK_SWING_GRAVITY,
  SPORE_AMPLITUDE,
  SPORE_PERIOD,
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
  WALL_SLIDE_FALL_MULT,
  WALLJUMP_VX,
} from './constants';
import {
  BioCoil,
  Boss,
  CogPickup,
  EffectEvent,
  EffectKind,
  GamePhase,
  GameState,
  InputState,
  Level,
  Platform,
  Player,
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
      dashTimer: 0,
      dashCooldown: 0,
      airDashAvailable: true,
      overdriveGauge: 0,
      comboIdleFor: 0,
      overdriveTimer: 0,
      grappling: false,
      grappleAnchorX: 0,
      grappleAnchorY: 0,
      grappleAngle: 0,
      grappleAngularVel: 0,
      grappleRadius: 0,
      equippedHead: null,
      equippedBody: null,
      equippedFoot: null,
      steamBoostTimer: 0,
      mirrorTrail: [],
      touchingWall: 0,
    },
    enemies: level.enemies.map((e) => ({ ...e })),
    coins: level.coins.map((c) => ({ ...c })),
    score: 0,
    lives: 3,
    phase: 'playing',
    sporeSprites: level.sporeSprites.map((s) => ({ ...s })),
    pressurePistons: level.pressurePistons.map((p) => ({ ...p })),
    bioCoils: level.bioCoils.map((c) => ({ ...c })),
    steamBlowers: level.steamBlowers.map((b) => ({ ...b })),
    cogPickups: level.cogPickups.map((c) => ({ ...c })),
    boss: { ...level.boss },
    portalActivated: false,
    checkpointIndex: 0,
    effects: [],
    effectSeq: 0,
  };
}

function rectCenter(r: Rect): { x: number; y: number } {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

// Shared by every damage source (enemies, Bio-Coil, Steam Blower, Pressure
// Piston, falling into a pit): mutates `player` in place and returns the new
// life count. Callers decide *whether* a hit applies (most gate it behind
// invulnerableFor <= 0; a pit fall doesn't), this just applies one uniformly.
function applyHit(player: Player, lives: number, respawnPoint: { x: number; y: number }): number {
  lives -= 1;
  player.invulnerableFor = INVULNERABLE_TIME;
  if (lives > 0) {
    player.x = respawnPoint.x;
    player.y = respawnPoint.y;
    player.vx = 0;
    player.vy = 0;
    // Fresh trail after any respawn, so a second hit within COG_MIRROR_TRAIL_SECONDS
    // can't rewind to a stale pre-respawn position.
    player.mirrorTrail = [];
  }
  return lives;
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

export function isPistonDangerous(piston: PressurePiston): boolean {
  return piston.phase >= PISTON_CHARGE_DURATION && piston.phase < PISTON_CHARGE_DURATION + PISTON_BLAST_DURATION;
}

function stepBioCoils(prev: BioCoil[], player: Rect, dt: number): BioCoil[] {
  return prev.map((c) => {
    if (!c.alive) return c;

    if (c.phase === 'coiled') {
      const dx = player.x + player.width / 2 - (c.homeX + c.width / 2);
      if (Math.abs(dx) > BIOCOIL_RANGE) return c;
      // Every leap has a short, readable windup. The player should lose only
      // after missing a cue, never because an invisible mode changed.
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

// Cycles idle -> telegraph -> attack -> vulnerable -> idle on a fixed timer,
// independent of the player (the fight is a rhythm to learn, not a reaction
// to player position) — same shape as the Steam Blower's timer-driven phases.
const BOSS_PHASE_DURATIONS: Record<Boss['phase'], number> = {
  idle: BOSS_IDLE_DURATION,
  telegraph: BOSS_TELEGRAPH_DURATION,
  attack: BOSS_ATTACK_DURATION,
  vulnerable: BOSS_VULNERABLE_DURATION,
};
const BOSS_PHASE_ORDER: Boss['phase'][] = ['idle', 'telegraph', 'attack', 'vulnerable'];

function stepBoss(boss: Boss, dt: number): Boss {
  if (!boss.alive) return boss;
  const timer = boss.timer + dt;
  const duration = BOSS_PHASE_DURATIONS[boss.phase];
  if (timer < duration) return { ...boss, timer };
  const nextPhase = BOSS_PHASE_ORDER[(BOSS_PHASE_ORDER.indexOf(boss.phase) + 1) % BOSS_PHASE_ORDER.length];
  return { ...boss, phase: nextPhase, timer: 0 };
}

export function isBossAttackActive(boss: Boss): boolean {
  return boss.alive && boss.phase === 'attack';
}

export function isBossVulnerable(boss: Boss): boolean {
  return boss.alive && boss.phase === 'vulnerable';
}

export function stepGame(prev: GameState, input: InputState, level: Level, dt: number): GameState {
  if (prev.phase !== 'playing') return prev;

  const player = { ...prev.player };

  // Decided from the pre-frame checkpoint index, consistent with the rest of
  // this function's "pre-frame state decides this frame's behavior" pattern:
  // every respawn-on-death site below sends the player here, not always the
  // absolute level start. Mirror Cog overrides this with the oldest point in
  // its rolling trail, when one is available.
  const respawnPoint =
    prev.player.equippedHead === 'mirror' && prev.player.mirrorTrail.length > 0
      ? prev.player.mirrorTrail[0]
      : level.checkpoints[prev.checkpointIndex];

  // Overdrive: accumulated across dash/stomp events this frame, applied to the
  // combo gauge at the end of the function (after every hazard resolution
  // block below has had a chance to add to it).
  let gaugeGain = 0;

  // Decided from the pre-frame timer, matching the slow/dash pattern below:
  // this frame's speed and jump power reflect whether
  // Overdrive was already active going into it.
  const overdriveActive = prev.player.overdriveTimer > 0;

  // Spore Sprite proximity slow: decided from the pre-frame debuff timer so
  // this frame's move speed matches what's shown (no one-frame mismatch).
  // Spring Cog (foot slot) boosts jump height; hoisted above the Root-Hook
  // block so a Cannon Jump release (Root-Hook Cog + Spring) can reuse the
  // same boosted value.
  const moveSpeed = (prev.player.slowFor > 0 ? MOVE_SPEED * SPORE_SLOW_FACTOR : MOVE_SPEED) * (overdriveActive ? OVERDRIVE_SPEED_MULT : 1);
  const jumpVelocity =
    JUMP_VELOCITY * (overdriveActive ? OVERDRIVE_SPEED_MULT : 1) * (prev.player.equippedFoot === 'spring' ? COG_SPRING_JUMP_MULT : 1);

  // The boss (while alive) is solid, unlike every other monster in this file —
  // it physically blocks the path to the arena's far side instead of being a
  // walk-through hazard, so defeating it is the only way past. Decided from
  // prev.boss.alive (this frame's stomp resolution, below, can't remove its
  // own blocking mid-frame).
  const platforms: (Platform | Boss)[] = [...level.platforms, ...(prev.boss.alive ? [prev.boss] : [])];

  // Same decay pattern as corpse platforms, for the read-only effect log
  // consumed by particle-burst components — physics never reads this back.
  const decayedEffects: EffectEvent[] = prev.effects
    .map((fx) => ({ ...fx, timeLeft: fx.timeLeft - dt }))
    .filter((fx) => fx.timeLeft > 0);
  const newEffects: EffectEvent[] = [];
  let effectSeq = prev.effectSeq;
  const pushEffect = (kind: EffectKind, x: number, y: number) => {
    newEffects.push({ id: `fx-${effectSeq}`, kind, x, y, timeLeft: EFFECT_DURATION });
    effectSeq++;
  };

  // Root-Hook: attach on demand to a nearby fixed root point, then a simple
  // pendulum takes over position/velocity entirely (no normal movement,
  // gravity, or platform collision) until the button is released, at which
  // point the last tangential velocity carries straight into normal physics
  // next frame — "관성이 그대로 점프에 가산된다" from the GDD's control spec.
  if (!player.grappling && input.grappleHeld) {
    const pc = rectCenter(player);
    const attachRange = player.equippedBody === 'rootHookCog' ? ROOTHOOK_RANGE * COG_ROOTHOOK_RANGE_MULT : ROOTHOOK_RANGE;
    const anchor = level.rootPoints.find((r) => {
      const rc = rectCenter(r);
      return Math.hypot(rc.x - pc.x, rc.y - pc.y) <= attachRange;
    });
    if (anchor) {
      const rc = rectCenter(anchor);
      player.grappling = true;
      player.grappleAnchorX = rc.x;
      player.grappleAnchorY = rc.y;
      player.grappleRadius = Math.max(20, Math.hypot(pc.x - rc.x, pc.y - rc.y));
      player.grappleAngle = Math.atan2(pc.x - rc.x, pc.y - rc.y);
      player.grappleAngularVel = 0;
    }
  }

  let grappledThisFrame = false;
  if (player.grappling) {
    if (!input.grappleHeld) {
      player.grappling = false; // released; vx/vy already hold last frame's tangential velocity
    } else if (input.jumpPressed && player.equippedBody === 'rootHookCog') {
      // Cannon Jump synergy (Root-Hook Cog + Spring Cog): a mid-swing jump
      // detaches early, keeps the swing's tangential vx, and fires a fresh
      // boosted upward jump instead of just releasing.
      player.grappling = false;
      player.vy = jumpVelocity * (player.equippedFoot === 'spring' ? COG_CANNON_JUMP_MULT : 1);
      player.onGround = false;
    } else {
      const pump = input.right ? ROOTHOOK_PUMP_ACCEL : input.left ? -ROOTHOOK_PUMP_ACCEL : 0;
      const angularAccel = -(ROOTHOOK_SWING_GRAVITY / player.grappleRadius) * Math.sin(player.grappleAngle) + pump;
      player.grappleAngularVel = clamp(
        (player.grappleAngularVel + angularAccel * dt) * ROOTHOOK_DAMPING,
        -ROOTHOOK_MAX_ANGULAR_VEL,
        ROOTHOOK_MAX_ANGULAR_VEL
      );
      player.grappleAngle += player.grappleAngularVel * dt;
      player.x = player.grappleAnchorX + player.grappleRadius * Math.sin(player.grappleAngle) - player.width / 2;
      player.y = player.grappleAnchorY + player.grappleRadius * Math.cos(player.grappleAngle) - player.height / 2;
      player.vx = player.grappleRadius * player.grappleAngularVel * Math.cos(player.grappleAngle);
      player.vy = -player.grappleRadius * player.grappleAngularVel * Math.sin(player.grappleAngle);
      player.facing = player.vx >= 0 ? 1 : -1;
      player.onGround = false;
      grappledThisFrame = true;
    }
  }

  // Set inside the vertical collision loop below (landing on the boss
  // specifically, not just any platform); read later once the stepped boss
  // is available, alongside the other monsters' hit/stomp resolution.
  let landedOnBoss = false;

  if (!grappledThisFrame) {
    // Dash: a fixed-velocity horizontal burst with brief invincibility (per the
    // GDD's control spec). One charge while airborne, refilled on landing;
    // grounded dashes are free but everything shares a short cooldown so
    // mashing the button can't produce near-permanent invulnerability.
    player.dashTimer = Math.max(0, prev.player.dashTimer - dt);
    player.dashCooldown = Math.max(0, prev.player.dashCooldown - dt);
    const canDash = player.dashTimer <= 0 && player.dashCooldown <= 0 && (player.onGround || player.airDashAvailable);
    if (input.dashPressed && canDash) {
      player.dashTimer = DASH_DURATION;
      player.dashCooldown = DASH_COOLDOWN;
      if (!player.onGround) player.airDashAvailable = false;
      player.invulnerableFor = Math.max(player.invulnerableFor, DASH_INVULN);
      gaugeGain += OVERDRIVE_DASH_GAIN;
    }

    // Steam Boost Cog (foot slot): extra fixed-velocity coast once the dash
    // itself ends, decided from the pre-frame timer just like the dash timers
    // above. Detects the dash-just-ended edge from prev's timer.
    player.steamBoostTimer = Math.max(0, prev.player.steamBoostTimer - dt);
    if (prev.player.dashTimer > 0 && player.dashTimer <= 0 && player.equippedFoot === 'steamBoost') {
      player.steamBoostTimer = COG_STEAMBOOST_EXTRA_DURATION;
    }

    if (player.dashTimer > 0) {
      player.vx = player.facing * DASH_SPEED;
      player.vy = 0;
    } else if (player.steamBoostTimer > 0) {
      // Unlike the full dash freeze, gravity keeps acting during the coast tail.
      player.vx = player.facing * DASH_SPEED;
      player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL_SPEED);
    } else {
      // Air Control: while airborne, horizontal input is scaled down (per the
      // GDD's control spec) rather than granting full ground speed instantly.
      const groundedMoveSpeed = player.onGround ? moveSpeed : moveSpeed * AIR_CONTROL_MULT;
      if (input.left && !input.right) {
        player.vx = -groundedMoveSpeed;
        player.facing = -1;
      } else if (input.right && !input.left) {
        player.vx = groundedMoveSpeed;
        player.facing = 1;
      } else if (player.vx > 0) {
        player.vx = Math.max(0, player.vx - FRICTION * dt);
      } else if (player.vx < 0) {
        player.vx = Math.min(0, player.vx + FRICTION * dt);
      }

      if (input.jumpPressed && player.onGround) {
        player.vy = jumpVelocity;
        player.onGround = false;
      } else if (input.jumpPressed && player.touchingWall !== 0) {
        // Wall-jump: uses the pre-frame wall-touch side (set by last frame's
        // horizontal collision below), same "prev state decides this frame"
        // pattern as the grounded jump check just above.
        player.vx = player.touchingWall * WALLJUMP_VX * (player.equippedFoot === 'spring' ? COG_WALLJUMP_HORIZ_MULT : 1);
        player.vy = jumpVelocity;
        player.facing = player.touchingWall;
        player.touchingWall = 0;
        gaugeGain += OVERDRIVE_WALLJUMP_GAIN;
      }

      player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL_SPEED);
    }

    // Horizontal movement + collision. Also detects wall contact: any airborne
    // collision that stops horizontal movement counts as a wall (pit edges and
    // platform sides alike — there's no separate "wall" object type). wallDir
    // is stored as the escape direction (away from the wall), not the wall's
    // side, so a wall-jump can just do `vx = touchingWall * WALLJUMP_VX`.
    let wallDir: -1 | 0 | 1 = 0;
    player.x += player.vx * dt;
    for (const plat of platforms) {
      if (rectIntersect(player, plat)) {
        if (player.vx > 0) {
          player.x = plat.x - player.width;
          if (!player.onGround) wallDir = -1;
        } else if (player.vx < 0) {
          player.x = plat.x + plat.width;
          if (!player.onGround) wallDir = 1;
        }
        player.vx = 0;
      }
    }
    player.x = clamp(player.x, 0, level.worldWidth - player.width);
    player.touchingWall = wallDir;
    if (wallDir !== 0 && player.vy > MAX_FALL_SPEED * WALL_SLIDE_FALL_MULT) {
      player.vy = MAX_FALL_SPEED * WALL_SLIDE_FALL_MULT;
    }

    // Vertical movement + collision. Branching purely on player.vy's sign
    // ("positive = landing on top, negative = bonked a ceiling from below")
    // ordinarily matches how the player actually approached the platform —
    // but a stomp bounce can leave vy pointing the "wrong" way relative to a
    // nearby platform. Guarding each branch with the pre-move
    // position confirms the player was actually on that side beforehand.
    player.onGround = false;
    const preMoveBottom = player.y + player.height;
    player.y += player.vy * dt;
    for (const plat of platforms) {
      if (rectIntersect(player, plat)) {
        if (player.vy > 0 && preMoveBottom <= plat.y) {
          player.y = plat.y - player.height;
          player.vy = 0;
          player.onGround = true;
          if ('hp' in plat) landedOnBoss = true;
        } else if (player.vy < 0 && preMoveBottom - player.height >= plat.y + plat.height) {
          player.y = plat.y + plat.height;
          player.vy = 0;
        }
      }
    }

    if (player.onGround || player.touchingWall !== 0) {
      player.airDashAvailable = true;
    }
  }

  if (player.invulnerableFor > 0) {
    player.invulnerableFor = Math.max(0, player.invulnerableFor - dt);
  }

  // Enemy patrol / charge. Detection is always active, so the red alert cue
  // always means the same thing: the beetle is about to rush the player.
  // Uses this frame's already-updated player position (the movement block
  // above has already run), same as the stomp/hit checks just below it.
  const playerCenterX = player.x + player.width / 2;
  const enemies = prev.enemies.map((e) => {
    if (!e.alive) return e;

    const eCenterX = e.x + e.width / 2;
    const detects = Math.abs(playerCenterX - eCenterX) <= ENEMY_DETECT_RANGE;
    let chargeDir = e.chargeDir;
    if (detects && chargeDir === 0) {
      chargeDir = playerCenterX < eCenterX ? -1 : 1;
    } else if (!detects) {
      chargeDir = 0;
    }

    const patrolSpeed = ENEMY_SPEED;
    const dir: 1 | -1 = chargeDir !== 0 ? chargeDir : e.vx >= 0 ? 1 : -1;
    const speed = chargeDir !== 0 ? ENEMY_CHARGE_SPEED : patrolSpeed;

    let nx = e.x + dir * speed * dt;
    let vx = dir * speed;
    if (nx < e.minX) {
      nx = e.minX;
      vx = Math.abs(vx);
      chargeDir = 0; // hit a patrol bound mid-charge: turn around and resume patrol
    } else if (nx + e.width > e.maxX) {
      nx = e.maxX - e.width;
      vx = -Math.abs(vx);
      chargeDir = 0;
    }
    return { ...e, x: nx, vx, chargeDir };
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
      gaugeGain += OVERDRIVE_STOMP_GAIN;
      pushEffect('impact', e.x + e.width / 2, e.y);
      return { ...e, alive: false };
    }

    if (player.invulnerableFor <= 0) {
      pushEffect('hit', player.x + player.width / 2, player.y + player.height / 2);
      lives = applyHit(player, lives, respawnPoint);
    }
    return e;
  });

  const bioCoilsStepped = stepBioCoils(prev.bioCoils, prev.player, dt);
  const resolvedBioCoils = bioCoilsStepped.map((c) => {
    if (!c.alive) return c;
    if (!rectIntersect(player, c)) return c;

    const isStomp = wasFalling && prevBottom <= c.y + STOMP_TOLERANCE;

    if (c.phase === 'landed' && isStomp) {
      player.vy = STOMP_BOUNCE;
      score += 100;
      gaugeGain += OVERDRIVE_STOMP_GAIN;
      pushEffect('impact', c.x + c.width / 2, c.y);
      return { ...c, alive: false };
    }

    // Stomping while coiled/winding up/mid-leap doesn't defeat it — the
    // spring rejects the player's weight instead of yielding to it, dealing
    // damage same as any other hit (which already sends the player back to
    // the level start, so there's no separate "bounce" velocity to track).
    if (player.invulnerableFor <= 0) {
      pushEffect('hit', player.x + player.width / 2, player.y + player.height / 2);
      lives = applyHit(player, lives, respawnPoint);
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
        pushEffect('hit', player.x + player.width / 2, player.y + player.height / 2);
        lives = applyHit(player, lives, respawnPoint);
      }
    }

    if (!rectIntersect(player, b)) return b;

    const isStomp = wasFalling && prevBottom <= b.y + STOMP_TOLERANCE;

    if (isStomp) {
      player.vy = STOMP_BOUNCE;
      pushEffect('impact', b.x + b.width / 2, b.y);
      gaugeGain += OVERDRIVE_STOMP_GAIN;
      const hp = b.hp - 1;
      if (hp <= 0) {
        score += 300;
        return { ...b, hp: 0, alive: false };
      }
      score += 50;
      return { ...b, hp };
    }

    if (player.invulnerableFor <= 0) {
      pushEffect('hit', player.x + player.width / 2, player.y + player.height / 2);
      lives = applyHit(player, lives, respawnPoint);
    }
    return b;
  });

  // Boss: solid while alive (handled above, in the platform collision list),
  // so touching its sides just stops the player like a wall. The two ways it
  // actually interacts are the wide attack-phase damage zone and stomping it
  // from above during its vulnerable phase (detected via landedOnBoss, set
  // in the vertical collision loop above, since a solid landing resolves to
  // flush contact rather than overlap).
  let boss = stepBoss(prev.boss, dt);
  if (boss.alive) {
    if (isBossAttackActive(boss)) {
      const zone: Rect = { x: boss.x - BOSS_ATTACK_RANGE, y: boss.y, width: boss.width + BOSS_ATTACK_RANGE * 2, height: boss.height };
      if (rectIntersect(player, zone) && player.invulnerableFor <= 0) {
        pushEffect('hit', player.x + player.width / 2, player.y + player.height / 2);
        lives = applyHit(player, lives, respawnPoint);
        const bossCenter = boss.x + boss.width / 2;
        player.vx = (player.x + player.width / 2 < bossCenter ? -1 : 1) * BOSS_ATTACK_KNOCKBACK;
      }
    }
    if (landedOnBoss) {
      player.vy = STOMP_BOUNCE;
      if (isBossVulnerable(boss)) {
        pushEffect('impact', boss.x + boss.width / 2, boss.y);
        gaugeGain += OVERDRIVE_STOMP_GAIN;
        const hp = boss.hp - 1;
        if (hp <= 0) {
          score += 1000;
          boss = { ...boss, hp: 0, alive: false };
        } else {
          score += 100;
          boss = { ...boss, hp };
        }
      }
    }
  }

  const pressurePistons = stepPressurePistons(prev.pressurePistons, dt);
  for (const piston of pressurePistons) {
    if (!isPistonDangerous(piston)) continue;
    if (!rectIntersect(player, piston)) continue;
    if (player.invulnerableFor <= 0) {
      pushEffect('hit', player.x + player.width / 2, player.y + player.height / 2);
      lives = applyHit(player, lives, respawnPoint);
    }
  }

  // Hoisted above resolvedCoins so Magnet Cog can use it for radius-based
  // pickup; the Spore Sprite proximity check further below reuses it too.
  const playerCenter = rectCenter(player);

  const resolvedCoins = prev.coins.map((c) => {
    if (c.collected) return c;
    const inMagnetRange =
      player.equippedBody === 'magnet' && Math.hypot(rectCenter(c).x - playerCenter.x, rectCenter(c).y - playerCenter.y) <= COG_MAGNET_RADIUS;
    if (rectIntersect(player, c) || inMagnetRange) {
      score += overdriveActive ? 10 * OVERDRIVE_COIN_MULT : 10;
      pushEffect('pickup', c.x + c.width / 2, c.y + c.height / 2);
      return { ...c, collected: true };
    }
    return c;
  });

  const resolvedCogPickups: CogPickup[] = prev.cogPickups.map((c) => {
    if (c.collected) return c;
    if (!rectIntersect(player, c)) return c;
    if (c.cogType === 'spring' || c.cogType === 'steamBoost') {
      player.equippedFoot = c.cogType;
    } else if (c.cogType === 'magnet' || c.cogType === 'rootHookCog') {
      player.equippedBody = c.cogType;
    } else if (c.cogType === 'mirror') {
      player.equippedHead = c.cogType;
    }
    pushEffect('gearPickup', c.x + c.width / 2, c.y + c.height / 2);
    return { ...c, collected: true };
  });

  const resolvedSporeSprites = stepSporeSprites(prev.sporeSprites, dt).map((s) => {
    if (!s.alive) return s;
    // Only a dash's invincibility frames let the player punch through it —
    // normal contact never defeats it, matching the design doc.
    if (player.dashTimer > 0 && rectIntersect(player, s)) {
      score += 150;
      pushEffect('impact', s.x + s.width / 2, s.y + s.height / 2);
      return { ...s, alive: false };
    }
    return s;
  });
  const sporeRadius = SPORE_RADIUS_WILD;
  const nearSporeSprite = resolvedSporeSprites.some((s) => {
    if (!s.alive) return false;
    const c = rectCenter(s);
    return Math.hypot(c.x - playerCenter.x, c.y - playerCenter.y) <= sporeRadius;
  });
  player.slowFor = nearSporeSprite ? SPORE_SLOW_DURATION : Math.max(0, prev.player.slowFor - dt);

  // Mirror Cog (head slot): maintains a rolling position trail while equipped,
  // used above as an alternate respawn point. Aged from pre-frame entries so
  // this frame's own position always starts at age 0.
  if (player.equippedHead === 'mirror') {
    const aged = prev.player.mirrorTrail
      .map((t) => ({ ...t, age: t.age + dt }))
      .filter((t) => t.age <= COG_MIRROR_TRAIL_SECONDS);
    aged.push({ x: player.x, y: player.y, age: 0 });
    player.mirrorTrail = aged;
  } else {
    player.mirrorTrail = [];
  }

  // Overdrive gauge: filled by this frame's dash/stomp gains (accumulated
  // above), reset if the combo chain has gone idle too long, and converted
  // into an active boost once full.
  let overdriveGauge = prev.player.overdriveGauge;
  let comboIdleFor = prev.player.comboIdleFor + dt;
  if (gaugeGain > 0) {
    overdriveGauge = Math.min(OVERDRIVE_MAX, overdriveGauge + gaugeGain);
    comboIdleFor = 0;
  } else if (comboIdleFor > OVERDRIVE_COMBO_BREAK_TIME) {
    overdriveGauge = 0;
  }
  player.overdriveTimer = Math.max(0, prev.player.overdriveTimer - dt);
  if (overdriveGauge >= OVERDRIVE_MAX && player.overdriveTimer <= 0) {
    player.overdriveTimer = OVERDRIVE_DURATION;
    overdriveGauge = 0;
  }
  player.overdriveGauge = overdriveGauge;
  player.comboIdleFor = comboIdleFor;

  if (player.y > DEATH_Y) {
    lives = applyHit(player, lives, respawnPoint);
  }

  if (lives <= 0) {
    phase = 'gameover';
  } else if (!boss.alive) {
    // Defeating the boss is the only way to win — it physically blocks the
    // path to the (now purely decorative) flag while alive, so there's no
    // separate flag-touch win path to keep in sync with this.
    phase = 'win';
  }

  // One-time crossing effect the first frame the player passes the portal
  // into the boss arena — purely cosmetic, doesn't gate anything (the boss
  // itself, not the portal, is what blocks progress).
  let portalActivated = prev.portalActivated;
  if (!portalActivated && player.x + player.width > level.portal.x) {
    portalActivated = true;
    pushEffect('impact', level.portal.x + level.portal.width / 2, level.portal.y + level.portal.height / 2);
  }

  // Advance past any checkpoint(s) now behind the player. Using the final
  // (post-respawn-if-any) position is safe: a death this same frame snaps
  // player.x back to respawnPoint.x, which by construction never reaches the
  // next checkpoint's x, so this can't accidentally skip one on a death frame.
  let checkpointIndex = prev.checkpointIndex;
  while (checkpointIndex + 1 < level.checkpoints.length && player.x >= level.checkpoints[checkpointIndex + 1].x) {
    checkpointIndex++;
  }

  return {
    player,
    enemies: resolvedEnemies,
    coins: resolvedCoins,
    score,
    lives,
    phase,
    sporeSprites: resolvedSporeSprites,
    pressurePistons,
    bioCoils: resolvedBioCoils,
    steamBlowers: resolvedSteamBlowers,
    cogPickups: resolvedCogPickups,
    boss,
    portalActivated,
    checkpointIndex,
    effects: [...decayedEffects, ...newEffects],
    effectSeq,
  };
}

export function computeCameraX(playerX: number, viewportWidth: number, worldWidth: number): number {
  return clamp(playerX - viewportWidth / 2, 0, Math.max(0, worldWidth - viewportWidth));
}
