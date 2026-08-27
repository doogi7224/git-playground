import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { isPistonDangerous } from '../game/physics';
import { BloomState, PressurePiston } from '../game/types';
import { PISTON_CHARGE_DURATION } from '../game/constants';
import { palette } from '../theme';

// AI-generated illustration (matches the Sprout/Cogmite art direction),
// drawn larger than the hitbox. The image itself is the mechanical-state
// look (brass pipe, warning stripe, rivets); wild state is represented with
// a moss tint overlay + leaf sprigs rather than a second illustration.
const VISUAL_SCALE = 1.5;

export default function PressurePistonView({ piston, bloomState }: { piston: PressurePiston; bloomState: BloomState }) {
  const jet = useRef(new Animated.Value(0)).current;
  const dangerous = isPistonDangerous(piston, bloomState);
  const charging = bloomState === 'mechanical' && piston.phase < PISTON_CHARGE_DURATION;

  useEffect(() => {
    Animated.timing(jet, {
      toValue: dangerous ? 1 : 0,
      duration: dangerous ? 120 : 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [dangerous, jet]);

  const jetScaleY = jet.interpolate({ inputRange: [0, 1], outputRange: [0.05, 1] });
  const isWild = bloomState === 'wild';

  const visualWidth = piston.width * VISUAL_SCALE;
  const visualHeight = piston.height * VISUAL_SCALE;
  const left = piston.x + piston.width / 2 - visualWidth / 2;
  const top = piston.y + piston.height - visualHeight;

  return (
    <View style={[styles.wrap, { left, top, width: visualWidth, height: visualHeight }]}>
      {!isWild && (
        <Animated.View
          style={[styles.jet, { transform: [{ scaleY: jetScaleY }], opacity: jet, backgroundColor: charging ? palette.uiDanger : '#eef2ea' }]}
        />
      )}
      <Image source={require('../../assets/sprites/pressure_piston.png')} resizeMode="contain" style={styles.sprite} />
      {isWild && <View pointerEvents="none" style={styles.wildTint} />}
      {/* Base mounting bracket, drawn wider than the pipe's own hitbox — reads
          as a fixture bolted into the floor rather than a free-standing
          monster (CLAUDE.md 19.10: "몬스터라기보다 거대한 환경 장치처럼").
          Purely visual; piston.x/y/width/height (the collision rect) are
          untouched. */}
      <View style={[styles.bracket, { borderColor: isWild ? palette.mossDark : palette.uiPrimaryDark }]}>
        <View style={[styles.bolt, styles.boltL]} />
        <View style={[styles.bolt, styles.boltR]} />
      </View>
      {isWild && (
        <>
          <View style={[styles.bloomLeaf, styles.bloomLeafA]} />
          <View style={[styles.bloomLeaf, styles.bloomLeafB]} />
        </>
      )}
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
  wildTint: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: '88%',
    borderRadius: 8,
    backgroundColor: 'rgba(60,122,86,0.4)',
  },
  jet: {
    position: 'absolute',
    top: -30,
    alignSelf: 'center',
    width: 8,
    height: 34,
    borderRadius: 4,
  },
  bloomLeaf: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.mossTint,
  },
  bloomLeafA: {
    top: '30%',
    left: -4,
  },
  bloomLeafB: {
    top: '45%',
    right: -4,
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
