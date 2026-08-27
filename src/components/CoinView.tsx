import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Coin } from '../game/types';

// Keep the existing collection hitbox but make the collectible itself a small
// luminous seed-crystal. Its scale leaves breathing room around coin arcs.
const VISUAL_SIZE = 12;

export default function CoinView({ coin }: { coin: Coin }) {
  const float = useRef(new Animated.Value(0)).current;
  const gleam = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const gleamLoop = Animated.loop(Animated.sequence([
      Animated.timing(gleam, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(gleam, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    floatLoop.start(); gleamLoop.start();
    return () => { floatLoop.stop(); gleamLoop.stop(); };
  }, [float, gleam]);
  if (coin.collected) return null;
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [1, -2] });
  const opacity = gleam.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  return <Animated.View style={[styles.wrap, { left: coin.x + (coin.width - VISUAL_SIZE) / 2, top: coin.y + (coin.height - VISUAL_SIZE) / 2, transform: [{ translateY }] }]}>
    <Animated.View style={[styles.glow, { opacity }]} />
    <View style={styles.crystal}><View style={styles.crystalCore} /><View style={styles.spark} /></View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', width: VISUAL_SIZE, height: VISUAL_SIZE, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 17, height: 17, borderRadius: 9, backgroundColor: 'rgba(255,218,95,0.32)' },
  crystal: { width: 10, height: 10, borderRadius: 3, transform: [{ rotate: '45deg' }], backgroundColor: '#edb943', borderWidth: 1.5, borderColor: '#8c5c22', alignItems: 'center', justifyContent: 'center', shadowColor: '#fff2a5', shadowOpacity: 0.85, shadowRadius: 3, elevation: 5 },
  crystalCore: { width: 4, height: 4, borderRadius: 1.5, backgroundColor: '#fff6c8' },
  spark: { position: 'absolute', top: 0.8, left: 0.8, width: 2, height: 2, borderRadius: 1, backgroundColor: '#fff' },
});
