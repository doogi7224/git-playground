import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { BOSS_HP } from '../game/constants';
import { Boss } from '../game/types';
import { palette } from '../theme';

const BOSS_ART: Record<Boss['phase'], ImageSourcePropType> = {
  idle: require('../../assets/sprites/boss_rootwarden_idle.png'),
  telegraph: require('../../assets/sprites/boss_rootwarden_telegraph.png'),
  attack: require('../../assets/sprites/boss_rootwarden_attack.png'),
  vulnerable: require('../../assets/sprites/boss_rootwarden_vulnerable.png'),
};

// Each combat phase has dedicated Rootwarden artwork while the existing HP
// pips and telegraph flash remain independent presentation feedback.
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

  const telegraphScale = flash.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.18] });
  const telegraphOpacity = flash.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0.18] });

  return (
    <View style={[styles.wrap, { left: boss.x, top: boss.y, width: boss.width, height: boss.height }]}>
      {boss.phase === 'telegraph' && (
        <Animated.View
          pointerEvents="none"
          style={[styles.telegraphAura, { opacity: telegraphOpacity, transform: [{ scale: telegraphScale }] }]}
        />
      )}
      <View style={styles.hpRow}>
        {Array.from({ length: BOSS_HP }).map((_, i) => (
          <View key={i} style={[styles.hpPip, { backgroundColor: i < boss.hp ? palette.uiDanger : 'rgba(0,0,0,0.15)' }]} />
        ))}
      </View>
      <Animated.Image
        source={BOSS_ART[boss.phase]}
        resizeMode="contain"
        style={[
          styles.body,
          {
            transform: [{ scaleX: boss.facing }],
          },
        ]}
      />
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
  },
  telegraphAura: {
    position: 'absolute',
    left: -16,
    top: -8,
    width: 122,
    height: 122,
    borderRadius: 61,
    borderWidth: 4,
    borderColor: '#ffb743',
    backgroundColor: 'rgba(255, 105, 41, 0.18)',
  },
});
