import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Player } from '../game/types';
import { palette } from '../theme';

// The Root-Hook's line while swinging. Sized and positioned as a horizontal
// segment spanning the anchor-to-player midpoint, then rotated around its own
// center (the default RN transform origin) to connect the two points — no
// need for an end-anchored transform-origin, which isn't reliably supported.
export default function RopeView({ player }: { player: Player }) {
  if (!player.grappling) return null;

  const px = player.x + player.width / 2;
  const py = player.y + player.height / 2;
  const dx = player.grappleAnchorX - px;
  const dy = player.grappleAnchorY - py;
  const length = Math.hypot(dx, dy);
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (px + player.grappleAnchorX) / 2;
  const midY = (py + player.grappleAnchorY) / 2;

  return (
    <View
      style={[
        styles.rope,
        {
          left: midX - length / 2,
          top: midY - 1.5,
          width: length,
          transform: [{ rotate: `${angleDeg}deg` }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  rope: {
    position: 'absolute',
    height: 3,
    backgroundColor: palette.mossDark,
    borderRadius: 1.5,
  },
});
