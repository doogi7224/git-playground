import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Platform } from '../game/types';

export default function PlatformView({ platform }: { platform: Platform }) {
  const isGround = platform.id.startsWith('ground');
  return (
    <View
      style={[
        styles.base,
        isGround ? styles.ground : styles.floating,
        { left: platform.x, top: platform.y, width: platform.width, height: platform.height },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    borderTopWidth: 4,
    borderColor: '#2d6a1f',
  },
  ground: {
    backgroundColor: '#8a5a2b',
  },
  floating: {
    backgroundColor: '#c98a4b',
    borderRadius: 4,
  },
});
