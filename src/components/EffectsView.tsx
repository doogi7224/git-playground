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
const KIND_STYLE: Record<EffectKind, { color: string; flashColor: string; count: number; spread: number; ringSize: number }> = {
  impact: { color: palette.woodDark, flashColor: '#fff', count: 6, spread: 26, ringSize: 30 },
  hit: { color: palette.uiDanger, flashColor: '#fff2ea', count: 6, spread: 22, ringSize: 26 },
  pickup: { color: palette.coinGold, flashColor: palette.coinShine, count: 5, spread: 20, ringSize: 22 },
  gearPickup: { color: palette.uiPrimary, flashColor: palette.coinShine, count: 7, spread: 30, ringSize: 34 },
};

function Burst({ effect }: { effect: EffectEvent }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [t]);

  const { color, flashColor, count, spread, ringSize } = KIND_STYLE[effect.kind];
  const ringScale = t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.8] });
  const ringOpacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
  const fragOpacity = t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  // A bright, high-contrast pop at the very start of the burst — the part of
  // the animation most likely to actually register at a glance (or survive
  // video/screenshot compression during testing).
  const flashScale = t.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.2, 1.4, 1.4] });
  const flashOpacity = t.interpolate({ inputRange: [0, 0.2, 0.5], outputRange: [1, 0.9, 0], extrapolate: 'clamp' });

  return (
    <View style={[styles.wrap, { left: effect.x, top: effect.y }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.flash,
          {
            backgroundColor: flashColor,
            transform: [{ scale: flashScale }],
            opacity: flashOpacity,
          },
        ]}
      />
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
  flash: {
    position: 'absolute',
    left: -9,
    top: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 3,
  },
  frag: {
    position: 'absolute',
    left: -4,
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
