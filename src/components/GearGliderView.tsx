import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { GearGlider } from '../game/types';

const ART = require('../../assets/sprites/gear_glider_v1/gear_glider.png');

export default function GearGliderView({ glider }: { glider: GearGlider }) {
  if (!glider.alive) return null;
  const width = glider.width * 2.05;
  const height = glider.height * 2.05;
  const warning = glider.phase === 'telegraph';
  const recovering = glider.phase === 'recover';
  return (
    <View style={[styles.wrap, { left: glider.x + glider.width / 2 - width / 2, top: glider.y + glider.height / 2 - height / 2, width, height, opacity: recovering ? 0.78 : 1 }]}>
      {warning && <View pointerEvents="none" style={styles.warningRing} />}
      <Image source={ART} resizeMode="contain" style={[styles.sprite, { transform: [{ scaleX: glider.facing }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  sprite: { width: '100%', height: '100%' },
  warningRing: { position: 'absolute', width: '65%', height: '65%', borderRadius: 999, borderWidth: 2, borderColor: '#7cdcf1', backgroundColor: 'rgba(67, 172, 207, 0.18)' },
});
