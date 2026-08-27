import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Player } from '../game/types';
import { palette } from '../theme';

const LEAF_SPACING = 18; // px along the rope between leaf bumps

// The Root-Hook's line while swinging. Sized and positioned as a horizontal
// segment spanning the anchor-to-player midpoint, then rotated around its own
// center (the default RN transform origin) to connect the two points — no
// need for an end-anchored transform-origin, which isn't reliably supported.
// Styled as a living vine (leaf bumps + moss gradient) rather than a flat
// rope, per CLAUDE.md 19 — "Root-Hook이 살아있는 식물처럼 느껴지는 효과".
export default function RopeView({ player }: { player: Player }) {
  const grappling = player.grappling;
  const px = player.x + player.width / 2;
  const py = player.y + player.height / 2;
  const dx = player.grappleAnchorX - px;
  const dy = player.grappleAnchorY - py;
  const length = Math.hypot(dx, dy);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (px + player.grappleAnchorX) / 2;
  const midY = (py + player.grappleAnchorY) / 2;

  const leaves = useMemo(() => {
    const count = Math.max(0, Math.floor(length / LEAF_SPACING) - 1);
    return Array.from({ length: count }, (_, i) => ({
      offset: (i + 1) * LEAF_SPACING,
      side: i % 2 === 0 ? 1 : -1,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(length / LEAF_SPACING)]);

  if (!grappling) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          left: midX - length / 2,
          top: midY - 5,
          width: length,
          transform: [{ rotate: `${angleDeg}deg` }],
        },
      ]}
    >
      <View style={styles.shadow} />
      <LinearGradient colors={[palette.mossTint, palette.mossDark]} style={styles.rope} />
      {leaves.map((leaf, i) => (
        <View
          key={i}
          style={[
            styles.leaf,
            {
              left: leaf.offset,
              top: leaf.side > 0 ? -2 : 5,
              transform: [{ rotate: leaf.side > 0 ? '-30deg' : '30deg' }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    height: 10,
  },
  shadow: { position: 'absolute', top: 4.5, left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: 'rgba(29, 52, 35, 0.55)' },
  rope: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  leaf: {
    position: 'absolute',
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: palette.mossTint,
    borderWidth: 1,
    borderColor: palette.mossDark,
  },
});
