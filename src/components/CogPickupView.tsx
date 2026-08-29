import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { CogPickup } from '../game/types';

export const COG_SOURCES: Record<CogPickup['cogType'], number> = {
  magnet: require('../../assets/sprites/cogs/cog_magnet_v1.png'),
  mirror: require('../../assets/sprites/cogs/cog_mirror_v1.png'),
};

// The relic itself stays one coherent painted material. Its soft aura carries
// the slot/type colour so the sprite never turns into a flat tinted icon.
export const COG_COLORS: Record<CogPickup['cogType'], string> = {
  magnet: '#7a9188', // body: coin pull
  mirror: '#6fa8dc', // head: one-hit shield
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
        { left: cog.x - 4, top: cog.y - 4, width: cog.width + 8, height: cog.height + 8, transform: [{ rotate }] },
      ]}
    >
      <View style={[styles.aura, { backgroundColor: color }]} />
      <Animated.Image source={COG_SOURCES[cog.cogType]} resizeMode="contain" style={styles.sprite} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  aura: { position: 'absolute', width: '86%', height: '86%', borderRadius: 999, opacity: 0.22 },
  sprite: { position: 'absolute', width: '100%', height: '100%' },
});
