import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { EffectEvent, EffectKind } from '../game/types';
import { palette } from '../theme';

// Renders the short-lived, read-only effect log physics.ts appends to on
// stomp/hit/pickup moments (see EffectEvent in game/types.ts). Purely
// presentational: each burst mounts once per unique event id, plays a single
// outward-particle + ring animation, and fades to nothing well before
// physics prunes the event from state — CLAUDE.md 19.16/19.17 (스톰프 충돌,
// 피격, 기어 획득 이펙트).
const KIND_STYLE: Record<EffectKind, { color: string; count: number; spread: number; ringSize: number }> = {
  impact: { color: palette.woodDark, count: 5, spread: 22, ringSize: 26 },
  hit: { color: palette.uiDanger, count: 5, spread: 18, ringSize: 22 },
  pickup: { color: palette.coinGold, count: 4, spread: 16, ringSize: 18 },
  gearPickup: { color: palette.uiPrimary, count: 6, spread: 26, ringSize: 30 },
};

function Burst({ effect }: { effect: EffectEvent }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 380, useNativeDriver: true }).start();
  }, [t]);

  const { color, count, spread, ringSize } = KIND_STYLE[effect.kind];
  const ringScale = t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.7] });
  const ringOpacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
  const fragOpacity = t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });

  return (
    <View style={[styles.wrap, { left: effect.x, top: effect.y }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            left: -ringSize / 2,
            top: -ringSize / 2,
            borderColor: color,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />
      {Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count;
        const dx = t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * spread] });
        const dy = t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * spread - 6] });
        return (
          <Animated.View
            key={i}
            style={[
              styles.frag,
              { backgroundColor: color, opacity: fragOpacity, transform: [{ translateX: dx }, { translateY: dy }] },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function EffectsView({ effects }: { effects: EffectEvent[] }) {
  return (
    <>
      {effects.map((e) => (
        <Burst key={e.id} effect={e} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
  },
  frag: {
    position: 'absolute',
    left: -3,
    top: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
