import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Enemy } from '../game/types';
import { palette } from '../theme';

// Visual size never affects collision. The sprite is bottom-anchored to the
// AABB and uses authored run frames only: no synthetic wobble or rotation.
const VISUAL_SIZE = 46;
const WALK_FRAME_DISTANCE = 18;
const BRAMBLING_FRAMES = [
  require('../../assets/sprites/brambleling_v1/brambleling_0.png'),
  require('../../assets/sprites/brambleling_v1/brambleling_1.png'),
] satisfies ImageSourcePropType[];

export default function EnemyView({ enemy }: { enemy: Enemy }) {
  if (!enemy.alive) return null;

  const charging = enemy.chargeDir !== 0;
  const facing = enemy.vx >= 0 ? 1 : -1;
  const frame = charging
    ? BRAMBLING_FRAMES[0]
    : BRAMBLING_FRAMES[Math.floor(Math.abs(enemy.x) / WALK_FRAME_DISTANCE) % BRAMBLING_FRAMES.length];
  const left = enemy.x + enemy.width / 2 - VISUAL_SIZE / 2;
  const top = enemy.y + enemy.height - VISUAL_SIZE;

  return (
    <View style={[styles.wrap, { left, top }]}>
      <Image source={frame} resizeMode="contain" style={[styles.sprite, { transform: [{ scaleX: facing }] }]} />
      {charging && <View style={styles.alertDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', width: VISUAL_SIZE, height: VISUAL_SIZE },
  sprite: { position: 'absolute', width: '100%', height: '100%' },
  alertDot: {
    position: 'absolute', top: -6, left: '50%', marginLeft: -4, width: 8, height: 8,
    borderRadius: 4, backgroundColor: palette.uiDanger,
  },
});
