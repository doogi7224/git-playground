import React from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { ARROW_COOLDOWN, MOVE_SPEED } from '../game/constants';
import { Player } from '../game/types';

// Presentation is deliberately anchored to the physics box's bottom edge.
// No visual transform is allowed to move a planted foot below the ground.
const VISUAL_SIZE = 48;
const RUN_FRAME_MS = 90;

const SCOUT_FRAMES = {
  idle: require('../../assets/sprites/scout_v3/scout_idle_0.png'),
  run: [
    require('../../assets/sprites/scout_v3/scout_run_0.png'),
    require('../../assets/sprites/scout_v3/scout_run_1.png'),
  ],
  jump: require('../../assets/sprites/scout_v4_jump.png'),
  fall: require('../../assets/sprites/scout_v4_fall.png'),
  shoot: require('../../assets/sprites/scout_v4_shoot.png'),
} satisfies {
  idle: ImageSourcePropType;
  run: ImageSourcePropType[];
  jump: ImageSourcePropType;
  fall: ImageSourcePropType;
  shoot: ImageSourcePropType;
};

export default function PlayerView({ player }: { player: Player }) {
  const blinking = player.invulnerableFor > 0 && Math.floor(player.invulnerableFor * 10) % 2 === 0;
  const isRunning = player.onGround && Math.abs(player.vx) > 10;
  const isShooting = player.hasBow && player.arrowCooldown > ARROW_COOLDOWN - 0.14;

  let spriteSource: ImageSourcePropType;
  if (isShooting) {
    spriteSource = SCOUT_FRAMES.shoot;
  } else if (!player.onGround) {
    spriteSource = player.vy < 30 ? SCOUT_FRAMES.jump : SCOUT_FRAMES.fall;
  } else if (isRunning || player.dashTimer > 0) {
    // A real two-frame run cycle selected from travelled distance. Unlike a
    // timed bob/tilt, stationary characters do not animate or consume work.
    const index = Math.floor(Math.abs(player.x) / (MOVE_SPEED * (RUN_FRAME_MS / 1000))) % SCOUT_FRAMES.run.length;
    spriteSource = SCOUT_FRAMES.run[index];
  } else {
    spriteSource = SCOUT_FRAMES.idle;
  }

  const spriteWidth = isShooting ? 66 : VISUAL_SIZE;
  const spriteHeight = isShooting ? 54 : VISUAL_SIZE;
  const left = player.x + player.width / 2 - spriteWidth / 2;
  // The source has a small transparent bottom inset. Keeping the image box
  // on the hitbox bottom places the painted sole on the platform.
  const top = player.y + player.height - spriteHeight;

  return (
    <Image
      source={spriteSource}
      resizeMode="contain"
      style={[
        styles.sprite,
        {
          left,
          top,
          width: spriteWidth,
          height: spriteHeight,
          opacity: blinking ? 0.35 : 1,
          transform: [{ scaleX: player.facing }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  sprite: {
    position: 'absolute',
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
  },
});
