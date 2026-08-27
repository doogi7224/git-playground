import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { isTurretCharging } from '../game/physics';
import { Turret } from '../game/types';

export default function TurretView({ turret }: { turret: Turret }) {
  if (!turret.alive) return null;
  const size = turret.width * 1.9;
  const charging = isTurretCharging(turret);
  return (
    <View style={[styles.wrap, { left: turret.x + turret.width / 2 - size / 2, top: turret.y + turret.height - size, width: size, height: size }]}>
      {charging && <View pointerEvents="none" style={styles.chargeHalo} />}
      <Image source={require('../../assets/sprites/root_turret_v1/root_turret_idle.png')} resizeMode="contain" style={styles.sprite} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  sprite: { width: '100%', height: '100%' },
  chargeHalo: { position: 'absolute', right: '-2%', top: '31%', width: '31%', height: '31%', borderRadius: 999, backgroundColor: 'rgba(255, 177, 54, 0.62)', borderWidth: 1.5, borderColor: '#fff0ae' },
});
