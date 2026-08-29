export const TILE = 40;

export const GRAVITY = 1800; // px/s^2
// Tuned after real mobile play: normal running must leave room to read jumps
// and enemies. Dash remains the intentionally fast traversal action.
export const MOVE_SPEED = 160; // px/s
export const JUMP_VELOCITY = -675; // px/s; former Spring-level jump, now the base jump
export const STOMP_BOUNCE = -450; // px/s
export const STOMP_TOLERANCE = 8; // px of slack when checking if the player approached an enemy from above
export const MAX_FALL_SPEED = 900; // px/s
export const FRICTION = 900; // px/s^2, deceleration when no input
export const AIR_CONTROL_MULT = 0.85; // horizontal move speed while airborne, per the GDD's "Air Control" spec

export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 40;

export const ENEMY_WIDTH = 34;
export const ENEMY_HEIGHT = 30;
export const ENEMY_SPEED = 60; // px/s
// Cogmite detection/charge, per the monster design doc: it detects the player
// and switches to a straight-line 120px/s charge (no cliff avoidance — the
// doc calls luring it into a pit a valid strategy; this prototype keeps
// charges within the existing patrol bounds instead of adding fall physics
// for enemies, ending the charge at a bound rather than running off it).
export const ENEMY_CHARGE_SPEED = 120;
export const ENEMY_DETECT_RANGE = 160; // px; not given a number in the doc, a judgment call

export const COIN_SIZE = 22;
export const FLAG_WIDTH = 24;
export const FLAG_HEIGHT = 80;

export const VIEWPORT_HEIGHT = 220;
export const DEATH_Y = VIEWPORT_HEIGHT + 200;

export const STARTING_LIVES = 3;
export const INVULNERABLE_TIME = 1.2; // seconds after taking damage

export const DASH_SPEED = 480; // px/s, fixed horizontal burst (overrides normal move speed)
export const DASH_DURATION = 0.18; // seconds movement is locked to the dash burst
export const DASH_INVULN = 0.15; // seconds of invincibility granted by a dash (per the GDD's control spec)
export const DASH_COOLDOWN = 0.3; // seconds before another dash can start, to prevent spamming for near-permanent invulnerability


export const SPORE_SPRITE_WIDTH = 28;
export const SPORE_SPRITE_HEIGHT = 32;
export const SPORE_AMPLITUDE = 20; // px, vertical sine-wave travel
export const SPORE_PERIOD = 2.4; // seconds per full float cycle
export const SPORE_RADIUS_WILD = 80; // px, proximity radius in the sprite's natural (wild) state
export const SPORE_SLOW_DURATION = 2; // seconds the speed debuff lingers after leaving range
export const SPORE_SLOW_FACTOR = 0.85; // multiplier on MOVE_SPEED while slowed

export const PISTON_WIDTH = 26;
export const PISTON_HEIGHT = 46;
export const PISTON_CHARGE_DURATION = 0.3; // telegraph before the blast becomes dangerous
export const PISTON_BLAST_DURATION = 2.2; // dangerous window (charge + blast = the doc's 2.5s "steam blast" phase)
export const PISTON_REST_DURATION = 1.5;
export const PISTON_CYCLE =
  PISTON_CHARGE_DURATION + PISTON_BLAST_DURATION + PISTON_REST_DURATION;

export const BIOCOIL_WIDTH = 26;
export const BIOCOIL_HEIGHT = 30;
export const BIOCOIL_RANGE = 120; // px, distance that triggers a leap from 'coiled'
export const BIOCOIL_WINDUP_WILD = 0.4; // seconds; mechanical state skips windup entirely
export const BIOCOIL_LANDED_DURATION = 0.6; // defenseless window after landing
export const BIOCOIL_LEAP_VX_WILD = 180;
export const BIOCOIL_LAUNCH_VY_WILD = -520; // big, telegraphed arc

