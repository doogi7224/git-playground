import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Platform } from '../game/types';

// Collision remains authored by the game. The visible surface is a painted
// terrain strip, so ground and floating ledges share the same premium forest
// material rather than looking like CSS blocks over a painted background.
export default function PlatformView({ platform }: { platform: Platform }) {
  const ground = platform.id.startsWith('ground');

  return (
    <View style={[styles.base, { left: platform.x, top: platform.y, width: platform.width, height: platform.height, borderRadius: ground ? 0 : 5 }]}>
      <Image
        source={require('../../assets/platforms/plank_wild.png')}
        resizeMode="stretch"
        style={[styles.terrain, { top: -platform.height * 0.26, height: platform.height * 1.26 }]}
      />
      {!ground && <View style={styles.shadow} />}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { position: 'absolute', overflow: 'hidden' },
  terrain: { position: 'absolute', left: 0, width: '100%' },
  shadow: { position: 'absolute', top: '100%', left: 3, right: 3, height: 4, borderRadius: 5, backgroundColor: 'rgba(21,42,35,0.28)' },
});
