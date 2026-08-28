import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { isTurretCharging } from '../game/physics';
import { Turret } from '../game/types';

export default function TurretView({ turret }: { turret: Turret }) {
  const chargePulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(chargePulse, { toValue: 1, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(chargePulse, { toValue: 0, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [chargePulse]);
  if (!turret.alive) return null;
  const size = turret.width * 1.9;
  const charging = isTurretCharging(turret);
  const recoil = chargePulse.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const scale = chargePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  return (
    <View style={[styles.wrap, { left: turret.x + turret.width / 2 - size / 2, top: turret.y + turret.height - size, width: size, height: size }]}>
      {charging && <View pointerEvents="none" style={styles.chargeHalo} />}
      <Animated.Image
        source={charging
          ? require('../../assets/sprites/root_turret_v4_fire.png')
          : require('../../assets/sprites/root_turret_v1/root_turret_idle.png')}
        resizeMode="contain"
        style={[styles.sprite, charging && { transform: [{ translateX: recoil }, { scale }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  sprite: { width: '100%', height: '100%' },
  chargeHalo: { position: 'absolute', right: '-2%', top: '31%', width: '31%', height: '31%', borderRadius: 999, backgroundColor: 'rgba(255, 177, 54, 0.62)', borderWidth: 1.5, borderColor: '#fff0ae' },
});
