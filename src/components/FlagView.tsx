import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { Flag } from '../game/types';

// The goal is an expedition banner, not a generic race flag. Its visual
// footprint is larger than the flag collision marker but changes no gameplay.
export default function FlagView({ flag }: { flag: Flag }) {
  const wave = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(wave, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(wave, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [wave]);

  const sway = wave.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  const visualHeight = flag.height * 1.18;
  const visualWidth = visualHeight * 0.58;
  return <Animated.View style={[styles.wrap, { left: flag.x + flag.width / 2 - visualWidth / 2, top: flag.y + flag.height - visualHeight, width: visualWidth, height: visualHeight, transform: [{ rotate: sway }] }]}><Image source={require('../../assets/sprites/goal_banner_v1/goal_banner.png')} resizeMode="contain" style={styles.sprite} /></Animated.View>;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  sprite: { width: '100%', height: '100%' },
});
