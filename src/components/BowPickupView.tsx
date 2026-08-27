import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { BowPickup } from '../game/types';

export default function BowPickupView({ pickup }: { pickup: BowPickup }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  if (pickup.collected) return null;
  const floatY = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, -3] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.65] });
  const size = pickup.width * 1.85;

  return (
    <Animated.View style={[styles.wrap, { left: pickup.x + pickup.width / 2 - size / 2, top: pickup.y + pickup.height - size, width: size, height: size, transform: [{ translateY: floatY }] }]}>
      <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glowOpacity }]} />
      <Image source={require('../../assets/sprites/relic_bow_v1/relic_bow_pickup.png')} resizeMode="contain" style={styles.sprite} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: '78%', height: '78%', borderRadius: 999, backgroundColor: 'rgba(255, 205, 75, 0.48)' },
  sprite: { width: '100%', height: '100%' },
});
