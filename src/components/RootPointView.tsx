import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { RootPoint } from '../game/types';

// A visible living root hook makes the grapple target legible without turning
// it into a floating circle or a mechanical UI marker.
export default function RootPointView({ point }: { point: RootPoint }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 850, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.05] });
  const size = point.height * 2.45;
  return (
    <Animated.View style={[styles.wrap, { left: point.x + point.width / 2 - size * 0.36, top: point.y - size * 0.2, width: size * 0.72, height: size, transform: [{ scale }] }]}>
      <View pointerEvents="none" style={styles.glow} />
      <Image source={require('../../assets/sprites/root_hook_v1/root_hook.png')} resizeMode="contain" style={styles.sprite} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', bottom: '5%', width: '28%', height: '18%', borderRadius: 999, backgroundColor: 'rgba(81, 222, 210, 0.34)' },
  sprite: { width: '100%', height: '100%' },
});
