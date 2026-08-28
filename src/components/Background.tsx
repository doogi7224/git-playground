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
const SCENE_WILD_SOURCE = require('../../assets/backgrounds/scene_alpine_valley_v4.png');
const SCENE_WATERFALL_SOURCE = require('../../assets/backgrounds/scene_forest_waterfall_v3.png');
const SCENE_RUINS_SOURCE = require('../../assets/backgrounds/scene_forest_ruins_v3.png');

// Memoized so this large tiled image subtree is skipped on the 60fps camera
// updates; it only changes when the viewport changes.
const SceneTiles = React.memo(function SceneTiles({
  source,
  tileWidth,
  tileCount,
  height,
  opacity = 1,
}: {
  source: number;
  tileWidth: number;
  tileCount: number;
  height: number;
  opacity?: number;
}) {
  return (
    <View style={[styles.fill, { opacity }]}>
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

  // These are visual chapters, not gameplay zones: the player never changes
  // mode, rules, or collision. The scenery simply evolves from open valley
  // to waterfall woods to ancient grove as the one continuous journey moves
  // forward. Generous overlap prevents a hard scene cut during a run.
  const waterfallBlend = Math.max(0, Math.min(1, (cameraX - 2350) / 500));
  const ruinsBlend = Math.max(0, Math.min(1, (cameraX - 5000) / 500));
  const meadowOpacity = 1 - waterfallBlend;
  const waterfallOpacity = waterfallBlend * (1 - ruinsBlend);

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
        <SceneTiles source={SCENE_WILD_SOURCE} opacity={meadowOpacity} tileWidth={tileWidth} tileCount={tileCount} height={viewportHeight} />
        <SceneTiles source={SCENE_WATERFALL_SOURCE} opacity={waterfallOpacity} tileWidth={tileWidth} tileCount={tileCount} height={viewportHeight} />
        <SceneTiles source={SCENE_RUINS_SOURCE} opacity={ruinsBlend} tileWidth={tileWidth} tileCount={tileCount} height={viewportHeight} />
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
