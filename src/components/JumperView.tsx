import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { Jumper } from '../game/types';

export default function JumperView({ jumper }: { jumper: Jumper }) {
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breathe]);
  if (!jumper.alive) return null;

  const size = jumper.width * 1.75;
  const bob = breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] });
  const windup = jumper.phase === 'windup';
  const airborne = jumper.phase === 'airborne';
  const scaleX = windup ? 1.1 : airborne ? 0.88 : 1;
  const scaleY = windup ? 0.76 : airborne ? 1.14 : 1;
  return (
    <Animated.View style={[styles.wrap, { left: jumper.x + jumper.width / 2 - size / 2, top: jumper.y + jumper.height - size, width: size, height: size, transform: [{ translateY: bob }, { scaleX }, { scaleY }] }]}>
      {windup && <View pointerEvents="none" style={styles.warningRing} />}
      <Image source={require('../../assets/sprites/acorn_hopper_v1/acorn_hopper_idle.png')} resizeMode="contain" style={styles.sprite} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  sprite: { width: '100%', height: '100%' },
  warningRing: { position: 'absolute', bottom: '5%', width: '72%', height: '18%', borderRadius: 999, borderWidth: 1.5, borderColor: '#f3bd4f', backgroundColor: 'rgba(255, 203, 83, 0.18)' },
});
