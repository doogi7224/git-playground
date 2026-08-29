import {
  AIR_CONTROL_MULT,
  ARROW_BUNDLE_ARROWS,
  ARROW_COOLDOWN,
  ARROW_HEIGHT,
  ARROW_LIFETIME,
  ARROW_SPEED,
  ARROW_WIDTH,
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
  CHESTNUT_ROLLER_COOLDOWN,
  CHESTNUT_ROLLER_DETECT_RANGE,
  CHESTNUT_ROLLER_RECOVER_DURATION,
  CHESTNUT_ROLLER_ROLL_DURATION,
  CHESTNUT_ROLLER_ROLL_SPEED,
  CHESTNUT_ROLLER_WINDUP_DURATION,
  COG_MAGNET_RADIUS,
  COG_MAGNET_DURATION,
  COG_SPRING_JUMP_MULT,
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
  FRICTION,
  GRAVITY,
  INVULNERABLE_TIME,
  JUMP_VELOCITY,
  JUMPER_INTERVAL,
  JUMPER_LAUNCH_VX,
  JUMPER_LAUNCH_VY,
  JUMPER_WINDUP_DURATION,
  LIFE_BLOOM_LIVES,
  LOOT_REVEAL_DURATION,
  MAX_FALL_SPEED,
  MOVE_SPEED,
  RELIC_BOW_MAX_ARROWS,
  RELIC_BOW_STARTING_ARROWS,
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
  SEED_HEIGHT,
  SEED_LIFETIME,
  SEED_SPEED,
  SEED_WIDTH,
  SPORE_AMPLITUDE,
  SPORE_PERIOD,
  SPORE_RADIUS_WILD,
  SPORE_SLOW_DURATION,
  SPORE_SLOW_FACTOR,
  STARTING_LIVES,
  STOMP_BOUNCE,
  STOMP_TOLERANCE,
  SUNSEED_BURST_SCORE,
  TURRET_CHARGE_DURATION,
  TURRET_FIRE_INTERVAL,
  TURRET_MAX_SEEDS,
  WALL_SLIDE_FALL_MULT,
  WALLJUMP_VX,
} from './constants';
import {
  Arrow,
  BioCoil,
  Boss,
  ChestnutRoller,
  CogPickup,
  EffectEvent,
  EffectKind,
  GamePhase,
  GameState,
  InputState,
  Jumper,
  Level,
  LootReveal,
  Platform,
  Player,
  PressurePiston,
  Rect,
  SeedProjectile,
  SporeSprite,
  TreasureCache,
  Turret,
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
      grappling: false,
      grappleAnchorX: 0,
      grappleAnchorY: 0,
      grappleAngle: 0,
      grappleAngularVel: 0,
      grappleRadius: 0,
      equippedHead: null,
      equippedBody: null,
      equippedFoot: null,
      magnetFor: 0,
      shieldCharges: 0,
      touchingWall: 0,
      hasBow: false,
      arrowCooldown: 0,
      arrows: 0,
      maxArrows: 0,
    },
    enemies: level.enemies.map((e) => ({ ...e })),
    coins: level.coins.map((c) => ({ ...c })),
    score: 0,
    lives: 3,
    phase: 'playing',
    sporeSprites: level.sporeSprites.map((s) => ({ ...s })),
    pressurePistons: level.pressurePistons.map((p) => ({ ...p })),
    bioCoils: level.bioCoils.map((c) => ({ ...c })),
    cogPickups: level.cogPickups.map((c) => ({ ...c })),
    boss: { ...level.boss },
    bowPickup: { ...level.bowPickup },
    arrows: [],
    jumpers: level.jumpers.map((j) => ({ ...j })),
    turrets: level.turrets.map((t) => ({ ...t })),
    chestnutRollers: level.chestnutRollers.map((r) => ({ ...r })),
    treasureCaches: level.treasureCaches.map((t) => ({ ...t })),
    lootReveals: [],
    lootRevealSeq: 0,
    seeds: [],
    arrowSeq: 0,
    seedSeq: 0,
    portalActivated: false,
    checkpointIndex: 0,
    effects: [],
    effectSeq: 0,
  };
}

