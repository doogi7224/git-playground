import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { RootPoint } from '../game/types';

const HOOK_SOURCE = require('../../assets/sprites/root_hook_v1/root_hook.png');
const VISUAL_WIDTH = 34;
const VISUAL_HEIGHT = 60;

// A painted root-and-vine hook replaces the abstract ring. Its glowing seed
// sits near the actual grapple point, while the branch silhouette clearly
// belongs to the forest world rather than to the HUD.
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
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.035] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.42] });
  const centerX = point.x + point.width / 2;
  const centerY = point.y + point.height / 2;
  return (
    <View style={[styles.wrap, { left: centerX - VISUAL_WIDTH / 2, top: centerY - VISUAL_HEIGHT * 0.7 }]}> 
      <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glowOpacity }]} />
      <Animated.Image source={HOOK_SOURCE} resizeMode="contain" style={[styles.sprite, { transform: [{ scale }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', width: VISUAL_WIDTH, height: VISUAL_HEIGHT },
  sprite: { position: 'absolute', width: '100%', height: '100%' },
  glow: { position: 'absolute', left: 7, bottom: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: '#8ff4d9' },
});
