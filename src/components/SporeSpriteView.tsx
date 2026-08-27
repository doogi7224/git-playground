import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { SporeSprite } from '../game/types';
import { palette } from '../theme';

// AI-generated illustration (matches the Sprout/Cogmite art direction) drawn
// larger than the hitbox, same convention as PlayerView/EnemyView. Its
// orbiting spore motes are already baked into the art, so the procedural
// dot-motes this view used before the illustration existed are gone.
const VISUAL_SCALE = 1.8;

export default function SporeSpriteView({ sprite }: { sprite: SporeSprite }) {
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

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] });
  const visualSize = sprite.width * VISUAL_SCALE;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          left: sprite.x + sprite.width / 2 - visualSize / 2,
          top: sprite.y + sprite.height / 2 - visualSize / 2,
          width: visualSize,
          height: visualSize,
          transform: [{ scale }],
        },
      ]}
    >
      <Animated.View pointerEvents="none" style={[styles.glow, { backgroundColor: palette.moss, opacity: glowOpacity }]} />
      <Image source={require('../../assets/sprites/spore_sprite.png')} resizeMode="contain" style={styles.sprite} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  glow: {
    position: 'absolute',
    left: '12%',
    top: '12%',
    width: '76%',
    height: '76%',
    borderRadius: 999,
  },
  sprite: {
    width: '100%',
    height: '100%',
  },
});
