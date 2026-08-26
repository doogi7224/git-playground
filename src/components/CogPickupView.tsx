import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { CogPickup } from '../game/types';
import { palette } from '../theme';

// Gear Socket cog pickup: a spinning brass gear, tinted per cog type so the
// five are distinguishable at a glance. Auto-equips into its slot on pickup
// (see physics.ts), so there's no separate equip UI to render here.
export const COG_COLORS: Record<CogPickup['cogType'], string> = {
  spring: '#e0a94f', // foot: jump boost
  magnet: '#7a9188', // body: coin pull
  steamBoost: '#b1502e', // foot: dash coast
  rootHookCog: '#3c7a56', // body: grapple range
  mirror: '#6fa8dc', // head: respawn rewind
};

export default function CogPickupView({ cog }: { cog: CogPickup }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2400, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  if (cog.collected) return null;

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const color = COG_COLORS[cog.cogType];

  return (
    <Animated.View
      style={[
        styles.wrap,
        { left: cog.x, top: cog.y, width: cog.width, height: cog.height, transform: [{ rotate }] },
      ]}
    >
      <View style={[styles.tooth, styles.toothN, { backgroundColor: color }]} />
      <View style={[styles.tooth, styles.toothE, { backgroundColor: color }]} />
      <View style={[styles.tooth, styles.toothS, { backgroundColor: color }]} />
      <View style={[styles.tooth, styles.toothW, { backgroundColor: color }]} />
      <View style={[styles.ring, { borderColor: color }]} />
      <View style={styles.hub} />
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
    width: '82%',
    height: '82%',
    borderRadius: 999,
    borderWidth: 4,
    backgroundColor: palette.woodTop,
  },
  hub: {
    position: 'absolute',
    width: '32%',
    height: '32%',
    borderRadius: 999,
    backgroundColor: palette.woodDark,
  },
  tooth: {
    position: 'absolute',
    width: '22%',
    height: '22%',
    borderRadius: 2,
  },
  toothN: { top: 0 },
  toothS: { bottom: 0 },
  toothE: { right: 0 },
  toothW: { left: 0 },
});
