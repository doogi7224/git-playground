import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Platform } from '../game/types';
import { palette } from '../theme';

// AI-generated illustrations (matches the Sprout/Cogmite art direction).
// Both source images are a horizontally-repeating band (evenly spaced rivets /
// woven vines), so instead of stretching one image across a platform's full
// width — which would squash or smear the rivet/weave pattern differently on
// every platform — we tile fixed-aspect copies across the width, the same
// "array of repeated children" convention this file already used for
// dirtSeam/rivet/leafBump. Drawn slightly taller than the collision box
// (graphic vs. hitbox stay separate, CLAUDE.md 19) so the detail reads at
// this platform's small on-screen size; platform.x/y/width/height (the
// actual collision rect) are untouched.
const PLANK_MECH_SOURCE = require('../../assets/platforms/plank_mech.png');
const PLANK_WILD_SOURCE = require('../../assets/platforms/plank_wild.png');
const PLANK_IMAGE_ASPECT = 700 / 391;
const PLANK_VISUAL_SCALE = 1.4;

function PlankTiles({ width, height, source }: { width: number; height: number; source: number }) {
  const visualHeight = height * PLANK_VISUAL_SCALE;
  const tileWidth = visualHeight * PLANK_IMAGE_ASPECT;
  const tileCount = Math.max(1, Math.ceil(width / tileWidth));
  const top = (height - visualHeight) / 2;
  return (
    <View style={[styles.plankClip, { width, height }]}>
      {Array.from({ length: tileCount }, (_, i) => (
        <Image
          key={i}
          source={source}
          resizeMode="stretch"
          style={{ position: 'absolute', left: i * tileWidth, top, width: tileWidth, height: visualHeight }}
        />
      ))}
    </View>
  );
}

export default function PlatformView({ platform }: { platform: Platform }) {
  const isGround = platform.id.startsWith('ground');

  if (isGround) {
    return (
      <View style={[styles.base, { left: platform.x, top: platform.y, width: platform.width, height: platform.height }]}>
        <LinearGradient colors={[palette.grassTop, palette.grassMid]} style={styles.grassCap}>
          {Array.from({ length: Math.ceil(platform.width / 46) }, (_, i) => (
            <View key={i} style={[styles.rivet, { left: i * 46 + 20 }]} />
          ))}
        </LinearGradient>
        <View style={styles.dirtBody}>
          {Array.from({ length: Math.ceil(platform.width / 46) }, (_, i) => (
            <View key={i} style={[styles.dirtSeam, { left: i * 46 + 10 }]} />
          ))}
        </View>
      </View>
    );
  }

  if (platform.visibleIn === 'wild') {
    return (
      <View style={[styles.base, { left: platform.x, top: platform.y, width: platform.width, height: platform.height }]}>
        <PlankTiles width={platform.width} height={platform.height} source={PLANK_WILD_SOURCE} />
        <View style={styles.plankShadow} />
      </View>
    );
  }

  return (
    <View style={[styles.base, { left: platform.x, top: platform.y, width: platform.width, height: platform.height }]}>
      <PlankTiles width={platform.width} height={platform.height} source={PLANK_MECH_SOURCE} />
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
  rivet: {
    position: 'absolute',
    top: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.25)',
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
  plankClip: {
    overflow: 'hidden',
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
