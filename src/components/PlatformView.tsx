import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Platform } from '../game/types';
import { palette } from '../theme';

export default function PlatformView({ platform }: { platform: Platform }) {
  const isGround = platform.id.startsWith('ground');

  if (isGround) {
    return (
      <View style={[styles.base, { left: platform.x, top: platform.y, width: platform.width, height: platform.height }]}>
        <LinearGradient colors={[palette.grassTop, palette.grassMid]} style={styles.grassCap} />
        <View style={styles.dirtBody}>
          {Array.from({ length: Math.ceil(platform.width / 46) }, (_, i) => (
            <View key={i} style={[styles.dirtSeam, { left: i * 46 + 10 }]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.base, { left: platform.x, top: platform.y, width: platform.width, height: platform.height }]}>
      <LinearGradient
        colors={[palette.woodTop, palette.woodBody]}
        style={styles.plank}
      >
        <View style={styles.plankHighlight} />
        {Array.from({ length: Math.max(1, Math.round(platform.width / 34)) }, (_, i) => (
          <View key={i} style={[styles.plankSeam, { left: i * 34 }]} />
        ))}
      </LinearGradient>
      <View style={styles.plankShadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
  },
  grassCap: {
    height: 10,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  dirtBody: {
    flex: 1,
    backgroundColor: palette.dirt,
    overflow: 'hidden',
  },
  dirtSeam: {
    position: 'absolute',
    top: 4,
    bottom: 0,
    width: 3,
    backgroundColor: palette.dirtLine,
  },
  plank: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.woodDark,
    overflow: 'hidden',
  },
  plankHighlight: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  plankSeam: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  plankShadow: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: -6,
    height: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
});
