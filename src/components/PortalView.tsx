import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { Portal } from '../game/types';
import { palette } from '../theme';

// Placeholder presentation for the gateway into the boss arena — a procedural
// pulsing ring that signals the boss arena without adding another interaction.
// later without touching the trigger logic in physics.ts (Portal has no
// collision of its own; it's purely a marker `stepGame` crosses once).
export default function PortalView({ portal }: { portal: Portal }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    const spinLoop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 4000, useNativeDriver: true, easing: Easing.linear }));
    pulseLoop.start();
    spinLoop.start();
    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulse, spin]);

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.wrap, { left: portal.x, top: portal.y, width: portal.width, height: portal.height }]}>
      <Animated.View style={[styles.glow, { backgroundColor: palette.portalGlow, opacity: glowOpacity }]} />
      <Animated.View style={[styles.ringOuter, { borderColor: palette.portalGlow, transform: [{ rotate }] }]} />
      <Animated.View style={[styles.core, { backgroundColor: palette.portalGlowDark }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: '160%',
    height: '90%',
    borderRadius: 999,
  },
  ringOuter: {
    position: 'absolute',
    width: '85%',
    height: '96%',
    borderRadius: 999,
    borderWidth: 4,
    borderStyle: 'dashed',
  },
  core: {
    width: '55%',
    height: '88%',
    borderRadius: 999,
  },
});
