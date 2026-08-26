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