export const ROOTHOOK_RANGE = 90; // px, distance from a root point within which the grapple can attach
export const ROOTHOOK_SIZE = 18;
// Deliberately softer than normal GRAVITY for a controllable, slightly floaty swing feel
// rather than a fast, twitchy pendulum given the short radii involved.
export const ROOTHOOK_SWING_GRAVITY = 900;
export const ROOTHOOK_DAMPING = 0.999; // slight per-frame angular velocity decay, avoids perpetual motion
export const ROOTHOOK_PUMP_ACCEL = 8; // rad/s^2 added while holding a direction, to let the player pump the swing
export const ROOTHOOK_MAX_ANGULAR_VEL = 6; // rad/s, clamp to prevent runaway spin

// Gear Socket cogs, adapted as auto-equip-on-pickup passives for the rest of
// the current run (see the CogType comment in types.ts for the scoping note).
export const COG_MAGNET_RADIUS = 165; // body slot: px radius that starts pulling coins in
export const COG_MAGNET_PULL_SPEED = 420; // px/s; visibly draws a coin to the player
export const COG_MAGNET_DURATION = 30; // seconds; temporary collection aid, not a permanent equip
export const COG_MAGNET_WARNING_DURATION = 5; // HUD flashes during the final five seconds

// Wall-slide/wall-jump: per the GDD's control spec (fall-speed cap is specified
// numerically; push-off speed is not, so WALLJUMP_VX is a judgment call rather
// than a documented figure). Any airborne contact against a platform's side
// counts as a wall — there's no separate "wall" object type, just existing
// pit edges and ground/platform sides.
export const WALL_SLIDE_FALL_MULT = 0.45; // caps fall speed at 45% of MAX_FALL_SPEED while pressed against a wall
export const WALLJUMP_VX = 260; // px/s horizontal push-off away from the wall

// Portal: purely a level-transition marker into the boss arena, no collision
// logic of its own — just a rect the player crosses once, which plays a
// one-time effect burst (see `portalActivated` in GameState).
export const PORTAL_WIDTH = 40;
export const PORTAL_HEIGHT = 70;

// Boss (Area 3 finale): new content, not part of the original 5-monster
// roster, so these numbers have no prior established value to preserve —
// sized for a clear "final fight" silhouette. While alive, the boss is added to the solid
// collision platform list (see stepGame) so it physically blocks the path
// rather than being a walk-through hazard, matching how a boss arena reads.
export const BOSS_WIDTH = 90;
export const BOSS_HEIGHT = 110;
export const BOSS_HP = 5;
export const BOSS_IDLE_DURATION = 1.5; // safe to approach
export const BOSS_TELEGRAPH_DURATION = 1.0; // clear visual warning before the attack lands (CLAUDE.md 18: 예고 부족 방지)
export const BOSS_ATTACK_DURATION = 0.6; // one visible volley is released at its start
export const BOSS_VULNERABLE_DURATION = 1.5; // weak point exposed, stompable
export const BOSS_ATTACK_RANGE = 42; // px, a small close-range fallback; the visible volley is the main threat
export const BOSS_ATTACK_KNOCKBACK = 420; // px/s horizontal push, away from the boss
export const BOSS_VOLLEY_SPEED = 300;
export const BOSS_VOLLEY_VERTICAL_SPEED = 82;
export const BOSS_VOLLEY_LIFETIME = 1.1;

// EffectEvent lifetime: presentation-only (CLAUDE.md 19 — Effects), not a
// gameplay balance number. Sized to comfortably outlast the burst animations
// that render against these events before physics prunes them.
export const EFFECT_DURATION = 0.5;

// Relic Bow + Arrow: new content, one permanent pickup early in the level
// (see level.ts). No prior numbers to preserve.
export const BOW_PICKUP_SIZE = 24;
export const ARROW_WIDTH = 14;
export const ARROW_HEIGHT = 4;
export const ARROW_SPEED = 500; // px/s, faster than DASH_SPEED for a punchy ranged feel
export const ARROW_COOLDOWN = 0.35; // seconds between shots -- the "짧은 연사 간격" the brief asks for
export const ARROW_LIFETIME = 1.2; // seconds; safety despawn over open ground with nothing to hit

