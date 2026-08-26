import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { Enemy } from '../game/types';

// Cogmite is drawn larger than its collision box (a full-body AI-generated
// sprite with legs splayed wide) and anchored so its feet sit on the
// hitbox's bottom edge, centered on the hitbox's horizontal center.
const VISUAL_SIZE = 56;

export default function EnemyView({ enemy }: { enemy: Enemy }) {
  const walk = useRef(new Animated.Value(0)).current;
  const turn = useRef(new Animated.Value(1)).current;
  const prevFacing = useRef(enemy.vx >= 0 ? 1 : -1);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(walk, { toValue: 1, duration: 440, useNativeDriver: true, easing: Easing.linear })
    );
    loop.start();
    return () => loop.stop();
  }, [walk]);

  const facing = enemy.vx >= 0 ? 1 : -1;

  useEffect(() => {
    if (facing !== prevFacing.current) {
      prevFacing.current = facing;
      turn.setValue(0.7);
      Animated.spring(turn, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 20 }).start();
    }
  }, [facing, turn]);

  if (!enemy.alive) return null;

  // A waddling walk cycle: bob up on each "step" and rock side to side.
  const bobY = walk.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -3, 0] });
  const waddle = walk.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['-6deg', '0deg', '6deg', '0deg', '-6deg'] });

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
          transform: [{ translateY: bobY }, { scaleX: facing }, { scale: turn }, { rotate: waddle }],
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
