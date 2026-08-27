export const TILE = 40;

export const GRAVITY = 1800; // px/s^2
export const MOVE_SPEED = 220; // px/s
export const JUMP_VELOCITY = -650; // px/s
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
// Neutralized entirely in the wild Bloom Shift state, which also slows its
// normal patrol to 60%.
export const ENEMY_CHARGE_SPEED = 120;
export const ENEMY_DETECT_RANGE = 160; // px; not given a number in the doc, a judgment call
export const ENEMY_WILD_PATROL_MULT = 0.6;

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

// Gear Socket cogs, adapted as auto-equip-on-pickup passives for the rest of
// the current run (see the CogType comment in types.ts for the scoping note).
export const COG_PICKUP_SIZE = 22;
export const COG_SPRING_JUMP_MULT = 1.18; // foot slot: +18% jump height (doc also has +25% wall-jump distance; no wall-jump exists)
export const COG_MAGNET_RADIUS = 70; // body slot: px radius for auto-collecting coins
export const COG_STEAMBOOST_EXTRA_DURATION = 0.2; // foot slot: extra seconds of dash-speed coast after a dash ends
export const COG_ROOTHOOK_RANGE_MULT = 1.3; // body slot: +30% Root-Hook attach range
export const COG_MIRROR_TRAIL_SECONDS = 4; // head slot: how far back the respawn-rewind trail reaches
export const COG_CANNON_JUMP_MULT = 1.3; // "Cannon Jump" synergy (Root-Hook Cog + Spring): extra boost on a mid-swing release-jump

// Wall-slide/wall-jump: per the GDD's control spec (fall-speed cap is specified
// numerically; push-off speed is not, so WALLJUMP_VX is a judgment call rather
// than a documented figure). Any airborne contact against a platform's side
// counts as a wall — there's no separate "wall" object type, just existing
// pit edges and ground/platform sides.
export const WALL_SLIDE_FALL_MULT = 0.45; // caps fall speed at 45% of MAX_FALL_SPEED while pressed against a wall
export const WALLJUMP_VX = 260; // px/s horizontal push-off away from the wall
export const COG_WALLJUMP_HORIZ_MULT = 1.25; // Spring cog: +25% wall-jump horizontal distance (a separate stat from its jump-height boost)
export const OVERDRIVE_WALLJUMP_GAIN = 10; // GDD lists wall-jump alongside dash/stomp/grind in the Overdrive combo chain

// Post-defeat corpse platforms: per the monster design doc, Cogmite, Bio-Coil,
// and Steam Blower all leave a temporary solid platform for a few seconds
// after being defeated.
export const CORPSE_PLATFORM_DURATION = 3; // seconds, per the doc's "3초간 임시 발판" for all three
export const BIOCOIL_CORPSE_BOUNCE_MULT = 1.3; // doc: jumping off a defeated Bio-Coil's spring gives +30% jump height
export const STEAMBLOWER_CORPSE_WIDTH_MULT = 2.5; // doc calls its collapse a "wide" platform, vs. the other two using their own body size

// Portal: purely a level-transition marker into the boss arena, no collision
// logic of its own — just a rect the player crosses once, which plays a
// one-time effect burst (see `portalActivated` in GameState).
export const PORTAL_WIDTH = 40;
export const PORTAL_HEIGHT = 70;

// Boss (Area 3 finale): new content, not part of the original 5-monster
// roster, so these numbers have no prior established value to preserve —
// sized noticeably larger than Steam Blower (the previous largest monster)
// for a "final fight" feel. While alive, the boss is added to the solid
// collision platform list (see stepGame) so it physically blocks the path
// rather than being a walk-through hazard, matching how a boss arena reads.
export const BOSS_WIDTH = 90;
export const BOSS_HEIGHT = 110;
export const BOSS_HP = 5;
export const BOSS_IDLE_DURATION = 1.5; // safe to approach
export const BOSS_TELEGRAPH_DURATION = 1.0; // clear visual warning before the attack lands (CLAUDE.md 18: 예고 부족 방지)
export const BOSS_ATTACK_DURATION = 0.6; // damage window
export const BOSS_VULNERABLE_DURATION = 1.5; // weak point exposed, stompable
export const BOSS_ATTACK_RANGE = 100; // px, extends this far on both sides of the boss during the attack phase
export const BOSS_ATTACK_KNOCKBACK = 420; // px/s horizontal push, away from the boss

// Route Gate (GAME_DIRECTION_V2.md "Momentum Route" foundation): a local,
// temporary choice point replacing the global Bloom Shift toggle's role as
// the level's core "state changes what's available" hook. New content, no
// prior numbers to preserve — sized as a walk/dash-through doorway roughly
// matching the existing Shift Node/Portal trigger footprint.
export const ROUTE_GATE_WIDTH = 30;
export const ROUTE_GATE_HEIGHT = 70;
export const ROUTE_GATE_DURATION = 6; // seconds a gate's tagged platforms stay active, per the design doc

// EffectEvent lifetime: presentation-only (CLAUDE.md 19 — Effects), not a
// gameplay balance number. Sized to comfortably outlast the burst animations
// that render against these events before physics prunes them.
export const EFFECT_DURATION = 0.5;
