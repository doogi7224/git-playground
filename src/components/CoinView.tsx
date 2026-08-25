import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Coin } from '../game/types';
import { palette } from '../theme';

export default function CoinView({ coin }: { coin: Coin }) {
  const spin = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, useNativeDriver: true })
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    );
    spinLoop.start();
    floatLoop.start();
    return () => {
      spinLoop.stop();
      floatLoop.stop();
    };
  }, [spin, float]);

  if (coin.collected) return null;

  const scaleX = spin.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0.15, 1, 0.15, 1],
  });
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        { left: coin.x, top: coin.y, width: coin.width, height: coin.height, transform: [{ translateY }] },
      ]}
    >
      <Animated.View style={[styles.coinInner, { transform: [{ scaleX }] }]}>
        <LinearGradient colors={[palette.coinShine, palette.coinGold, palette.coinGoldDark]} style={styles.coin} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  coinInner: {
    width: '100%',
    height: '100%',
  },
  coin: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: palette.coinGoldDark,
  },
});
