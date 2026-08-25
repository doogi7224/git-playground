import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Enemy } from '../game/types';
import { palette } from '../theme';

export default function EnemyView({ enemy }: { enemy: Enemy }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 260, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  if (!enemy.alive) return null;

  const facing = enemy.vx >= 0 ? 1 : -1;
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          left: enemy.x,
          top: enemy.y,
          width: enemy.width,
          height: enemy.height,
          transform: [{ translateY }, { scaleX: facing }],
        },
      ]}
    >
      <LinearGradient colors={[palette.enemyBody, palette.enemyBodyDark]} style={styles.cap}>
        <Animated.View style={styles.spot} />
        <Animated.View style={[styles.spot, { left: undefined, right: 4 }]} />
      </LinearGradient>
      <Animated.View style={styles.belly} />
      <Animated.View style={styles.browLeft} />
      <Animated.View style={styles.browRight} />
      <Animated.View style={[styles.foot, { left: 2 }]} />
      <Animated.View style={[styles.foot, { right: 2 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  cap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '68%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 2,
    borderColor: palette.enemyBodyDark,
  },
  spot: {
    position: 'absolute',
    top: 5,
    left: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  belly: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    bottom: 2,
    height: '34%',
    backgroundColor: palette.enemyBelly,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  browLeft: {
    position: 'absolute',
    top: '30%',
    left: '16%',
    width: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2a1b0e',
    transform: [{ rotate: '-15deg' }],
  },
  browRight: {
    position: 'absolute',
    top: '30%',
    right: '16%',
    width: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2a1b0e',
    transform: [{ rotate: '15deg' }],
  },
  foot: {
    position: 'absolute',
    bottom: -2,
    width: 10,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.enemyBodyDark,
  },
});
