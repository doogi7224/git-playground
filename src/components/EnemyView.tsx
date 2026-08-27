import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { BloomState, Enemy } from '../game/types';
import { palette } from '../theme';

// Cogmite is drawn larger than its collision box (a full-body AI-generated
// sprite with legs splayed wide) and anchored so its feet sit on the
// hitbox's bottom edge, centered on the hitbox's horizontal center.
const VISUAL_SIZE = 56;
const WALK_FRAME_DISTANCE = 18;
const COGMITE_FRAMES = {
  idle: [
    require('../../assets/sprites/cogmite_v2/cogmite_idle_0.png'),
    require('../../assets/sprites/cogmite_v2/cogmite_idle_1.png'),
  ],
  walk: [
    require('../../assets/sprites/cogmite_v2/cogmite_walk_0.png'),
    require('../../assets/sprites/cogmite_v2/cogmite_walk_1.png'),
    require('../../assets/sprites/cogmite_v2/cogmite_walk_2.png'),
    require('../../assets/sprites/cogmite_v2/cogmite_walk_3.png'),
  ],
  alert: require('../../assets/sprites/cogmite_v2/cogmite_alert.png'),
} satisfies {
  idle: ImageSourcePropType[];
  walk: ImageSourcePropType[];
  alert: ImageSourcePropType;
};

export default function EnemyView({ enemy, bloomState }: { enemy: Enemy; bloomState: BloomState }) {
  const charging = enemy.chargeDir !== 0;
  const docile = bloomState === 'wild';
  // Wild tames it (slower, stiffer waddle); charging is urgent (faster).
  const walkDuration = charging ? 220 : docile ? 700 : 440;

  const walk = useRef(new Animated.Value(0)).current;
  const turn = useRef(new Animated.Value(1)).current;
  const prevFacing = useRef(enemy.vx >= 0 ? 1 : -1);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(walk, { toValue: 1, duration: walkDuration, useNativeDriver: true, easing: Easing.linear })
    );
    loop.start();
    return () => loop.stop();
  }, [walk, walkDuration]);

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
  const spriteSource: ImageSourcePropType = charging
    ? COGMITE_FRAMES.alert
    : COGMITE_FRAMES.walk[Math.floor(Math.abs(enemy.x) / WALK_FRAME_DISTANCE) % COGMITE_FRAMES.walk.length];

  return (
    <View style={[styles.wrap, { left, top }]}>
      <Animated.Image
        source={spriteSource}
        resizeMode="contain"
        style={[
          styles.sprite,
          { transform: [{ translateY: bobY }, { scaleX: facing }, { scale: turn }, { rotate: waddle }] },
        ]}
      />
      {charging && <View style={styles.alertDot} />}
      {docile && <View style={styles.mossPatch} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
  },
  sprite: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  alertDot: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.uiDanger,
  },
  mossPatch: {
    position: 'absolute',
    top: 6,
    left: '50%',
    marginLeft: -7,
    width: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.moss,
    opacity: 0.85,
  },
});
