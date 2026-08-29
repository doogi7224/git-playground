import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Player } from '../game/types';

const TWIST_SPACING = 12; // px between visible braid wraps

// The Root-Hook's line while swinging. Sized and positioned as a horizontal
// segment spanning the anchor-to-player midpoint, then rotated around its own
// center (the default RN transform origin) to connect the two points — no
// need for an end-anchored transform-origin, which isn't reliably supported.
// A grapple line stays taut under tension, but is rendered as braided hemp
// with a dark core, warm fibers and regular wraps rather than a flat green
// bar. The root-hook itself supplies the forest detail at the anchor end.
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

  const twists = useMemo(() => {
    const count = Math.max(0, Math.floor(length / TWIST_SPACING) - 1);
    return Array.from({ length: count }, (_, i) => ({
      offset: (i + 1) * TWIST_SPACING,
      angle: i % 2 === 0 ? '-38deg' : '38deg',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(length / TWIST_SPACING)]);

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
      <LinearGradient colors={['#5b351e', '#c79655', '#6a3f24']} style={styles.rope} />
      <View style={styles.fiberHighlight} />
      {twists.map((twist, i) => (
        <View
          key={i}
          style={[
            styles.twist,
            {
              left: twist.offset,
              transform: [{ rotate: twist.angle }],
            },
          ]}
        />
      ))}
      <View style={styles.anchorKnot} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', height: 12 },
  shadow: { position: 'absolute', top: 5, left: 0, right: 0, height: 5, borderRadius: 3, backgroundColor: 'rgba(27, 19, 12, 0.48)' },
  rope: {
    position: 'absolute',
    top: 3,
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
  },
  fiberHighlight: { position: 'absolute', top: 4, left: 2, right: 2, height: 1.5, borderRadius: 1, backgroundColor: 'rgba(255,231,174,0.62)' },
  twist: {
    position: 'absolute',
    top: 1,
    width: 3,
    height: 10,
    borderRadius: 2,
    backgroundColor: 'rgba(61, 35, 20, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(240, 194, 117, 0.45)',
  },
  anchorKnot: { position: 'absolute', top: 1, right: -3, width: 11, height: 11, borderRadius: 6, backgroundColor: '#734526', borderWidth: 1.5, borderColor: '#d0a469' },
});
