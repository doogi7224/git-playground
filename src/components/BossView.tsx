import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { BOSS_HP } from '../game/constants';
import { Boss } from '../game/types';
import { palette } from '../theme';

// Placeholder presentation — no illustration yet (pending art budget), but
// built so a real sprite can drop in later without touching this component's
// phase-reactive logic: swap `styles.body`'s backgroundColor block for an
// <Image>, keep everything else (HP pips, phase tint, telegraph flash).
//
// Phase readability matters even as a placeholder (CLAUDE.md 18: 공격 예고
// 부족은 최우선 개선 대상) — idle/vulnerable/attack/telegraph each get a
// distinct, unambiguous color so the fight's rhythm is learnable before any
// art exists.
export default function BossView({ boss }: { boss: Boss }) {
  if (!boss.alive) return null;

  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (boss.phase !== 'telegraph') {
      flash.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 140, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(flash, { toValue: 0, duration: 140, useNativeDriver: true, easing: Easing.linear }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [boss.phase, flash]);

  const phaseColor =
    boss.phase === 'vulnerable'
      ? palette.uiPrimary
      : boss.phase === 'attack'
        ? palette.uiDanger
        : palette.bossAccent;
  const flashOpacity = flash.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });

  return (
    <View style={[styles.wrap, { left: boss.x, top: boss.y, width: boss.width, height: boss.height }]}>
      <View style={styles.hpRow}>
        {Array.from({ length: BOSS_HP }).map((_, i) => (
          <View key={i} style={[styles.hpPip, { backgroundColor: i < boss.hp ? palette.uiDanger : 'rgba(0,0,0,0.15)' }]} />
        ))}
      </View>
      <Animated.View
        style={[
          styles.body,
          {
            backgroundColor: phaseColor,
            borderColor: palette.bossAccentDark,
            opacity: boss.phase === 'telegraph' ? flashOpacity : 1,
            transform: [{ scaleX: boss.facing }],
          },
        ]}
      >
        <View style={[styles.eye, { backgroundColor: boss.phase === 'vulnerable' ? palette.uiPrimaryDark : palette.textDark }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  hpRow: {
    position: 'absolute',
    top: -14,
    flexDirection: 'row',
    gap: 4,
    zIndex: 2,
  },
  hpPip: {
    width: 10,
    height: 7,
    borderRadius: 2,
  },
  body: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: {
    width: '28%',
    height: '18%',
    borderRadius: 6,
  },
});
