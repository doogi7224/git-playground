import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
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
  if (cache.opened && cache.kind === 'relicPod') return null;
  const isMysteryBlock = cache.kind === 'rootCache';
  const size = isMysteryBlock ? cache.width * 1.1 : cache.width * 1.7;
  const lift = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  return (
    <Animated.View style={[styles.wrap, { left: cache.x + cache.width / 2 - size / 2, top: cache.y + cache.height - size, width: size, height: size, transform: isMysteryBlock ? [] : [{ translateY: lift }] }]}>
      {isMysteryBlock ? (
        <View style={[styles.mysteryBlock, cache.opened && styles.spentBlock]}>
          <View style={styles.blockInset} />
          <Text style={[styles.questionMark, cache.opened && styles.spentMark]}>{cache.opened ? '·' : '?'}</Text>
          <View style={[styles.rivet, styles.rivetTL]} /><View style={[styles.rivet, styles.rivetTR]} />
          <View style={[styles.rivet, styles.rivetBL]} /><View style={[styles.rivet, styles.rivetBR]} />
        </View>
      ) : (
        <>
          <View pointerEvents="none" style={styles.podGlow} />
          <Image source={require('../../assets/sprites/treasure_cache_v1/relic_pod.png')} resizeMode="contain" style={styles.sprite} />
        </>
      )}
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  sprite: { width: '100%', height: '100%' },
  podGlow: { position: 'absolute', width: '78%', height: '78%', borderRadius: 999, backgroundColor: 'rgba(78, 215, 190, 0.22)' },
  mysteryBlock: { width: '100%', height: '100%', borderRadius: 5, borderWidth: 2, borderColor: '#65461f', backgroundColor: '#d99232', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  spentBlock: { borderColor: '#50483a', backgroundColor: '#766b58' },
  blockInset: { position: 'absolute', left: 3, right: 3, top: 3, bottom: 3, borderWidth: 1, borderColor: 'rgba(255,238,151,0.55)', borderRadius: 3 },
  questionMark: { color: '#fff0a5', fontSize: 20, lineHeight: 23, fontWeight: '900', textShadowColor: '#6b3f15', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 0 },
  spentMark: { color: '#b9ae97' },
  rivet: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: '#70481d' },
  rivetTL: { left: 2, top: 2 }, rivetTR: { right: 2, top: 2 }, rivetBL: { left: 2, bottom: 2 }, rivetBR: { right: 2, bottom: 2 },
});
