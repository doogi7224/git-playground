import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { isPistonDangerous } from '../game/physics';
import { BloomState, PressurePiston } from '../game/types';
import { PISTON_CHARGE_DURATION } from '../game/constants';
import { palette } from '../theme';

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
  const pipeColor = isWild ? palette.moss : palette.uiPrimary;
  const pipeDark = isWild ? palette.mossDark : palette.uiPrimaryDark;

  return (
    <Animated.View style={[styles.wrap, { left: piston.x, top: piston.y, width: piston.width, height: piston.height }]}>
      {!isWild && (
        <Animated.View
          style={[styles.jet, { transform: [{ scaleY: jetScaleY }], opacity: jet, backgroundColor: charging ? palette.uiDanger : '#eef2ea' }]}
        />
      )}
      <Animated.View style={[styles.nozzle, { backgroundColor: charging && !isWild ? palette.uiDanger : pipeDark }]} />
      <Animated.View style={[styles.pipe, { backgroundColor: pipeColor, borderColor: pipeDark }]}>
        <Animated.View style={[styles.stripe, { backgroundColor: pipeDark }]} />
      </Animated.View>
      {/* Base mounting bracket, drawn wider than the pipe's own hitbox — reads
          as a fixture bolted into the floor rather than a free-standing
          monster (CLAUDE.md 19.10: "몬스터라기보다 거대한 환경 장치처럼").
          Purely visual; piston.x/y/width/height (the collision rect) are
          untouched. */}
      <View style={[styles.bracket, { borderColor: pipeDark }]}>
        <View style={[styles.bolt, styles.boltL]} />
        <View style={[styles.bolt, styles.boltR]} />
      </View>
      {isWild && (
        <>
          <Animated.View style={[styles.bloomLeaf, styles.bloomLeafA]} />
          <Animated.View style={[styles.bloomLeaf, styles.bloomLeafB]} />
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pipe: {
    width: '65%',
    height: '75%',
    borderRadius: 4,
    borderWidth: 2,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    top: '35%',
    width: '100%',
    height: 4,
  },
  nozzle: {
    width: '100%',
    height: 8,
    borderRadius: 3,
  },
  jet: {
    position: 'absolute',
    bottom: '75%',
    width: 8,
    height: '80%',
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
    top: 4,
    left: -2,
  },
  bloomLeafB: {
    top: 14,
    right: -2,
  },
  bracket: {
    width: '130%',
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
