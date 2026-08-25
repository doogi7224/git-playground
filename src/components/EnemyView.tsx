import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Enemy } from '../game/types';

export default function EnemyView({ enemy }: { enemy: Enemy }) {
  if (!enemy.alive) return null;
  return (
    <View style={[styles.body, { left: enemy.x, top: enemy.y, width: enemy.width, height: enemy.height }]}>
      <View style={styles.eyes}>
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    backgroundColor: '#6b4226',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3f2513',
  },
  eyes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  eye: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
});
