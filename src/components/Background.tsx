import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { BloomState } from '../game/types';
import { palette } from '../theme';

interface Props {
  cameraX: number;
  worldWidth: number;
  viewportWidth: number;
  viewportHeight: number;
  bloomState: BloomState;
}

// How much slower the far scene layer scrolls than the camera. Deliberately
// slow (real distant mountains barely move) — this also keeps the tiled
// scene painting's repeat seam rare, since the layer only travels a fraction
// of the level's width (see FAR_FACTOR usage below).
const FAR_FACTOR = 0.15;

// Two full-bleed painterly scene illustrations (mountains + midground already
// baked into one composition, matching the reference's single rich backdrop
// rather than many small composited sprites) — cross-faded exactly like the
// previous per-element approach, just with far fewer moving parts.
const SCENE_MECH_SOURCE = require('../../assets/backgrounds/scene_mechanical_v2.png');
const SCENE_WILD_SOURCE = require('../../assets/backgrounds/scene_wild_v2.png');

// Memoized so this (large, tiled full-screen images) subtree is skipped on
// the 60fps re-renders `cameraX` drives in the parent — its own props only
// ever change on a Bloom Shift or a viewport resize, never per frame
// (CLAUDE.md 18.7: avoid unnecessary per-frame work).
const SceneTiles = React.memo(function SceneTiles({
  source,
  opacity,
  tileWidth,
  tileCount,
  height,
}: {
  source: number;
  opacity: Animated.AnimatedInterpolation<number>;
  tileWidth: number;
  tileCount: number;
  height: number;
}) {
  return (
    <Animated.View style={[styles.fill, { opacity }]}>
      {Array.from({ length: tileCount }, (_, i) => (
        <Image
          key={i}
          source={source}
          resizeMode="cover"
          style={{ position: 'absolute', left: i * tileWidth, top: 0, width: tileWidth, height }}
        />
      ))}
    </Animated.View>
  );
});

export default function Background({ cameraX, worldWidth, viewportWidth, viewportHeight, bloomState }: Props) {
  const farOffset = -cameraX * FAR_FACTOR;

  // Cross-fades the whole background between a mechanical and a wild scene
  // whenever the level-wide Bloom Shift state flips, so the world outside the
  // platforms themselves also reads as "a different state now" (CLAUDE.md 19
  // — 기계×자연 시각 대비 / Bloom Shift).
  const wildAnim = useRef(new Animated.Value(bloomState === 'wild' ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(wildAnim, {
      toValue: bloomState === 'wild' ? 1 : 0,
      duration: 650,
      useNativeDriver: true,
    }).start();
  }, [bloomState, wildAnim]);
  const wildOpacity = wildAnim;
  // Memoized: `.interpolate()` returns a new object each call, and this
  // component re-renders every physics frame (driven by `cameraX`) — without
  // memoizing, SceneTiles would see a "changed" opacity prop every frame and
  // never benefit from the React.memo above.
  const mechOpacity = useMemo(() => wildAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), [wildAnim]);

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
        <SceneTiles source={SCENE_MECH_SOURCE} opacity={mechOpacity} tileWidth={tileWidth} tileCount={tileCount} height={viewportHeight} />
        <SceneTiles source={SCENE_WILD_SOURCE} opacity={wildOpacity} tileWidth={tileWidth} tileCount={tileCount} height={viewportHeight} />
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