// Relic Bow ammo economy: finite arrows so ranged attack doesn't dominate
// every other option. Granted on pickup, restored in small amounts by the
// Treasure Cache's arrowBundle reward (see constants below).
export const RELIC_BOW_STARTING_ARROWS = 3;
export const RELIC_BOW_MAX_ARROWS = 5;

// Jumper: purely timer-driven, no player detection. Each hop carries it
// forward across its assigned platform, then it turns around at the edge.
// A brief windup (mirroring Bio-Coil's telegraph) keeps every hop readable
// before it happens.
export const JUMPER_WIDTH = 28;
export const JUMPER_HEIGHT = 26;
export const JUMPER_INTERVAL = 1.8; // seconds grounded before the next windup starts
export const JUMPER_WINDUP_DURATION = 0.4; // telegraph before launch
export const JUMPER_LAUNCH_VY = -480;
export const JUMPER_LAUNCH_VX = 82; // px/s; about half a platform per hop

// Turret: fixed in place, fires one SeedProjectile toward the player's
// current side at the moment the cycle fires (locked in then, not homing).
export const TURRET_WIDTH = 30;
export const TURRET_HEIGHT = 30;
export const TURRET_FIRE_INTERVAL = 2.5; // seconds between shots (also acts as its own per-turret cooldown)
export const TURRET_CHARGE_DURATION = 0.5; // telegraph window right before firing, exposed via isTurretCharging()
export const TURRET_MAX_SEEDS = 6; // global concurrent cap, a backstop alongside the per-turret interval

export const SEED_WIDTH = 12;
export const SEED_HEIGHT = 12;
export const SEED_SPEED = 200; // px/s -- slower than an arrow, meant to be dodgeable
export const SEED_LIFETIME = 3; // seconds; safety despawn

// Chestnut Roller: alternates a slow ground patrol with a fast, arrow/stomp-
// immune roll once the player is close and off cooldown. Per the design
// brief, hitting its own patrol bound mid-roll ends the roll early (same
// "a bound cuts a committed action short" shape as Cogmite's charge).
// Shell-kick/deflection is explicitly out of scope for this pass.
export const CHESTNUT_ROLLER_WIDTH = 32;
export const CHESTNUT_ROLLER_HEIGHT = 30;
export const CHESTNUT_ROLLER_PATROL_SPEED = 55; // px/s while walking
export const CHESTNUT_ROLLER_DETECT_RANGE = 280; // px, combined with a same-height check
export const CHESTNUT_ROLLER_WINDUP_DURATION = 0.45; // telegraph before the roll starts
export const CHESTNUT_ROLLER_ROLL_SPEED = 250; // px/s while rolling (invincible to arrow/stomp)
export const CHESTNUT_ROLLER_ROLL_DURATION = 1.15; // max roll length; cut short by a patrol-bound hit
export const CHESTNUT_ROLLER_RECOVER_DURATION = 0.65; // defenseless pause after a roll ends
export const CHESTNUT_ROLLER_COOLDOWN = 2.6; // seconds after recovering before it can roll again

// Treasure Cache: Root Cache is a mystery block that rolls one of five
// rewards; Relic Pods retain their authored rewards on optional routes.
export const TREASURE_CACHE_WIDTH = 28;
export const TREASURE_CACHE_HEIGHT = 28;
export const SUNSEED_BURST_SCORE = 8;
export const ARROW_BUNDLE_ARROWS = 1; // capped at RELIC_BOW_MAX_ARROWS on pickup
export const LIFE_BLOOM_LIVES = 1; // capped at STARTING_LIVES on pickup
export const LOOT_REVEAL_DURATION = 1; // seconds a LootReveal stays around for a reward popup
