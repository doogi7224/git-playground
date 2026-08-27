import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { palette } from '../theme';

interface Props {
  cameraX: number;
  worldWidth: number;
  viewportWidth: number;
  viewportHeight: number;
}

// How much slower the far scene layer scrolls than the camera. Deliberately
// slow (real distant mountains barely move) — this also keeps the tiled
// scene painting's repeat seam rare, since the layer only travels a fraction
// of the level's width (see FAR_FACTOR usage below).
const FAR_FACTOR = 0.15;

// One painterly forest scene keeps the world readable and lets parallax
// support the run instead of introducing a second ruleset.
const SCENE_WILD_SOURCE = require('../../assets/backgrounds/scene_wild_v2.png');

// Memoized so this (large, tiled full-screen images) subtree is skipped on
// the 60fps re-renders `cameraX` drives in the parent — its own props only
// ever change on a Bloom Shift or a viewport resize, never per frame
// (CLAUDE.md 18.7: avoid unnecessary per-frame work).
const SceneTiles = React.memo(function SceneTiles({
  source,
  tileWidth,
  tileCount,
  height,
}: {
  source: number;
  tileWidth: number;
  tileCount: number;
  height: number;
}) {
  return (
    <View style={styles.fill}>
      {Array.from({ length: tileCount }, (_, i) => (
        <Image
          key={i}
          source={source}
          resizeMode="cover"
          style={{ position: 'absolute', left: i * tileWidth, top: 0, width: tileWidth, height }}
        />
      ))}
    </View>
  );
});

export default function Background({ cameraX, worldWidth, viewportWidth, viewportHeight }: Props) {
  const farOffset = -cameraX * FAR_FACTOR;

  // Each tile is a full viewport-width crop of the scene painting (via
  // resizeMode="cover"), not the image's own natural aspect width — sizing
  // tiles to the image's aspect would make them narrower than the screen, so
  // 2+ identical copies would always be visible side by side at once. One
  // viewport-wide tile keeps a repeat off-screen except right at its seam.
  const tileWidth = viewportWidth;
  // The far layer only ever needs to cover the range the camera can actually
  // scroll it through — viewportWidth plus the max parallax travel — not the
  // full level width, which would tile (and repeat) the scene painting far
  // more often than the player can ever see.
  const farLayerWidth = viewportWidth + worldWidth * FAR_FACTOR;
  const tileCount = Math.max(1, Math.ceil(farLayerWidth / tileWidth) + 1);

  return (
    <View style={[styles.fill, { height: viewportHeight }]} pointerEvents="none">
      <LinearGradient colors={[palette.skyTop, palette.skyBottom]} style={styles.fill} />

      <View style={[styles.parallaxLayer, { width: farLayerWidth, transform: [{ translateX: farOffset }] }]}>
        <SceneTiles source={SCENE_WILD_SOURCE} tileWidth={tileWidth} tileCount={tileCount} height={viewportHeight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  parallaxLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});
