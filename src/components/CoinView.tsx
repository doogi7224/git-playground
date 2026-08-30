import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';
import { Coin } from '../game/types';

// The collection hitbox remains untouched; the painted coin is a dedicated
// embossed "1" gold sprite so it reads like a proper platformer pickup.
const VISUAL_SIZE = 16;

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
    <Animated.View style={{ opacity }}>
      <Image source={require('../../assets/sprites/collectible_coin_v1.png')} resizeMode="contain" style={styles.coin} />
    </Animated.View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', width: VISUAL_SIZE, height: VISUAL_SIZE, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,205,71,0.24)' },
  coin: { width: VISUAL_SIZE, height: VISUAL_SIZE },
});
