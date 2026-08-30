import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ThornSlinger } from '../game/types';

const ART = require('../../assets/sprites/thorn_slinger_v1/thorn_slinger.png');

export default function ThornSlingerView({ slinger }: { slinger: ThornSlinger }) {
  if (!slinger.alive) return null;
  const size = slinger.width * 1.8;
  const warning = slinger.phase === 'telegraph' || slinger.phase === 'betweenShots';
  return (
    <View style={[styles.wrap, { left: slinger.x + slinger.width / 2 - size / 2, top: slinger.y + slinger.height - size, width: size, height: size }]}>
      {warning && <View pointerEvents="none" style={styles.warningRing} />}
      <Image source={ART} resizeMode="contain" style={[styles.sprite, { transform: [{ scaleX: slinger.facing }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  sprite: { width: '100%', height: '100%' },
  warningRing: { position: 'absolute', width: '72%', height: '72%', borderRadius: 999, borderWidth: 2, borderColor: '#f3bb4c', backgroundColor: 'rgba(242, 137, 41, 0.16)' },
});
