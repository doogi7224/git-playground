import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RouteGate } from '../game/types';
import { palette } from '../theme';

// Placeholder presentation for the Momentum Route foundation (GAME_DIRECTION_V2.md)
// — a plain marker distinguishing Vine (moss) from Gear (brass) and whether
// it's currently open, built so Codex's real "vine door / brass arch" visual
// language can drop in later without touching the trigger logic in
// physics.ts (a RouteGate has no collision of its own; it's a rect
// `stepRouteGates` checks each frame).
export default function RouteGateView({ gate }: { gate: RouteGate }) {
  const color = gate.kind === 'vine' ? palette.moss : palette.uiPrimary;
  const colorDark = gate.kind === 'vine' ? palette.mossDark : palette.uiPrimaryDark;
  return (
    <View style={[styles.wrap, { left: gate.x, top: gate.y, width: gate.width, height: gate.height }]}>
      <View
        style={[
          styles.frame,
          {
            borderColor: colorDark,
            backgroundColor: color,
            opacity: gate.active ? 0.95 : 0.8,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  frame: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    borderWidth: 3,
    // A bright outer edge so the marker reads against any background art,
    // regardless of how close the fill color sits to the scene behind it —
    // purely a placeholder concession; Codex's real visual language replaces
    // this shape entirely.
    shadowColor: '#fff',
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 6,
  },
});
