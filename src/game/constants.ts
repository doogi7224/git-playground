export const TILE = 40;

export const GRAVITY = 1800; // px/s^2
export const MOVE_SPEED = 220; // px/s
export const JUMP_VELOCITY = -650; // px/s
export const STOMP_BOUNCE = -450; // px/s
export const STOMP_TOLERANCE = 8; // px of slack when checking if the player approached an enemy from above
export const MAX_FALL_SPEED = 900; // px/s
export const FRICTION = 900; // px/s^2, deceleration when no input

export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 40;

export const ENEMY_WIDTH = 34;
export const ENEMY_HEIGHT = 30;
export const ENEMY_SPEED = 60; // px/s

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

// Overdrive: a combo gauge built from stomp/dash chains (the GDD's full list also includes
// wall-jump and grind, which don't exist in this prototype yet).
export const OVERDRIVE_MAX = 100;
export const OVERDRIVE_STOMP_GAIN = 15;
export const OVERDRIVE_DASH_GAIN = 10;
export const OVERDRIVE_COMBO_BREAK_TIME = 1.5; // seconds without a stomp/dash before the chain (and gauge) resets
export const OVERDRIVE_DURATION = 8; // seconds the boost lasts once the gauge fills
export const OVERDRIVE_SPEED_MULT = 1.15; // applied to MOVE_SPEED and JUMP_VELOCITY while active
export const OVERDRIVE_COIN_MULT = 2; // coin value multiplier while active

export const SHIFT_NODE_SIZE = 28;

export const SPORE_SPRITE_WIDTH = 28;
export const SPORE_SPRITE_HEIGHT = 32;
export const SPORE_AMPLITUDE = 20; // px, vertical sine-wave travel
export const SPORE_PERIOD = 2.4; // seconds per full float cycle
export const SPORE_RADIUS_WILD = 80; // px, proximity radius in the sprite's natural (wild) state
export const SPORE_RADIUS_MECHANICAL = 110; // wider net once shifted to its brass-drone form
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
export const BIOCOIL_LEAP_VX_MECHANICAL = 90;
export const BIOCOIL_LAUNCH_VY_MECHANICAL = -300; // low, short, untelegraphed ambush hop

export const STEAMBLOWER_WIDTH = 48;
export const STEAMBLOWER_HEIGHT = 54;
export const STEAMBLOWER_HP = 3;

export const STEAM_GUST_CYCLE = 3;
export const STEAM_GUST_CHARGE = 0.4;
export const STEAM_GUST_ACTIVE = 0.5; // knockback window
export const STEAM_GUST_RANGE = 90; // px, extends this far on both sides of the blower
export const STEAM_GUST_KNOCKBACK = 380; // px/s horizontal push, away from the blower

// Named FLAME_LOB (not SPORE_*) to avoid confusion with the unrelated Spore
// Sprite monster — this is the Steam Blower's "flame spore" ranged attack.
export const FLAME_LOB_CYCLE = 5;
export const FLAME_LOB_CHARGE = 0.5;
export const FLAME_LOB_ACTIVE = 0.4; // damage window
export const FLAME_LOB_RANGE = 110; // px, wider than the steam gust since it's a ranged lob

export const ROOTHOOK_RANGE = 90; // px, distance from a root point within which the grapple can attach
export const ROOTHOOK_SIZE = 18;
// Deliberately softer than normal GRAVITY for a controllable, slightly floaty swing feel
// rather than a fast, twitchy pendulum given the short radii involved.
export const ROOTHOOK_SWING_GRAVITY = 900;
export const ROOTHOOK_DAMPING = 0.999; // slight per-frame angular velocity decay, avoids perpetual motion
export const ROOTHOOK_PUMP_ACCEL = 8; // rad/s^2 added while holding a direction, to let the player pump the swing
export const ROOTHOOK_MAX_ANGULAR_VEL = 6; // rad/s, clamp to prevent runaway spin
