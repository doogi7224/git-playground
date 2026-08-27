import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BioCoil } from '../game/types';

// AI-generated illustration (matches the Sprout/Cogmite art direction),
// drawn larger than the hitbox like PlayerView/EnemyView. The phase-driven
// stretch that sold the windup/launch/landed risk-reward timing is unchanged
// — only the shape being stretched moved from a plain rounded rect to the
// coiled vine-spring artwork.
const VISUAL_SCALE = 1.7;

export default function BioCoilView({ coil }: { coil: BioCoil }) {
  if (!coil.alive) return null;

  const stretch = coil.phase === 'launch' ? 1.6 : coil.phase === 'windup' ? 1.2 : coil.phase === 'landed' ? 0.6 : 0.85;
  const visualWidth = coil.width * VISUAL_SCALE;
  const visualHeight = visualWidth * stretch;
  const left = coil.x + coil.width / 2 - visualWidth / 2;
  const top = coil.y + coil.height - visualHeight;

  return (
    <View style={[styles.wrap, { left, top, width: visualWidth, height: visualHeight }]}>
      <Image
        source={require('../../assets/sprites/bio_coil.png')}
        resizeMode="contain"
        style={[styles.sprite, { transform: [{ scaleX: coil.facing }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  sprite: {
    width: '100%',
    height: '100%',
  },
});
