import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

export default function StartScreen({ onStart }: { onStart: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <LinearGradient colors={[palette.skyTop, palette.skyBottom]} style={styles.container}>
      <View style={styles.sunGlow}>
        <View style={styles.sunCore} />
      </View>
      <View style={[styles.hill, styles.hillFar]} />
      <View style={[styles.hill, styles.hillNear]} />

      <Text style={styles.title}>GEARWOOD</Text>
      <Text style={styles.tagline}>The Broken Spring · 파괴된 태엽</Text>
      <Text style={styles.subtitle}>새싹 스프라우트와 함께 점프해서 코그마이트를 밟고, 기어숲의 깃발까지 도착하세요!</Text>

      <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onStart}>
        <Animated.View style={[styles.startButtonShadow, { transform: [{ scale }] }]}>
          <LinearGradient colors={[palette.uiPrimary, palette.uiPrimaryDark]} style={styles.startButton}>
            <Text style={styles.startLabel}>게임 시작</Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>

      <Text style={styles.hint}>◀▶ 로 이동, ▲ 로 점프{'\n'}적을 위에서 밟으면 처치됩니다</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    overflow: 'hidden',
  },
  sunGlow: {
    position: 'absolute',
    top: 40,
    right: 60,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: palette.sunGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunCore: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.sun,
  },
  hill: {
    position: 'absolute',
    bottom: -60,
    borderRadius: 999,
  },
  hillFar: {
    left: -80,
    width: 320,
    height: 220,
    backgroundColor: palette.hillFar,
  },
  hillNear: {
    right: -100,
    width: 380,
    height: 240,
    backgroundColor: palette.hillNear,
  },
  title: {
    fontSize: 46,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    textShadowColor: palette.uiPrimaryDark,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  tagline: {
    marginTop: -8,
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '600',
    color: palette.uiPrimary,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
  },
  subtitle: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    maxWidth: 420,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowRadius: 3,
    textShadowOffset: { width: 1, height: 1 },
  },
  startButtonShadow: {
    marginTop: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  startButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  startLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#5a3d00',
  },
  hint: {
    marginTop: 20,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowRadius: 2,
  },
});
