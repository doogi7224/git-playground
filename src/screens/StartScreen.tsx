import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pixel Hopper</Text>
      <Text style={styles.subtitle}>점프해서 적을 밟고, 코인을 모아 깃발까지 도착하세요!</Text>
      <Pressable style={({ pressed }) => [styles.startButton, pressed && styles.pressed]} onPress={onStart}>
        <Text style={styles.startLabel}>게임 시작</Text>
      </Pressable>
      <Text style={styles.hint}>◀▶ 로 이동, ▲ 로 점프{'\n'}적을 위에서 밟으면 처치됩니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5cb0f0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 4,
    textShadowOffset: { width: 2, height: 2 },
  },
  subtitle: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    maxWidth: 420,
  },
  startButton: {
    marginTop: 12,
    backgroundColor: '#ffd54a',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#c99a1f',
  },
  pressed: {
    opacity: 0.7,
  },
  startLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#5a3d00',
  },
  hint: {
    marginTop: 20,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
});
