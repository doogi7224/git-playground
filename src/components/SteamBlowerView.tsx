import React from 'react';
import { StyleSheet, View } from 'react-native';
import { isFlameLobActive, isSteamGustActive } from '../game/physics';
import { BloomState, SteamBlower } from '../game/types';
import { STEAMBLOWER_HP, STEAM_GUST_RANGE, FLAME_LOB_RANGE } from '../game/constants';
import { palette } from '../theme';

// No AI-generated sprite exists yet for this monster, so — like BioCoilView
// and SporeSpriteView — it's drawn procedurally: an open, stompable moss cap
// in the wild state collapses into an armored, stomp-proof brass shell once
// shifted to mechanical, so the risk/reward reads at a glance.
export default function SteamBlowerView({ blower, bloomState }: { blower: SteamBlower; bloomState: BloomState }) {
  if (!blower.alive) return null;

  const isWild = bloomState === 'wild';
  const capHeight = isWild ? 24 : 10;
  const gusting = isSteamGustActive(blower);
  const lobbing = isFlameLobActive(blower);

  return (
    <View style={[styles.wrap, { left: blower.x, top: blower.y, width: blower.width, height: blower.height }]}>
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
          <View style={[styles.ember, styles.emberLeft, { left: -FLAME_LOB_RANGE * 0.6 }]} />
          <View style={[styles.ember, styles.emberRight, { right: -FLAME_LOB_RANGE * 0.6 }]} />
        </>
      )}

      <View
        style={[
          styles.cap,
          {
            height: capHeight,
            backgroundColor: isWild ? palette.moss : palette.uiPrimaryDark,
            borderColor: isWild ? palette.mossDark : palette.uiDanger,
          },
        ]}
      >
        {isWild && <View style={styles.capHighlight} />}
      </View>
      <View style={styles.boiler}>
        <View style={styles.boilerBand} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  hpRow: {
    position: 'absolute',
    top: -12,
    flexDirection: 'row',
    gap: 3,
  },
  hpPip: {
    width: 8,
    height: 6,
    borderRadius: 2,
  },
  cap: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
  },
  capHighlight: {
    marginTop: 3,
    width: '55%',
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.mossTint,
  },
  boiler: {
    width: '58%',
    flex: 1,
    backgroundColor: palette.uiPrimary,
    borderWidth: 2,
    borderColor: palette.uiPrimaryDark,
    borderTopWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boilerBand: {
    width: '80%',
    height: 4,
    backgroundColor: palette.uiPrimaryDark,
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
  emberLeft: {},
  emberRight: {},
});
