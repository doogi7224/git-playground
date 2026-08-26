import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { BloomState, SporeSprite } from '../game/types';
import { palette } from '../theme';

export default function SporeSpriteView({ sprite, bloomState }: { sprite: SporeSprite; bloomState: BloomState }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] });
  const isMechanical = bloomState === 'mechanical';
  const bodyColor = isMechanical ? palette.uiPrimary : 'rgba(116, 194, 148, 0.5)';
  const coreColor = isMechanical ? palette.uiPrimaryDark : palette.moss;

  return (
    <Animated.View
      style={[
        styles.body,
        {
          left: sprite.x,
          top: sprite.y,
          width: sprite.width,
          height: sprite.height,
          backgroundColor: bodyColor,
          transform: [{ scale }],
        },
      ]}
    >
      <Animated.View style={[styles.core, { backgroundColor: coreColor }]} />
      <Animated.View style={[styles.mote, styles.moteA, { backgroundColor: palette.mossTint, opacity: pulse }]} />
      <Animated.View style={[styles.mote, styles.moteB, { backgroundColor: palette.mossTint, opacity: pulse }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mote: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  moteA: {
    top: -4,
    left: -4,
  },
  moteB: {
    bottom: -4,
    right: -4,
  },
});
