import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Platform } from '../game/types';

// Collision remains authored by the game. This is intentionally a small,
// hand-painted-feeling surface treatment: the world reads as open landscape,
// not a tall block of repeated metal panels.
export default function PlatformView({ platform }: { platform: Platform }) {
  const ground = platform.id.startsWith('ground');
  const vine = platform.visibleIn === 'wild';
  const accentCount = Math.max(1, Math.floor(platform.width / (ground ? 62 : 28)));

  return (
    <View style={[styles.base, { left: platform.x, top: platform.y, width: platform.width, height: platform.height }]}>
      <LinearGradient colors={ground ? ['#a8dd70', '#4e9a4f'] : vine ? ['#c4ec86', '#5b9d4f'] : ['#b8df72', '#57954a']} style={styles.mossCap}>
        {Array.from({ length: accentCount }, (_, index) => (
          <View key={index} style={[styles.grassTuft, { left: 8 + index * (ground ? 62 : 28) }]} />
        ))}
      </LinearGradient>
      {ground ? (
        <LinearGradient colors={['#745238', '#3c2a24']} style={styles.earth}>
          {Array.from({ length: accentCount }, (_, index) => (
            <View key={index} style={[styles.earthStone, { left: 18 + index * 62, top: 12 + (index % 2) * 12 }]} />
          ))}
        </LinearGradient>
      ) : (
        <View style={styles.floatingBody}>
          <View style={styles.rootLine} />
          <View style={[styles.rootLine, styles.rootLineShort]} />
        </View>
      )}
      {!ground && <View style={styles.shadow} />}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { position: 'absolute' },
  mossCap: { height: 8, borderTopLeftRadius: 5, borderTopRightRadius: 5, overflow: 'visible' },
  grassTuft: { position: 'absolute', top: -3, width: 9, height: 6, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(222,255,174,0.75)' },
  earth: { flex: 1, overflow: 'hidden', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  earthStone: { position: 'absolute', width: 9, height: 6, borderRadius: 4, backgroundColor: 'rgba(184,137,91,0.34)', transform: [{ rotate: '-12deg' }] },
  floatingBody: { minHeight: 7, flex: 1, overflow: 'hidden', backgroundColor: '#5e4432', borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  rootLine: { position: 'absolute', top: 4, left: '18%', width: '66%', height: 2, borderRadius: 2, backgroundColor: 'rgba(220,175,106,0.4)' },
  rootLineShort: { top: 8, left: '32%', width: '32%', backgroundColor: 'rgba(44,31,24,0.35)' },
  shadow: { position: 'absolute', top: '100%', left: 3, right: 3, height: 4, borderRadius: 5, backgroundColor: 'rgba(21,42,35,0.28)' },
});
