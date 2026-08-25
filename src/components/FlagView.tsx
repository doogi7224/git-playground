import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Flag } from '../game/types';
import { palette } from '../theme';

export default function FlagView({ flag }: { flag: Flag }) {
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(wave, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [wave]);

  const skewY = wave.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] });

  return (
    <View style={[styles.wrap, { left: flag.x, top: flag.y, width: flag.width, height: flag.height }]}>
      <LinearGradient colors={[palette.flagPole, palette.flagPoleDark]} style={styles.pole} />
      <View style={styles.ball} />
      <Animated.View style={[styles.clothWrap, { transform: [{ skewY }] }]}>
        <LinearGradient colors={[palette.flagCloth, palette.flagClothDark]} style={styles.cloth} />
      </Animated.View>
      <View style={styles.base} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  pole: {
    position: 'absolute',
    left: '46%',
    top: 6,
    bottom: 0,
    width: 4,
    borderRadius: 2,
  },
  ball: {
    position: 'absolute',
    top: 0,
    left: '46%',
    marginLeft: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.coinGold,
    borderWidth: 1,
    borderColor: palette.coinGoldDark,
  },
  clothWrap: {
    position: 'absolute',
    top: 8,
    left: '50%',
  },
  cloth: {
    width: 26,
    height: 18,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  base: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.dirtDark,
  },
});
