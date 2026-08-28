import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { palette } from '../theme';

const CHECKPOINT_SOURCE = require('../../assets/sprites/checkpoint_shrine_v4.png');

// A small banner marking a checkpoint. Lit (brass/gold) once the player has
// crossed it — death respawns here instead of always at the level start —
// dim/unlit before that, so progress reads at a glance while exploring.
// The moment it lights up gets a short glow ring + rising spark burst so
// "you're safe now" actually registers instead of the pennant just silently
// re-coloring (CLAUDE.md 19.16 — 환경 이펙트: 체크포인트).
export default function CheckpointView({ x, groundY, reached }: { x: number; groundY: number; reached: boolean }) {
  const height = 68;
  const top = groundY - height;

  const activate = useRef(new Animated.Value(0)).current;
  const prevReached = useRef(reached);
  useEffect(() => {
    if (reached && !prevReached.current) {
      activate.setValue(1);
      Animated.timing(activate, { toValue: 0, duration: 700, useNativeDriver: true }).start();
    }
    prevReached.current = reached;
  }, [reached, activate]);

  const ringScale = activate.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const ringOpacity = activate.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });
  const sparkRise = activate.interpolate({ inputRange: [0, 1], outputRange: [0, -34] });
  const sparkOpacity = activate.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View style={[styles.wrap, { left: x, top, height }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.ring, { top: height - 10, transform: [{ scale: ringScale }], opacity: ringOpacity }]}
      />
      {[-1, 0, 1].map((dx) => (
        <Animated.View
          key={dx}
          pointerEvents="none"
          style={[
            styles.spark,
            {
              top: height - 10,
              left: 3 + dx * 6,
              opacity: sparkOpacity,
              transform: [{ translateY: sparkRise }, { translateX: dx * 4 }],
            },
          ]}
        />
      ))}
      {reached && <View pointerEvents="none" style={styles.activeAura} />}
      <Image source={CHECKPOINT_SOURCE} resizeMode="contain" style={[styles.sprite, { opacity: reached ? 1 : 0.68 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: 44,
    alignItems: 'center',
  },
  sprite: { position: 'absolute', left: -18, bottom: -1, width: 64, height: 76 },
  activeAura: { position: 'absolute', left: -10, bottom: 8, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 213, 74, 0.22)' },
  ring: {
    position: 'absolute',
    left: -10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.coinGold,
  },
  spark: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.coinShine,
  },
});
