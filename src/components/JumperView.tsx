import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Jumper } from '../game/types';

const HOPPER_FRAMES = [
  require('../../assets/sprites/acorn_hopper_v5/acorn_hopper_0.png'),
  require('../../assets/sprites/acorn_hopper_v5/acorn_hopper_1.png'),
  require('../../assets/sprites/acorn_hopper_v5/acorn_hopper_2.png'),
  require('../../assets/sprites/acorn_hopper_v5/acorn_hopper_3.png'),
] satisfies ImageSourcePropType[];

export default function JumperView({ jumper }: { jumper: Jumper }) {
  if (!jumper.alive) return null;

  const size = jumper.width * 1.75;
  const windup = jumper.phase === 'windup';
  const airborne = jumper.phase === 'airborne';
  const frame = windup ? HOPPER_FRAMES[1] : airborne ? HOPPER_FRAMES[jumper.vy < 0 ? 2 : 3] : HOPPER_FRAMES[0];
  return (
    <View style={[styles.wrap, { left: jumper.x + jumper.width / 2 - size / 2, top: jumper.y + jumper.height - size, width: size, height: size }]}>
      {windup && <View pointerEvents="none" style={styles.warningRing} />}
      <Image source={frame} resizeMode="contain" style={styles.sprite} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  sprite: { width: '100%', height: '100%' },
  warningRing: { position: 'absolute', bottom: '5%', width: '72%', height: '18%', borderRadius: 999, borderWidth: 1.5, borderColor: '#f3bd4f', backgroundColor: 'rgba(255, 203, 83, 0.18)' },
});
