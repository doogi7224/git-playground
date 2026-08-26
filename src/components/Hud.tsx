import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BloomState } from '../game/types';
import { palette } from '../theme';

export default function Hud({ score, lives, bloomState }: { score: number; lives: number; bloomState: BloomState }) {
  const isWild = bloomState === 'wild';
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.badge}>
        <View style={styles.coinDot} />
        <Text style={styles.text}>{score}</Text>
      </View>
      <View style={[styles.badge, styles.bloomBadge, { borderColor: isWild ? palette.moss : palette.uiPrimary }]}>
        <View style={[styles.bloomDot, { backgroundColor: isWild ? palette.moss : palette.uiPrimary }]} />
        <Text style={styles.text}>{isWild ? '자연' : '기계'}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.hearts}>{'♥ '.repeat(Math.max(0, lives)).trim()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,30,45,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  bloomBadge: {
    borderWidth: 1.5,
  },
  bloomDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  coinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: palette.coinGold,
    borderWidth: 1.5,
    borderColor: palette.coinGoldDark,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  hearts: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ff5f5f',
  },
});
