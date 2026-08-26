import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Player } from '../game/types';
import { palette } from '../theme';

// Sprout: half-mechanical, half-nature spirit. A rounded root/wood body with
// a glowing moss-green LED face and a brass gear-core visible through a
// glass chest window, topped with a small leaf antenna.
export default function PlayerView({ player }: { player: Player }) {
  const blinking = player.invulnerableFor > 0 && Math.floor(player.invulnerableFor * 10) % 2 === 0;

  const stretch = Math.max(-1, Math.min(1, player.vy / 500));
  const scaleY = 1 + stretch * 0.12;
  const scaleX = 1 - stretch * 0.08;

  return (
    <View
      style={{
        position: 'absolute',
        left: player.x,
        top: player.y,
        width: player.width,
        height: player.height,
        opacity: blinking ? 0.35 : 1,
        transform: [{ scaleX: player.facing * scaleX }, { scaleY }],
      }}
    >
      <View style={styles.antennaStemLeft} />
      <View style={styles.antennaLeafLeft} />
      <View style={styles.antennaStemRight} />
      <View style={styles.antennaLeafRight} />

      <View style={styles.body}>
        <View style={styles.facePlate}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <View style={styles.coreRing}>
          <View style={styles.coreGlow} />
          <View style={styles.coreTooth} />
        </View>
      </View>

      <View style={styles.footLeft} />
      <View style={styles.footRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    top: 4,
    left: 1,
    right: 1,
    bottom: 6,
    backgroundColor: palette.playerBody,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: palette.playerBodyDark,
    overflow: 'hidden',
  },
  facePlate: {
    position: 'absolute',
    top: 4,
    left: '19%',
    right: '19%',
    height: 10,
    backgroundColor: palette.playerSkin,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: palette.playerBodyDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  eye: {
    width: 4,
    height: 6,
    borderRadius: 2,
    backgroundColor: palette.playerHair,
  },
  coreRing: {
    position: 'absolute',
    top: 16,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 2,
    borderColor: palette.playerBodyDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreGlow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.coinGold,
  },
  coreTooth: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 3,
    backgroundColor: palette.woodDark,
    borderRadius: 1,
  },
  antennaStemLeft: {
    position: 'absolute',
    top: -6,
    left: '30%',
    width: 2,
    height: 8,
    backgroundColor: palette.woodDark,
  },
  antennaLeafLeft: {
    position: 'absolute',
    top: -11,
    left: '30%',
    marginLeft: -4,
    width: 9,
    height: 7,
    backgroundColor: palette.playerHair,
    borderRadius: 5,
    transform: [{ rotate: '-25deg' }],
  },
  antennaStemRight: {
    position: 'absolute',
    top: -4,
    right: '30%',
    width: 2,
    height: 6,
    backgroundColor: palette.woodDark,
  },
  antennaLeafRight: {
    position: 'absolute',
    top: -9,
    right: '30%',
    marginRight: -4,
    width: 8,
    height: 6,
    backgroundColor: palette.playerHair,
    borderRadius: 5,
    transform: [{ rotate: '20deg' }],
  },
  footLeft: {
    position: 'absolute',
    left: 3,
    bottom: 0,
    width: 11,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.woodDark,
  },
  footRight: {
    position: 'absolute',
    right: 3,
    bottom: 0,
    width: 11,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.woodDark,
  },
});
