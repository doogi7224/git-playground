import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { isPistonDangerous } from '../game/physics';
import { PressurePiston } from '../game/types';
import { PISTON_CHARGE_DURATION } from '../game/constants';
import { palette } from '../theme';

// AI-generated illustration (matches the Sprout/Cogmite art direction),
// drawn larger than the hitbox. The image itself is the mechanical-state
// look (brass pipe, warning stripe, rivets); wild state is represented with
// a moss tint overlay + leaf sprigs rather than a second illustration.
const VISUAL_SCALE = 1.5;

export default function PressurePistonView({ piston }: { piston: PressurePiston }) {
  const jet = useRef(new Animated.Value(0)).current;
  const dangerous = isPistonDangerous(piston);
  const charging = piston.phase < PISTON_CHARGE_DURATION;

  useEffect(() => {
    Animated.timing(jet, {
      toValue: dangerous ? 1 : 0,
      duration: dangerous ? 120 : 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [dangerous, jet]);

  const jetScaleY = jet.interpolate({ inputRange: [0, 1], outputRange: [0.05, 1] });

  const visualWidth = piston.width * VISUAL_SCALE;
  const visualHeight = piston.height * VISUAL_SCALE;
  const left = piston.x + piston.width / 2 - visualWidth / 2;
  const top = piston.y + piston.height - visualHeight;

  return (
    <View style={[styles.wrap, { left, top, width: visualWidth, height: visualHeight }]}>
      <Animated.View style={[styles.jetWrap, { transform: [{ scaleY: jetScaleY }], opacity: jet }]}>
          {/* A soft stack of puffs reads as steam; the old single flat
              rectangle looked like a hard-edged sliver next to the new
              painterly pipe art (CLAUDE.md 19 — 절차적 요소가 새 그림과 확 튀는 문제). */}
          <View style={[styles.jetPuff, styles.jetPuffBottom, { backgroundColor: charging ? palette.uiDanger : '#f4f7f0' }]} />
          <View style={[styles.jetPuff, styles.jetPuffMid, { backgroundColor: charging ? palette.uiDanger : '#f4f7f0' }]} />
          <View style={[styles.jetPuff, styles.jetPuffTop, { backgroundColor: charging ? palette.uiDanger : '#f4f7f0' }]} />
      </Animated.View>
      <Image source={require('../../assets/sprites/pressure_piston.png')} resizeMode="contain" style={styles.sprite} />
      {/* Base mounting bracket, drawn wider than the pipe's own hitbox — reads
          as a fixture bolted into the floor rather than a free-standing
          monster (CLAUDE.md 19.10: "몬스터라기보다 거대한 환경 장치처럼").
          Purely visual; piston.x/y/width/height (the collision rect) are
          untouched. */}
      <View style={[styles.bracket, { borderColor: palette.uiPrimaryDark }]}>
        <View style={[styles.bolt, styles.boltL]} />
        <View style={[styles.bolt, styles.boltR]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sprite: {
    width: '100%',
    height: '88%',
  },
  jetWrap: {
    position: 'absolute',
    top: -34,
    alignSelf: 'center',
    width: 20,
    height: 38,
    alignItems: 'center',
  },
  jetPuff: {
    position: 'absolute',
    borderRadius: 999,
  },
  jetPuffBottom: {
    bottom: 0,
    width: 12,
    height: 14,
    opacity: 0.95,
  },
  jetPuffMid: {
    bottom: 12,
    width: 16,
    height: 16,
    opacity: 0.7,
  },
  jetPuffTop: {
    bottom: 24,
    width: 20,
    height: 18,
    opacity: 0.45,
  },
  bracket: {
    width: '150%',
    height: 6,
    borderRadius: 2,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  bolt: {
    position: 'absolute',
    top: 1,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  boltL: {
    left: 3,
  },
  boltR: {
    right: 3,
  },
});
