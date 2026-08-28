import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { Portal } from '../game/types';
import { palette } from '../theme';

// The boss gateway is presentation-only. Its painted ruins replace the former
// dashed-circle placeholder while the existing trigger rectangle stays intact.
export default function PortalView({ portal }: { portal: Portal }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );
    pulseLoop.start();
    return () => {
      pulseLoop.stop();
    };
  }, [pulse]);

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const floatY = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <Animated.View style={[styles.wrap, { left: portal.x, top: portal.y, width: portal.width, height: portal.height }]}>
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
      <Animated.Image
        source={require('../../assets/sprites/portal_ruins_v4.png')}
        resizeMode="contain"
        style={[styles.sprite, { transform: [{ translateY: floatY }] }]}
      />
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
    width: '130%',
    height: '88%',
    borderRadius: 999,
    backgroundColor: palette.portalGlow,
  },
  sprite: {
    width: '140%',
    height: '120%',
  },
});
