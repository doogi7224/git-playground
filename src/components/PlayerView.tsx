import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Player } from '../game/types';

// Sprout is drawn larger than its collision box (a full-body AI-generated
// sprite with some padding) and anchored so its feet sit on the hitbox's
// bottom edge, centered on the hitbox's horizontal center.
const VISUAL_SIZE = 52;

export default function PlayerView({ player }: { player: Player }) {
  const blinking = player.invulnerableFor > 0 && Math.floor(player.invulnerableFor * 10) % 2 === 0;

  const stretch = Math.max(-1, Math.min(1, player.vy / 500));
  const scaleY = 1 + stretch * 0.12;
  const scaleX = 1 - stretch * 0.08;

  const left = player.x + player.width / 2 - VISUAL_SIZE / 2;
  const top = player.y + player.height - VISUAL_SIZE;

  return (
    <Image
      source={require('../../assets/sprites/sprout.png')}
      resizeMode="contain"
      style={[
        styles.sprite,
        {
          left,
          top,
          opacity: blinking ? 0.35 : 1,
          transform: [{ scaleX: player.facing * scaleX }, { scaleY }],
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
