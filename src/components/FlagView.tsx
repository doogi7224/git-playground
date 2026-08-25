import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Flag } from '../game/types';

export default function FlagView({ flag }: { flag: Flag }) {
  return (
    <View style={[styles.pole, { left: flag.x, top: flag.y, width: flag.width, height: flag.height }]}>
      <View style={styles.cloth} />
    </View>
  );
}

const styles = StyleSheet.create({
  pole: {
    position: 'absolute',
    backgroundColor: '#c9c9c9',
    alignItems: 'center',
  },
  cloth: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 26,
    height: 18,
    backgroundColor: '#3bb54a',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
});
