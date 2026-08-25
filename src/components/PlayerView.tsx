import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Player } from '../game/types';
import { palette } from '../theme';

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
      <View style={styles.shoeLeft} />
      <View style={styles.shoeRight} />
      <View style={styles.body}>
        <View style={styles.strapLeft} />
        <View style={styles.strapRight} />
        <View style={styles.belly} />
      </View>
      <View style={styles.head}>
        <View style={styles.hair} />
        <View style={styles.cap} />
        <View style={styles.capBrim} />
        <View style={styles.face}>
          <View style={styles.eye} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    bottom: 4,
    left: 2,
    right: 2,
    height: '58%',
    backgroundColor: palette.playerBody,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.playerBodyDark,
    overflow: 'hidden',
  },
  belly: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: '25%',
    bottom: 0,
    backgroundColor: palette.playerBelly,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  strapLeft: {
    position: 'absolute',
    left: '22%',
    top: 0,
    width: '14%',
    height: '55%',
    backgroundColor: palette.playerBodyDark,
  },
  strapRight: {
    position: 'absolute',
    right: '22%',
    top: 0,
    width: '14%',
    height: '55%',
    backgroundColor: palette.playerBodyDark,
  },
  head: {
    position: 'absolute',
    top: 0,
    left: 1,
    right: 1,
    height: '52%',
  },
  hair: {
    position: 'absolute',
    left: 2,
    right: 2,
    bottom: 0,
    top: '35%',
    backgroundColor: palette.playerHair,
    borderRadius: 8,
  },
  cap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '68%',
    backgroundColor: palette.playerBody,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 2,
    borderColor: palette.playerBodyDark,
  },
  capBrim: {
    position: 'absolute',
    right: -6,
    top: '40%',
    width: 16,
    height: 7,
    backgroundColor: palette.playerBodyDark,
    borderRadius: 3,
  },
  face: {
    position: 'absolute',
    right: 2,
    top: '48%',
    width: '58%',
    height: '46%',
    backgroundColor: palette.playerSkin,
    borderRadius: 7,
  },
  eye: {
    position: 'absolute',
    top: '25%',
    right: '18%',
    width: 4,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#26221c',
  },
  shoeLeft: {
    position: 'absolute',
    left: -1,
    bottom: 0,
    width: '46%',
    height: 6,
    backgroundColor: '#4a2e14',
    borderRadius: 3,
  },
  shoeRight: {
    position: 'absolute',
    right: -1,
    bottom: 0,
    width: '46%',
    height: 6,
    backgroundColor: '#4a2e14',
    borderRadius: 3,
  },
});
