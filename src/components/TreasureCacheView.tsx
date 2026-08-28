import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { TreasureCache } from '../game/types';

export default function TreasureCacheView({ cache }: { cache: TreasureCache }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [bob]);
  if (cache.opened) return null;
  const size = cache.kind === 'rootCache' ? cache.width * 1.65 : cache.width * 1.85;
  const lift = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  return (
    <Animated.View style={[styles.wrap, { left: cache.x + cache.width / 2 - size / 2, top: cache.y + cache.height - size, width: size, height: size, transform: [{ translateY: lift }] }]}>
      {cache.kind === 'relicPod' && <View pointerEvents="none" style={styles.podGlow} />}
      <Image source={cache.kind === 'rootCache' ? require('../../assets/sprites/treasure_cache_v1/root_cache.png') : require('../../assets/sprites/treasure_cache_v1/relic_pod.png')} resizeMode="contain" style={styles.sprite} />
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  sprite: { width: '100%', height: '100%' },
  podGlow: { position: 'absolute', width: '78%', height: '78%', borderRadius: 999, backgroundColor: 'rgba(78, 215, 190, 0.22)' },
});
