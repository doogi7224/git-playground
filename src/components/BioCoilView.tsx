import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BioCoil } from '../game/types';
import { palette } from '../theme';

// No AI-generated sprite exists yet for this monster, so it's drawn
// procedurally like ShiftNodeView/SporeSpriteView: a coiled vine body that
// visibly stretches taller during windup/launch and flattens once landed
// (defenseless), so the stomp-timing risk/reward reads at a glance.
export default function BioCoilView({ coil }: { coil: BioCoil }) {
  if (!coil.alive) return null;

  const stretch = coil.phase === 'launch' ? 1.6 : coil.phase === 'windup' ? 1.2 : coil.phase === 'landed' ? 0.6 : 0.85;
  const visualHeight = coil.height * stretch;
  const left = coil.x + coil.width / 2 - coil.width / 2;
  const top = coil.y + coil.height - visualHeight;

  return (
    <View style={[styles.wrap, { left, top, width: coil.width, height: visualHeight }]}>
      <View style={[styles.body, { transform: [{ scaleX: coil.facing }] }]}>
        <View style={styles.wireA} />
        <View style={styles.wireB} />
        <View style={styles.eye} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  body: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: palette.moss,
    borderWidth: 2,
    borderColor: palette.mossDark,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  wireA: {
    position: 'absolute',
    top: '30%',
    width: '100%',
    height: 3,
    backgroundColor: palette.uiPrimary,
  },
  wireB: {
    position: 'absolute',
    top: '60%',
    width: '100%',
    height: 3,
    backgroundColor: palette.uiPrimary,
  },
  eye: {
    marginTop: 3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: palette.coinGold,
  },
});
