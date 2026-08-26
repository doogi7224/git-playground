import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { palette } from '../theme';

// A small banner marking a checkpoint. Lit (brass/gold) once the player has
// crossed it — death respawns here instead of always at the level start —
// dim/unlit before that, so progress reads at a glance while exploring.
// The moment it lights up gets a short glow ring + rising spark burst so
// "you're safe now" actually registers instead of the pennant just silently
// re-coloring (CLAUDE.md 19.16 — 환경 이펙트: 체크포인트).
export default function CheckpointView({ x, groundY, reached }: { x: number; groundY: number; reached: boolean }) {
  const height = 50;
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
      <View style={[styles.pole, { backgroundColor: reached ? palette.uiPrimaryDark : '#8a8a8a' }]} />
      <View style={[styles.pennant, { backgroundColor: reached ? palette.uiPrimary : '#b0b0b0', borderColor: reached ? palette.uiPrimaryDark : '#8a8a8a' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: 6,
    alignItems: 'center',
  },
  pole: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 2,
  },
  pennant: {
    position: 'absolute',
    top: 2,
    left: 4,
    width: 20,
    height: 14,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    borderWidth: 1,
  },
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
