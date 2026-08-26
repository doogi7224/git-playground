import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
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
});