function rectCenter(r: Rect): { x: number; y: number } {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

// Shared by every damage source: a Mirror shield prevents the next ordinary
// hit, while a pit always consumes a life so a fall cannot leave the player
// trapped below the level.
function applyHit(player: Player, lives: number, respawnPoint: { x: number; y: number }, canUseShield = true): number {
  if (canUseShield && player.shieldCharges > 0) {
    player.shieldCharges -= 1;
    player.invulnerableFor = INVULNERABLE_TIME;
    return lives;
  }
  lives -= 1;
  player.invulnerableFor = INVULNERABLE_TIME;
  if (lives > 0) {
    player.x = respawnPoint.x;
    player.y = respawnPoint.y;
    player.vx = 0;
    player.vy = 0;
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

// Cycles idle -> telegraph -> attack -> vulnerable -> idle on a fixed timer,
// independent of the player (the fight is a rhythm to learn, not a reaction
// to player position).
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

// Jumper: grounded -> windup (telegraph) -> airborne (forward arc within its
// authored platform span) -> grounded. No player-detection at all, per the
// design brief -- purely timer-driven.
function stepJumpers(prev: Jumper[], dt: number): Jumper[] {
  return prev.map((j) => {
    if (!j.alive) return j;
    if (j.phase === 'grounded') {
      const timer = j.timer + dt;
      if (timer < JUMPER_INTERVAL) return { ...j, timer };
      return { ...j, phase: 'windup', timer: 0 };
    }
    if (j.phase === 'windup') {
      const timer = j.timer + dt;
      if (timer < JUMPER_WINDUP_DURATION) return { ...j, timer };
      return {
        ...j,
        phase: 'airborne',
        vx: j.facing * JUMPER_LAUNCH_VX,
        vy: JUMPER_LAUNCH_VY,
        timer: 0,
      };
    }
    // 'airborne'
    const vy = j.vy + GRAVITY * dt;
    const y = j.y + vy * dt;
    let x = j.x + j.vx * dt;
    let vx = j.vx;
    let facing = j.facing;
    if (x < j.minX) {
      x = j.minX;
      vx = Math.abs(vx);
      facing = 1;
    } else if (x > j.maxX) {
      x = j.maxX;
      vx = -Math.abs(vx);
      facing = -1;
    }
    if (y >= j.groundY) {
      return { ...j, x, y: j.groundY, vx, vy: 0, facing, phase: 'grounded', timer: 0 };
    }
    return { ...j, x, vx, y, vy, facing };
  });
}

export function isTurretCharging(turret: Turret): boolean {
  return turret.alive && turret.timer >= TURRET_FIRE_INTERVAL - TURRET_CHARGE_DURATION;
}

// Turrets never move or take a player-position input each frame beyond
// deciding which way a shot fires -- same "lock a direction once" pattern
// as Cogmite's chargeDir and Bio-Coil's facing, not continuous homing.
// Skips spawning (but still resets its own timer, so it doesn't instantly
// retry) when the global seed cap is already full.
function stepTurrets(
  prev: Turret[],
  player: Rect,
  dt: number,
  existingSeedCount: number,
  startSeedSeq: number
): { turrets: Turret[]; newSeeds: SeedProjectile[]; nextSeedSeq: number } {
  let seedCount = existingSeedCount;
  let seedSeq = startSeedSeq;
  const newSeeds: SeedProjectile[] = [];
  const turrets = prev.map((t) => {
    if (!t.alive) return t;
    const timer = t.timer + dt;
    if (timer < TURRET_FIRE_INTERVAL) return { ...t, timer };
    if (seedCount < TURRET_MAX_SEEDS) {
      const center = t.x + t.width / 2;
      const dir: 1 | -1 = player.x + player.width / 2 < center ? -1 : 1;
      newSeeds.push({
        // A turret's timer is always ~TURRET_FIRE_INTERVAL at the moment it
        // fires, so deriving the id from it (as before) produced the same id
        // every cycle -- a monotonic per-GameState counter guarantees
        // uniqueness the same way arrowSeq/effectSeq/lootRevealSeq already do.
        id: `seed-${t.id}-${seedSeq}`,
        x: dir > 0 ? t.x + t.width : t.x - SEED_WIDTH,
        y: t.y + t.height / 2 - SEED_HEIGHT / 2,
        width: SEED_WIDTH,
        height: SEED_HEIGHT,
        vx: dir * SEED_SPEED,
        age: 0,
      });
      seedCount++;
      seedSeq++;
    }
    return { ...t, timer: 0 };
  });
  return { turrets, newSeeds, nextSeedSeq: seedSeq };
}

// Chestnut Roller: walk (patrol, vulnerable) -> windup (telegraph, locked
// facing, stationary) -> rolling (fast, arrow/stomp-immune, ends early on
// hitting its own patrol bound) -> recover (defenseless pause) -> walk with
// a cooldown before it can roll again. It only rolls toward a nearby,
// same-height player; otherwise it keeps patrolling.
function stepChestnutRollers(prev: ChestnutRoller[], player: Rect, dt: number): ChestnutRoller[] {
  return prev.map((r) => {
    if (!r.alive) return r;
    const cooldown = Math.max(0, r.cooldown - dt);

    if (r.phase === 'walk') {
      const timer = r.timer + dt;
      const rCenterX = r.x + r.width / 2;
      const playerCenterX = player.x + player.width / 2;
      const sameHeight = player.y < r.y + r.height && player.y + player.height > r.y;
      const inRange = Math.abs(playerCenterX - rCenterX) <= CHESTNUT_ROLLER_DETECT_RANGE;
      if (cooldown <= 0 && sameHeight && inRange) {
        const facing: 1 | -1 = playerCenterX < rCenterX ? -1 : 1;
        return { ...r, vx: 0, facing, phase: 'windup', timer: 0, cooldown };
      }

      let nx = r.x + r.vx * dt;
      let vx = r.vx;
      let facing = r.facing;
      if (nx < r.minX) {
        nx = r.minX;
        vx = Math.abs(vx);
        facing = 1;
      } else if (nx + r.width > r.maxX) {
        nx = r.maxX - r.width;
        vx = -Math.abs(vx);
        facing = -1;
      }
      return { ...r, x: nx, vx, facing, timer, cooldown };
    }

    if (r.phase === 'windup') {
      const timer = r.timer + dt;
      if (timer < CHESTNUT_ROLLER_WINDUP_DURATION) return { ...r, timer, cooldown };
      return { ...r, phase: 'rolling', timer: 0, vx: r.facing * CHESTNUT_ROLLER_ROLL_SPEED, cooldown };
    }

    if (r.phase === 'rolling') {
      const timer = r.timer + dt;
      let nx = r.x + r.vx * dt;
      let hitBound = false;
      if (nx < r.minX) {
        nx = r.minX;
        hitBound = true;
      } else if (nx + r.width > r.maxX) {
        nx = r.maxX - r.width;
        hitBound = true;
      }
      if (hitBound || timer >= CHESTNUT_ROLLER_ROLL_DURATION) {
        return { ...r, x: nx, vx: 0, phase: 'recover', timer: 0, cooldown };
      }
      return { ...r, x: nx, timer, cooldown };
    }

    // 'recover'
    const timer = r.timer + dt;
    if (timer < CHESTNUT_ROLLER_RECOVER_DURATION) return { ...r, timer, cooldown };
    return { ...r, phase: 'walk', timer: 0, cooldown: CHESTNUT_ROLLER_COOLDOWN };
  });
}

export function stepGame(prev: GameState, input: InputState, level: Level, dt: number): GameState {
  if (prev.phase !== 'playing') return prev;

  const player = { ...prev.player };

  player.magnetFor = Math.max(0, prev.player.magnetFor - dt);
  if (player.equippedBody === 'magnet' && player.magnetFor <= 0) {
    player.equippedBody = null;
  }

  // Decided from the pre-frame checkpoint index, consistent with the rest of
  // this function's "pre-frame state decides this frame's behavior" pattern:
  // every respawn-on-death site below sends the player here, not always the
  // absolute level start.
  const respawnPoint = level.checkpoints[prev.checkpointIndex];

  // Spore Sprite proximity slow: decided from the pre-frame debuff timer so
  // this frame's move speed matches what's shown (no one-frame mismatch).
  // Spring Cog (foot slot) boosts jump height.
  const moveSpeed = prev.player.slowFor > 0 ? MOVE_SPEED * SPORE_SLOW_FACTOR : MOVE_SPEED;
  const jumpVelocity =
    JUMP_VELOCITY * (prev.player.equippedFoot === 'spring' ? COG_SPRING_JUMP_MULT : 1);

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
    const anchor = level.rootPoints.find((r) => {
      const rc = rectCenter(r);
      return Math.hypot(rc.x - pc.x, rc.y - pc.y) <= ROOTHOOK_RANGE;
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

  // Root-Hook swinging bypasses platform collision entirely (see the comment
  // above), so a release can leave the player marginally overlapping a
  // platform's edge. Left alone, the next frame's directional collision
  // resolver (which assumes an object is approaching from outside, not
  // already embedded) snaps the player fully behind the platform's edge --
  // a large, jarring one-frame displacement instead of a small correction.
  // Push the player out along whichever axis needs the least movement to
  // clear the overlap, the instant grappling ends, so no frame ever renders
  // (or hands normal physics) an embedded position. Same "no clipping into
  // solid geometry" guarantee every other frame already provides; only the
  // penetration-depth math is new, not any movement speed or game rule.
  const resolveEmbeddedOverlap = () => {
    for (const plat of platforms) {
      if (!rectIntersect(player, plat)) continue;
      const overlapLeft = player.x + player.width - plat.x;
      const overlapRight = plat.x + plat.width - player.x;
      const overlapTop = player.y + player.height - plat.y;
      const overlapBottom = plat.y + plat.height - player.y;
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
      if (minOverlap === overlapLeft) player.x -= overlapLeft;
      else if (minOverlap === overlapRight) player.x += overlapRight;
      else if (minOverlap === overlapTop) player.y -= overlapTop;
      else player.y += overlapBottom;
    }
  };

  let grappledThisFrame = false;
  if (player.grappling) {
    if (!input.grappleHeld) {
      player.grappling = false; // released; vx/vy already hold last frame's tangential velocity
      resolveEmbeddedOverlap();
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
    }

    if (player.dashTimer > 0) {
      player.vx = player.facing * DASH_SPEED;
      player.vy = 0;
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

  // Relic Bow + Arrow: uses this frame's already-finalized player position/
  // facing (the movement block above has already run), same timing as the
  // enemy-detection block just below it. Arrows move first and drop any that
  // hit a wall/left the world/expired *before* the pickup/firing checks, so
  // a wall directly behind the muzzle can't immediately eat a freshly-fired
  // arrow on the same frame it spawns.
  let arrows = prev.arrows
    .map((a) => ({ ...a, x: a.x + a.vx * dt, age: a.age + dt }))
    .filter(
      (a) => a.age < ARROW_LIFETIME && a.x + a.width > 0 && a.x < level.worldWidth && !level.platforms.some((p) => rectIntersect(a, p))
    );

  // A single permanent pickup (see level.ts) -- contact grants it immediately,
  // matching CogPickup's "auto-equip on touch" pattern. No re-collection
  // possible once `collected`.
  let bowPickup = prev.bowPickup;
  if (!bowPickup.collected && rectIntersect(player, bowPickup)) {
    bowPickup = { ...bowPickup, collected: true };
    player.hasBow = true;
    player.arrows = RELIC_BOW_STARTING_ARROWS;
    player.maxArrows = RELIC_BOW_MAX_ARROWS;
    pushEffect('gearPickup', bowPickup.x + bowPickup.width / 2, bowPickup.y + bowPickup.height / 2);
  }

  // Firing: edge-triggered like jumpPressed/dashPressed (GameScreen resets it
  // after consuming), gated by hasBow, a short cooldown so mashing the attack
  // button can't produce a solid stream of arrows, and finite ammo (arrows is
  // 0 until the bow is picked up, so this also naturally blocks pre-pickup).
  player.arrowCooldown = Math.max(0, prev.player.arrowCooldown - dt);
  let arrowSeq = prev.arrowSeq;
  if (input.attackPressed && player.hasBow && player.arrowCooldown <= 0 && player.arrows > 0) {
    player.arrowCooldown = ARROW_COOLDOWN;
    player.arrows -= 1;
    arrows = [
      ...arrows,
      {
        id: `arrow-${arrowSeq}`,
        x: player.facing > 0 ? player.x + player.width : player.x - ARROW_WIDTH,
        y: player.y + player.height / 2 - ARROW_HEIGHT / 2,
        width: ARROW_WIDTH,
        height: ARROW_HEIGHT,
        vx: player.facing * ARROW_SPEED,
        age: 0,
      },
    ];
    arrowSeq++;
  }
  // Tracks which arrows already connected with something this frame so (a) a
  // single arrow can't hit two overlapping hazards at once and (b) it gets
  // spliced out of the final `arrows` list below instead of continuing on.
  const consumedArrowIds = new Set<string>();
  const findArrowHit = (target: Rect) => arrows.find((a) => !consumedArrowIds.has(a.id) && rectIntersect(a, target));

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

    const hitArrow = findArrowHit(e);
    if (hitArrow) {
      consumedArrowIds.add(hitArrow.id);
      score += 100;
      pushEffect('impact', e.x + e.width / 2, e.y);
      return { ...e, alive: false };
    }

    if (!rectIntersect(player, e)) return e;

    const isStomp = wasFalling && prevBottom <= e.y + STOMP_TOLERANCE;

    if (isStomp) {
      player.vy = STOMP_BOUNCE;
      score += 100;
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

    // Unlike a stomp (only lands a kill while 'landed'), an arrow defeats it
    // in any phase -- the ranged option trades the stomp's positional-timing
    // requirement for a more committed, always-works hit.
    const hitArrow = findArrowHit(c);
    if (hitArrow) {
      consumedArrowIds.add(hitArrow.id);
      score += 100;
      pushEffect('impact', c.x + c.width / 2, c.y);
      return { ...c, alive: false };
    }

    if (!rectIntersect(player, c)) return c;

    const isStomp = wasFalling && prevBottom <= c.y + STOMP_TOLERANCE;

    if (c.phase === 'landed' && isStomp) {
      player.vy = STOMP_BOUNCE;
      score += 100;
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

  // Chestnut Roller resolution: rolling is immune to both an arrow and a
  // stomp -- per the design brief, only contact damage still applies during
  // that window (same treatment any other solid hazard gets, not a kill
  // opportunity). windup/recover/walk are killable by either, same as every
  // other ground enemy.
  const chestnutRollersStepped = stepChestnutRollers(prev.chestnutRollers, prev.player, dt);
  const resolvedChestnutRollers = chestnutRollersStepped.map((r) => {
    if (!r.alive) return r;
    const invincible = r.phase === 'rolling';

    if (!invincible) {
      const hitArrow = findArrowHit(r);
      if (hitArrow) {
        consumedArrowIds.add(hitArrow.id);
        score += 100;
        pushEffect('impact', r.x + r.width / 2, r.y);
        return { ...r, alive: false };
      }
    }

    if (!rectIntersect(player, r)) return r;

    if (!invincible) {
      const isStomp = wasFalling && prevBottom <= r.y + STOMP_TOLERANCE;
      if (isStomp) {
        player.vy = STOMP_BOUNCE;
        score += 100;
        pushEffect('impact', r.x + r.width / 2, r.y);
        return { ...r, alive: false };
      }
    }

    if (player.invulnerableFor <= 0) {
      pushEffect('hit', player.x + player.width / 2, player.y + player.height / 2);
      lives = applyHit(player, lives, respawnPoint);
    }
    return r;
  });

  // Seeds: move existing ones, drop any that hit a wall/left the world/expired
  // -- same treatment as arrows above, just aimed the other way.
  let seeds = prev.seeds
    .map((s) => ({ ...s, x: s.x + s.vx * dt, age: s.age + dt }))
    .filter(
      (s) => s.age < SEED_LIFETIME && s.x + s.width > 0 && s.x < level.worldWidth && !level.platforms.some((p) => rectIntersect(s, p))
    );

  const jumpersStepped = stepJumpers(prev.jumpers, dt);
  const resolvedJumpers = jumpersStepped.map((j) => {
    if (!j.alive) return j;

    const hitArrow = findArrowHit(j);
    if (hitArrow) {
      consumedArrowIds.add(hitArrow.id);
      score += 100;
      pushEffect('impact', j.x + j.width / 2, j.y);
      return { ...j, alive: false };
    }

    if (!rectIntersect(player, j)) return j;
    const isStomp = wasFalling && prevBottom <= j.y + STOMP_TOLERANCE;
    if (isStomp) {
      player.vy = STOMP_BOUNCE;
      score += 100;
      pushEffect('impact', j.x + j.width / 2, j.y);
      return { ...j, alive: false };
    }
    if (player.invulnerableFor <= 0) {
      pushEffect('hit', player.x + player.width / 2, player.y + player.height / 2);
      lives = applyHit(player, lives, respawnPoint);
    }
    return j;
  });

  // Turrets decide their fire direction from this frame's player position
  // (stepTurrets), using the current seed count (post-movement/filtering,
  // pre-new-shots) against TURRET_MAX_SEEDS as the concurrency backstop.
  const turretStep = stepTurrets(prev.turrets, player, dt, seeds.length, prev.seedSeq);
  seeds = [...seeds, ...turretStep.newSeeds];
  const seedSeq = turretStep.nextSeedSeq;
  const resolvedTurrets = turretStep.turrets.map((t) => {
    if (!t.alive) return t;

    const hitArrow = findArrowHit(t);
    if (hitArrow) {
      consumedArrowIds.add(hitArrow.id);
      score += 100;
      pushEffect('impact', t.x + t.width / 2, t.y);
      return { ...t, alive: false };
    }

    if (!rectIntersect(player, t)) return t;
    const isStomp = wasFalling && prevBottom <= t.y + STOMP_TOLERANCE;
    if (isStomp) {
      player.vy = STOMP_BOUNCE;
      score += 100;
      pushEffect('impact', t.x + t.width / 2, t.y);
      return { ...t, alive: false };
    }
    if (player.invulnerableFor <= 0) {
      pushEffect('hit', player.x + player.width / 2, player.y + player.height / 2);
      lives = applyHit(player, lives, respawnPoint);
    }
    return t;
  });

  // A seed is destroyed by the same player actions that would destroy any
  // other hazard (stomp or arrow) -- per the design brief, "투사체와 적 모두
  // 스톰프 또는 화살로 대응 가능". Otherwise it deals contact damage like any
  // other hazard, respecting invulnerability.
  const resolvedSeeds = seeds.filter((seed) => {
    const hitArrow = findArrowHit(seed);
    const isStomp = wasFalling && prevBottom <= seed.y + STOMP_TOLERANCE && rectIntersect(player, seed);
    if (hitArrow || isStomp) {
      if (hitArrow) consumedArrowIds.add(hitArrow.id);
      if (isStomp) player.vy = STOMP_BOUNCE;
      score += 50;
      pushEffect('impact', seed.x + seed.width / 2, seed.y + seed.height / 2);
      return false;
    }
    if (rectIntersect(player, seed) && player.invulnerableFor <= 0) {
      pushEffect('hit', player.x + player.width / 2, player.y + player.height / 2);
      lives = applyHit(player, lives, respawnPoint);
      return false;
    }
    return true;
  });

  // Boss: solid while alive (handled above, in the platform collision list),
  // so touching its sides just stops the player like a wall. The two ways it
  // actually interacts are the wide attack-phase damage zone and stomping it
  // from above during its vulnerable phase (detected via landedOnBoss, set
  // in the vertical collision loop above, since a solid landing resolves to
  // flush contact rather than overlap).
  let boss = stepBoss(prev.boss, dt);
  if (boss.alive) {
    // Solid, so an arrow can't pass through it either way -- it's always
    // consumed on contact, but only actually damages during the same
    // vulnerable window a stomp requires (an alternative input, not a way to
    // bypass the fight's established timing).
    const hitArrow = findArrowHit(boss);
    if (hitArrow) {
      consumedArrowIds.add(hitArrow.id);
      if (isBossVulnerable(boss)) {
        pushEffect('impact', boss.x + boss.width / 2, boss.y);
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
      player.equippedBody === 'magnet' && player.magnetFor > 0 && Math.hypot(rectCenter(c).x - playerCenter.x, rectCenter(c).y - playerCenter.y) <= COG_MAGNET_RADIUS;
    if (rectIntersect(player, c) || inMagnetRange) {
      score += 10;
      pushEffect('pickup', c.x + c.width / 2, c.y + c.height / 2);
      return { ...c, collected: true };
    }
    return c;
  });

  const resolvedCogPickups: CogPickup[] = prev.cogPickups.map((c) => {
    if (c.collected) return c;
    if (!rectIntersect(player, c)) return c;
    if (c.cogType === 'spring') {
      player.equippedFoot = c.cogType;
    } else if (c.cogType === 'magnet') {
      player.equippedBody = c.cogType;
      player.magnetFor = COG_MAGNET_DURATION;
    } else if (c.cogType === 'mirror') {
      player.equippedHead = c.cogType;
      player.shieldCharges = 1;
    }
    pushEffect('gearPickup', c.x + c.width / 2, c.y + c.height / 2);
    return { ...c, collected: true };
  });

  // Treasure Cache: a Root Cache is a solid mystery block and opens when the
  // player's rising head reaches its underside. The platform pass above has
  // already snapped player.y to that underside and stopped upward velocity.
  // Relic Pods retain their arrow-only interaction.
  let lootRevealSeq = prev.lootRevealSeq;
  const newLootReveals: LootReveal[] = [];
  const resolvedTreasureCaches: TreasureCache[] = prev.treasureCaches.map((cache) => {
    let opened = false;
    if (cache.kind === 'rootCache') {
      const cacheBottom = cache.y + cache.height;
      const horizontalOverlap = player.x + player.width > cache.x && player.x < cache.x + cache.width;
      const hitFromBelow = prev.player.vy < 0
        && prev.player.y >= cacheBottom - 1
        && player.y <= cacheBottom + 1
        && horizontalOverlap;
      opened = !cache.opened && hitFromBelow;
    } else {
      if (cache.opened) return cache;
      const hitArrow = findArrowHit(cache);
      if (hitArrow) {
        consumedArrowIds.add(hitArrow.id);
        opened = true;
      }
    }
    if (!opened) return cache;

    if (cache.reward === 'sunseedBurst') {
      score += SUNSEED_BURST_SCORE;
    } else if (cache.reward === 'arrowBundle') {
      player.arrows = Math.min(player.maxArrows, player.arrows + ARROW_BUNDLE_ARROWS);
    } else if (cache.reward === 'lifeBloom') {
      lives = Math.min(STARTING_LIVES, lives + LIFE_BLOOM_LIVES);
    }
    pushEffect('pickup', cache.x + cache.width / 2, cache.y + cache.height / 2);
    newLootReveals.push({ id: `loot-${lootRevealSeq}`, reward: cache.reward, x: cache.x + cache.width / 2, y: cache.y, timeLeft: LOOT_REVEAL_DURATION });
    lootRevealSeq++;
    return { ...cache, opened: true };
  });
  const lootReveals = [
    ...prev.lootReveals.map((l) => ({ ...l, timeLeft: l.timeLeft - dt })).filter((l) => l.timeLeft > 0),
    ...newLootReveals,
  ];

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

  if (player.y > DEATH_Y) {
    lives = applyHit(player, lives, respawnPoint, false);
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
    cogPickups: resolvedCogPickups,
    boss,
    bowPickup,
    arrows: arrows.filter((a) => !consumedArrowIds.has(a.id)),
    jumpers: resolvedJumpers,
    turrets: resolvedTurrets,
    chestnutRollers: resolvedChestnutRollers,
    treasureCaches: resolvedTreasureCaches,
    lootReveals,
    lootRevealSeq,
    seeds: resolvedSeeds,
    arrowSeq,
    seedSeq,
    portalActivated,
    checkpointIndex,
    effects: [...decayedEffects, ...newEffects],
    effectSeq,
  };
}

export function computeCameraX(playerX: number, viewportWidth: number, worldWidth: number): number {
  return clamp(playerX - viewportWidth / 2, 0, Math.max(0, worldWidth - viewportWidth));
}
