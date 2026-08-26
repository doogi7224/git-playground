import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Enemy } from '../game/types';
import { palette } from '../theme';

// Cogmite: a small brass soldier-ant automaton that patrols on foot.
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
  const legSwing = bob.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '18deg'] });

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
      <Animated.View style={[styles.antenna, { left: 4, transform: [{ rotate: '-20deg' }] }]} />
      <Animated.View style={[styles.antenna, { left: 10, transform: [{ rotate: '5deg' }] }]} />

      <LinearGradient colors={[palette.enemyBody, palette.enemyBodyDark]} style={styles.head}>
        <Animated.View style={styles.visor} />
      </LinearGradient>

      <LinearGradient colors={[palette.enemyBodyDark, palette.enemyBody]} style={styles.thorax}>
        <Animated.View style={styles.rivet} />
      </LinearGradient>

      <Animated.View style={[styles.leg, { left: 2, transform: [{ rotate: legSwing }] }]} />
      <Animated.View style={[styles.leg, { right: 2, transform: [{ rotate: legSwing }] }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  antenna: {
    position: 'absolute',
    top: -6,
    width: 2,
    height: 8,
    backgroundColor: palette.enemyBodyDark,
    borderRadius: 1,
  },
  head: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    top: 0,
    height: '46%',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.enemyBodyDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visor: {
    width: '70%',
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.uiDanger,
  },
  thorax: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '40%',
    bottom: '18%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.enemyBodyDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rivet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.enemyBelly,
  },
  leg: {
    position: 'absolute',
    bottom: 0,
    width: 3,
    height: 10,
    borderRadius: 2,
    backgroundColor: palette.enemyBodyDark,
  },
});
