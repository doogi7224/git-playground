import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OVERDRIVE_MAX } from '../game/constants';
import { BloomState } from '../game/types';
import { palette } from '../theme';

export default function Hud({
  score,
  lives,
  bloomState,
  overdriveGauge,
  overdriveActive,
}: {
  score: number;
  lives: number;
  bloomState: BloomState;
  overdriveGauge: number;
  overdriveActive: boolean;
}) {
  const isWild = bloomState === 'wild';
  const gaugeFill = Math.min(1, overdriveGauge / OVERDRIVE_MAX);
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.topRow}>
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
      <View style={styles.gaugeRow}>
        <View style={[styles.gaugeTrack, overdriveActive && styles.gaugeTrackActive]}>
          <View
            style={[
              styles.gaugeFill,
              { width: `${gaugeFill * 100}%`, backgroundColor: overdriveActive ? palette.coinGold : palette.uiPrimary },
            ]}
          />
        </View>
        {overdriveActive && <Text style={styles.overdriveLabel}>오버드라이브!</Text>}
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
    paddingHorizontal: 16,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
  },
  gaugeTrack: {
    width: 140,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(20,30,45,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  gaugeTrackActive: {
    borderColor: palette.coinGold,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  overdriveLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.coinGold,
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
