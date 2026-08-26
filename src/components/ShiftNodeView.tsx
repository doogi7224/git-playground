import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { BloomState, ShiftNode } from '../game/types';
import { palette } from '../theme';

// A Bloom Shift trigger: a gear-and-leaf emblem the player walks into to
// toggle the whole level between mechanical and wild states.
export default function ShiftNodeView({ node, bloomState }: { node: ShiftNode; bloomState: BloomState }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const glow = bloomState === 'mechanical' ? palette.uiPrimary : palette.moss;
  const glowDark = bloomState === 'mechanical' ? palette.uiPrimaryDark : palette.mossDark;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { left: node.x, top: node.y, width: node.width, height: node.height, transform: [{ scale }] },
      ]}
    >
      <Animated.View style={[styles.ring, { borderColor: glow }]} />
      <Animated.View style={[styles.hub, { backgroundColor: glow, borderColor: glowDark }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 4,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  hub: {
    width: '46%',
    height: '46%',
    borderRadius: 999,
    borderWidth: 2,
  },
});
