import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Player } from '../game/types';

export default function PlayerView({ player }: { player: Player }) {
  const blinking = player.invulnerableFor > 0 && Math.floor(player.invulnerableFor * 10) % 2 === 0;
  return (
    <View
      style={[
        styles.body,
        {
          left: player.x,
          top: player.y,
          width: player.width,
          height: player.height,
          opacity: blinking ? 0.3 : 1,
          transform: [{ scaleX: player.facing }],
        },
      ]}
    >
      <View style={styles.hat} />
      <View style={styles.face}>
        <View style={styles.eye} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    backgroundColor: '#e0453b',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8f231d',
  },
  hat: {
    position: 'absolute',
    top: -6,
    left: -2,
    right: -2,
    height: 12,
    backgroundColor: '#c22a20',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  face: {
    position: 'absolute',
    top: 14,
    right: 4,
    width: 10,
    height: 10,
    backgroundColor: '#ffe0c2',
    borderRadius: 5,
  },
  eye: {
    position: 'absolute',
    top: 3,
    right: 1,
    width: 3,
    height: 3,
    backgroundColor: '#222',
    borderRadius: 2,
  },
});
