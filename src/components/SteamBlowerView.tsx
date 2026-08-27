import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { isFlameLobActive, isSteamGustActive } from '../game/physics';
import { SteamBlower } from '../game/types';
import { STEAMBLOWER_HP, STEAM_GUST_RANGE, FLAME_LOB_RANGE } from '../game/constants';
import { palette } from '../theme';

// AI-generated illustration (matches the Sprout/Cogmite art direction),
// drawn larger than the hitbox — a mini-boss should read as bigger and more
// threatening than the small monsters, per CLAUDE.md 19.10. The artwork
// itself is the wild-state look (cap open, weak point exposed); mechanical
// state is represented by sealing a brass dome over the cap rather than a
// second illustration.
const VISUAL_SCALE = 1.6;

export default function SteamBlowerView({ blower }: { blower: SteamBlower }) {
  if (!blower.alive) return null;

  const gusting = isSteamGustActive(blower);
  const lobbing = isFlameLobActive(blower);

  const visualWidth = blower.width * VISUAL_SCALE;
  const visualHeight = blower.height * VISUAL_SCALE;
  const left = blower.x + blower.width / 2 - visualWidth / 2;
  const top = blower.y + blower.height - visualHeight;

  return (
    <View style={[styles.wrap, { left, top, width: visualWidth, height: visualHeight }]}>
      <View style={styles.hpRow}>
        {Array.from({ length: STEAMBLOWER_HP }).map((_, i) => (
          <View key={i} style={[styles.hpPip, { backgroundColor: i < blower.hp ? palette.uiDanger : 'rgba(0,0,0,0.15)' }]} />
        ))}
      </View>

      {gusting && (
        <>
          <View style={[styles.gust, styles.gustLeft, { width: STEAM_GUST_RANGE }]} />
          <View style={[styles.gust, styles.gustRight, { width: STEAM_GUST_RANGE }]} />
        </>
      )}
      {lobbing && (
        <>
          <View style={[styles.ember, { left: -FLAME_LOB_RANGE * 0.6 }]} />
          <View style={[styles.ember, { right: -FLAME_LOB_RANGE * 0.6 }]} />
        </>
      )}

      <Image source={require('../../assets/sprites/steam_blower.png')} resizeMode="contain" style={styles.sprite} />

    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  sprite: {
    width: '100%',
    height: '100%',
  },
  hpRow: {
    position: 'absolute',
    top: -12,
    flexDirection: 'row',
    gap: 3,
    zIndex: 2,
  },
  hpPip: {
    width: 8,
    height: 6,
    borderRadius: 2,
  },
  gust: {
    position: 'absolute',
    top: '55%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(238, 242, 234, 0.85)',
  },
  gustLeft: {
    right: '100%',
  },
  gustRight: {
    left: '100%',
  },
  ember: {
    position: 'absolute',
    top: '10%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.uiDanger,
  },
});
