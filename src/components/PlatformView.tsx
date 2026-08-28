import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Platform } from '../game/types';

const TERRAIN_SOURCE = require('../../assets/platforms/forest_terrain_v4.png');
const FLOATING_SEGMENT_WIDTH = 92;
const GROUND_SEGMENT_WIDTH = 112;

// Collision stays exactly where the level authored it. The visible ledge is
// allowed to hang below that rectangle so roots and stone can have a natural
// silhouette instead of being clipped into a thin plank.
export default function PlatformView({ platform }: { platform: Platform }) {
  const ground = platform.id.startsWith('ground');
  const segmentWidth = ground ? GROUND_SEGMENT_WIDTH : FLOATING_SEGMENT_WIDTH;
  const segmentCount = Math.max(1, Math.ceil(platform.width / segmentWidth));
  const visualHeight = ground ? 43 : 38;

  return (
    <View style={[styles.base, { left: platform.x, top: platform.y, width: platform.width, height: platform.height }]}>
      <View style={[styles.paintLayer, { top: -5, height: visualHeight }]}>
        {Array.from({ length: segmentCount }, (_, index) => {
          const left = index * segmentWidth;
          return (
            <Image
              key={`${platform.id}-terrain-${index}`}
              source={TERRAIN_SOURCE}
              resizeMode="stretch"
              style={{ position: 'absolute', left, top: 0, width: Math.min(segmentWidth + 3, platform.width - left + 3), height: visualHeight }}
            />
          );
        })}
      </View>
      <View style={[styles.walkingEdge, ground && styles.walkingEdgeGround]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { position: 'absolute', overflow: 'visible' },
  paintLayer: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  walkingEdge: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: -1,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(226, 241, 132, 0.72)',
    shadowColor: '#a9d76f',
    shadowOpacity: 0.35,
    shadowRadius: 2,
  },
  walkingEdgeGround: { left: 0, right: 0 },
});
