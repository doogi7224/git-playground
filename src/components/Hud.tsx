import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Hud({ score, lives }: { score: number; lives: number }) {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text}>🪙 {score}</Text>
      <Text style={styles.text}>{'❤️'.repeat(Math.max(0, lives))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
    textShadowOffset: { width: 1, height: 1 },
  },
});
