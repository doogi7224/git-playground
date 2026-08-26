import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CorpsePlatform } from '../game/types';
import { palette } from '../theme';

// A defeated monster's remains, usable as a temporary platform for a few
// seconds (see the CorpsePlatform comment in types.ts). Tinted per source so
// a Bio-Coil's bonus-bounce spring reads differently from a plain Cogmite
// shell or the Steam Blower's wider wreckage. Fades out over its last second
// as a warning before it disappears out from under the player.
const SOURCE_COLOR: Record<CorpsePlatform['source'], { fill: string; border: string }> = {
  enemy: { fill: palette.enemyBody, border: palette.enemyBodyDark },
  bioCoil: { fill: palette.moss, border: palette.mossDark },
  steamBlower: { fill: palette.uiPrimary, border: palette.uiPrimaryDark },
};

export default function CorpsePlatformView({ platform }: { platform: CorpsePlatform }) {
  const { fill, border } = SOURCE_COLOR[platform.source];
  const fadeStart = 1; // seconds remaining at which it starts fading
  const opacity = platform.timeLeft < fadeStart ? Math.max(0.25, platform.timeLeft / fadeStart) : 1;

  return (
    <View
      style={[
        styles.base,
        {
          left: platform.x,
          top: platform.y,
          width: platform.width,
          height: platform.height,
          backgroundColor: fill,
          borderColor: border,
          opacity,
        },
      ]}
    >
      {platform.source === 'bioCoil' && <View style={styles.bounceHighlight} />}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
  },
  bounceHighlight: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    top: 2,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.mossTint,
  },
});
