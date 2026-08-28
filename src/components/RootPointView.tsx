import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { RootPoint } from '../game/types';

// A deliberately simple wooden ring. The prior painted hook silhouette read
// like a small creature at game scale; this has one unmistakable purpose:
// "hold here to swing". It remains only a presentation layer over the same
// RootPoint collision/input logic.
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
  const leafTurn = pulse.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '8deg'] });
  const size = Math.max(34, point.height * 1.8);
  return (
    <Animated.View style={[styles.wrap, { left: point.x + point.width / 2 - size / 2, top: point.y + point.height / 2 - size / 2, width: size, height: size, transform: [{ scale }] }]}>
      <View pointerEvents="none" style={styles.glow} />
      <View pointerEvents="none" style={styles.vineStem} />
      <Animated.View pointerEvents="none" style={[styles.leaf, { transform: [{ rotate: leafTurn }] }]} />
      <View pointerEvents="none" style={styles.ringOuter}>
        <View style={styles.ringInner} />
      </View>
      <View pointerEvents="none" style={styles.knot} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: '92%', height: '92%', borderRadius: 999, backgroundColor: 'rgba(104, 226, 194, 0.18)' },
  vineStem: { position: 'absolute', top: '-25%', width: 5, height: '48%', borderRadius: 4, backgroundColor: '#315e39', borderWidth: 1, borderColor: '#173e2c' },
  leaf: { position: 'absolute', top: '1%', right: '8%', width: '38%', height: '22%', borderRadius: 999, backgroundColor: '#72a94b', borderWidth: 1.5, borderColor: '#244d2f' },
  ringOuter: { width: '68%', height: '68%', borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#85502c', borderWidth: 3, borderColor: '#422616', shadowColor: '#182d1d', shadowOpacity: 0.55, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  ringInner: { width: '53%', height: '53%', borderRadius: 999, backgroundColor: '#c3e6d6', borderWidth: 2, borderColor: '#dff8df' },
  knot: { position: 'absolute', bottom: '7%', width: '22%', height: '22%', borderRadius: 999, backgroundColor: '#c78a4d', borderWidth: 1.5, borderColor: '#4d2b18' },
});
