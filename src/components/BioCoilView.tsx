import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BioCoil } from '../game/types';

// AI-generated illustration (matches the Sprout/Cogmite art direction),
// drawn larger than the hitbox like PlayerView/EnemyView. The phase-driven
// Phase motion stays restrained so the same creature remains recognizable;
// the previous 0.6x–1.6x height changes made it look like different artwork.
const VISUAL_SCALE = 1.7;

export default function BioCoilView({ coil }: { coil: BioCoil }) {
  if (!coil.alive) return null;

  const stretch = coil.phase === 'launch' ? 1.12 : coil.phase === 'windup' ? 0.88 : coil.phase === 'landed' ? 0.82 : 1;
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
