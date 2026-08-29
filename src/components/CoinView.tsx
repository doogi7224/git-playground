import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Coin } from '../game/types';

// The collection hitbox remains untouched; this paints the brass cog coin from
// the control UI rather than the older flower-like Sunseed sprite.
const VISUAL_SIZE = 24;
const COG_TEETH = Array.from({ length: 8 }, (_, index) => index);

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
    <Animated.View style={[styles.cog, { opacity }]}>
      {COG_TEETH.map((tooth) => <View key={tooth} style={[styles.tooth, { transform: [{ rotate: `${tooth * 45}deg` }, { translateY: -11 }] }]} />)}
      <View style={styles.rim}>
        <View style={styles.face}>
          <View style={styles.hub} />
          <View style={styles.shine} />
        </View>
      </View>
    </Animated.View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', width: VISUAL_SIZE, height: VISUAL_SIZE, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,205,71,0.28)' },
  cog: { width: VISUAL_SIZE, height: VISUAL_SIZE, alignItems: 'center', justifyContent: 'center' },
  tooth: { position: 'absolute', width: 5, height: 7, borderRadius: 1.5, backgroundColor: '#bc7620', borderWidth: 0.7, borderColor: '#ffe49b' },
  rim: { width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#b46d1d', borderWidth: 1.5, borderColor: '#ffe6a0' },
  face: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#f5bc37', borderWidth: 1, borderColor: '#fff1ac' },
  hub: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#9a5719', borderWidth: 1, borderColor: '#ffe89a' },
  shine: { position: 'absolute', top: 1, left: 3, width: 6, height: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,224,0.72)' },
});
