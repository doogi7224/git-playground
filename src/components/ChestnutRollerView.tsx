import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { ChestnutRoller } from '../game/types';

const WALK_FRAME_DISTANCE = 16;
const WALK_FRAMES = [
  require('../../assets/sprites/chestnut_roller_v2_walk/chestnut_walk_0.png'),
  require('../../assets/sprites/chestnut_roller_v2_walk/chestnut_walk_1.png'),
  require('../../assets/sprites/chestnut_roller_v2_walk/chestnut_walk_2.png'),
  require('../../assets/sprites/chestnut_roller_v2_walk/chestnut_walk_3.png'),
] satisfies ImageSourcePropType[];

// Presentation only: the physics state decides vulnerability and speed. This
// component turns that state into an obvious silhouette -- limbs visible when
// vulnerable, a sealed spinning shell when rolling.
export default function ChestnutRollerView({ roller }: { roller: ChestnutRoller }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (roller.phase !== 'rolling') {
      spin.stopAnimation();
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(spin, {
      toValue: 1,
      duration: 260,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    loop.start();
    return () => loop.stop();
  }, [roller.phase, spin]);

  if (!roller.alive) return null;

  const rolling = roller.phase === 'rolling';
  const windup = roller.phase === 'windup';
  const recover = roller.phase === 'recover';
  const size = rolling ? roller.width * 1.6 : roller.width * 1.8;
  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scaleX = windup ? 1.13 : recover ? 0.92 : 1;
  const scaleY = windup ? 0.74 : recover ? 0.78 : 1;
  const walkFrame = WALK_FRAMES[
    Math.floor(Math.abs(roller.x) / WALK_FRAME_DISTANCE) % WALK_FRAMES.length
  ];

  return (
    <View style={[styles.wrap, { left: roller.x + roller.width / 2 - size / 2, top: roller.y + roller.height - size, width: size, height: size }]}>
      {rolling && <View pointerEvents="none" style={styles.rollAura} />}
      {windup && <View pointerEvents="none" style={styles.warnRing} />}
      <Animated.View style={[styles.spriteWrap, { transform: [{ scaleX: scaleX * roller.facing }, { scaleY }, ...(rolling ? [{ rotate: rotation }] : [])] }]}>
        <Image
          source={rolling
            ? require('../../assets/sprites/chestnut_roller_v1/chestnut_roller_roll.png')
            : walkFrame}
          resizeMode="contain"
          style={styles.sprite}
        />
      </Animated.View>
      {rolling && <View pointerEvents="none" style={[styles.dust, { left: roller.facing > 0 ? '-18%' : '72%' }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  spriteWrap: { width: '100%', height: '100%' },
  sprite: { width: '100%', height: '100%' },
  rollAura: { position: 'absolute', width: '106%', height: '106%', borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255, 222, 116, 0.72)', backgroundColor: 'rgba(247, 179, 54, 0.12)' },
  warnRing: { position: 'absolute', bottom: '4%', width: '90%', height: '17%', borderRadius: 999, borderWidth: 1.5, borderColor: '#f0b64c', backgroundColor: 'rgba(255, 189, 75, 0.2)' },
  dust: { position: 'absolute', bottom: '8%', width: '28%', height: '16%', borderRadius: 999, backgroundColor: 'rgba(220, 184, 108, 0.52)' },
});
