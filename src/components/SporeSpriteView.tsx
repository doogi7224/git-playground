import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { BloomState, SporeSprite } from '../game/types';
import { palette } from '../theme';

// AI-generated illustration (matches the Sprout/Cogmite art direction) drawn
// larger than the hitbox, same convention as PlayerView/EnemyView. Its
// orbiting spore motes are already baked into the art, so the procedural
// dot-motes this view used before the illustration existed are gone.
const VISUAL_SCALE = 1.8;

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

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] });
  const isMechanical = bloomState === 'mechanical';
  const glowColor = isMechanical ? palette.uiPrimary : palette.moss;
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
      <Animated.View pointerEvents="none" style={[styles.glow, { backgroundColor: glowColor, opacity: glowOpacity }]} />
      <Image source={require('../../assets/sprites/spore_sprite.png')} resizeMode="contain" style={styles.sprite} />
      {/* Mechanical state recolors the mood without hiding the illustration's
          own shading, matching the tint-overlay pattern used elsewhere. */}
      {isMechanical && <View pointerEvents="none" style={styles.mechTint} />}
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
  mechTint: {
    position: 'absolute',
    left: '18%',
    top: '18%',
    width: '64%',
    height: '64%',
    borderRadius: 999,
    backgroundColor: 'rgba(169,118,47,0.32)',
  },
});
