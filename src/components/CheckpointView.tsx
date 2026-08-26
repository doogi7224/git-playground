import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '../theme';

// A small banner marking a checkpoint. Lit (brass/gold) once the player has
// crossed it — death respawns here instead of always at the level start —
// dim/unlit before that, so progress reads at a glance while exploring.
export default function CheckpointView({ x, groundY, reached }: { x: number; groundY: number; reached: boolean }) {
  const height = 50;
  const top = groundY - height;

  return (
    <View style={[styles.wrap, { left: x, top, height }]}>
      <View style={[styles.pole, { backgroundColor: reached ? palette.uiPrimaryDark : '#8a8a8a' }]} />
      <View style={[styles.pennant, { backgroundColor: reached ? palette.uiPrimary : '#b0b0b0', borderColor: reached ? palette.uiPrimaryDark : '#8a8a8a' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: 6,
    alignItems: 'center',
  },
  pole: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 2,
  },
  pennant: {
    position: 'absolute',
    top: 2,
    left: 4,
    width: 20,
    height: 14,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    borderWidth: 1,
  },
});
