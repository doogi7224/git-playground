import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SeedProjectile } from '../game/types';

export default function SeedProjectileView({ seed }: { seed: SeedProjectile }) {
  // Rootwarden's ground wave shares the collision-safe seed body, but reads
  // as a broader low thorn sweep instead of another small flying seed.
  const isRootWave = seed.source === 'bossWave';
  const height = seed.width * (isRootWave ? 1.9 : 1.45);
  const width = height * (isRootWave ? 2.1 : 1.65);
  return (
    <View
      style={[
        styles.wrap,
        {
          left: seed.x + seed.width / 2 - width / 2,
          top: seed.y + seed.height / 2 - height / 2,
          width,
          height,
          transform: [{ rotate: `${Math.atan2(seed.vy, seed.vx) * (180 / Math.PI)}deg` }],
        },
      ]}
    >
      <Image source={require('../../assets/sprites/seed_projectile_v4.png')} resizeMode="contain" style={styles.sprite} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  sprite: { width: '100%', height: '100%' },
});
