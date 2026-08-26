import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Enemy } from '../game/types';

// Cogmite is drawn larger than its collision box (a full-body AI-generated
// sprite with legs splayed wide) and anchored so its feet sit on the
// hitbox's bottom edge, centered on the hitbox's horizontal center.
const VISUAL_SIZE = 56;

export default function EnemyView({ enemy }: { enemy: Enemy }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 220, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  if (!enemy.alive) return null;

  const facing = enemy.vx >= 0 ? 1 : -1;
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  const left = enemy.x + enemy.width / 2 - VISUAL_SIZE / 2;
  const top = enemy.y + enemy.height - VISUAL_SIZE;

  return (
    <Animated.Image
      source={require('../../assets/sprites/cogmite.png')}
      resizeMode="contain"
      style={[
        styles.sprite,
        {
          left,
          top,
          transform: [{ translateY }, { scaleX: facing }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  sprite: {
    position: 'absolute',
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
  },
});
