import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SeedProjectile } from '../game/types';

export default function SeedProjectileView({ seed }: { seed: SeedProjectile }) {
  const height = seed.width * 1.45;
  const width = height * 1.65;
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
