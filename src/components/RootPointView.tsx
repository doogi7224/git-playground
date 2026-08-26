import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { RootPoint } from '../game/types';
import { palette } from '../theme';

// A fixed Root-Hook anchor: a hanging root stub the player can grapple onto
// while in range. Pulses gently to read as "interactive" against the
// background foliage.
export default function RootPointView({ point }: { point: RootPoint }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        { left: point.x, top: point.y, width: point.width, height: point.height, transform: [{ scale }] },
      ]}
    >
      <Animated.View style={styles.stub} />
      <Animated.View style={styles.bud} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  stub: {
    width: 5,
    height: '70%',
    backgroundColor: palette.mossDark,
    borderRadius: 2,
  },
  bud: {
    position: 'absolute',
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.moss,
    borderWidth: 2,
    borderColor: palette.mossDark,
  },
});
