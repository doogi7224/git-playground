import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SeedProjectile } from '../game/types';

export default function SeedProjectileView({ seed }: { seed: SeedProjectile }) {
  const size = seed.width * 1.25;
  return <View style={[styles.wrap, { left: seed.x + seed.width / 2 - size / 2, top: seed.y + seed.height / 2 - size / 2, width: size, height: size }]}><View style={styles.core} /><View style={styles.glint} /></View>;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', borderRadius: 999, backgroundColor: '#d88a2e', borderWidth: 1.5, borderColor: '#6b3b19', alignItems: 'center', justifyContent: 'center', shadowColor: '#ffdc6a', shadowOpacity: 0.8, shadowRadius: 4, elevation: 5 },
  core: { width: '50%', height: '50%', borderRadius: 999, backgroundColor: '#ffe485' },
  glint: { position: 'absolute', top: '18%', left: '24%', width: '23%', height: '23%', borderRadius: 999, backgroundColor: '#fff8cf' },
});
