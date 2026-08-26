import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '../theme';

interface Props {
  cameraX: number;
  worldWidth: number;
  viewportHeight: number;
}

function Cloud({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <View style={[styles.cloud, { left: x, top: y, transform: [{ scale }] }]}>
      <View style={[styles.cloudLobe, { width: 46, height: 30, left: 0, top: 6 }]} />
      <View style={[styles.cloudLobe, { width: 34, height: 34, left: 22, top: -6 }]} />
      <View style={[styles.cloudLobe, { width: 40, height: 26, left: 46, top: 8 }]} />
    </View>
  );
}

function GearSilhouette({ x, size }: { x: number; size: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        bottom: -size * 0.3,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: size * 0.12,
        borderColor: 'rgba(140, 100, 50, 0.35)',
        borderStyle: 'dashed',
      }}
    />
  );
}

function Hill({ x, size, color }: { x: number; size: number; color: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        bottom: -size * 0.55,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

export default function Background({ cameraX, worldWidth, viewportHeight }: Props) {
  const farOffset = -cameraX * 0.25;
  const nearOffset = -cameraX * 0.5;

  const clouds = useMemo(
    () =>
      Array.from({ length: Math.ceil(worldWidth / 380) }, (_, i) => ({
        x: 60 + i * 380 + (i % 3) * 40,
        y: 18 + ((i * 53) % 60),
        scale: 0.7 + ((i * 29) % 40) / 100,
      })),
    [worldWidth]
  );

  const farHills = useMemo(
    () =>
      Array.from({ length: Math.ceil(worldWidth / 260) }, (_, i) => ({
        x: i * 260 - 40,
        size: 180 + ((i * 37) % 70),
      })),
    [worldWidth]
  );

  const gears = useMemo(
    () =>
      Array.from({ length: Math.ceil(worldWidth / 520) }, (_, i) => ({
        x: 150 + i * 520 + ((i * 41) % 90),
        size: 90 + ((i * 53) % 50),
      })),
    [worldWidth]
  );

  const nearHills = useMemo(
    () =>
      Array.from({ length: Math.ceil(worldWidth / 320) }, (_, i) => ({
        x: i * 320 + 60,
        size: 150 + ((i * 61) % 90),
      })),
    [worldWidth]
  );

  return (
    <View style={[styles.fill, { height: viewportHeight }]} pointerEvents="none">
      <LinearGradient
        colors={[palette.skyTop, palette.skyBottom]}
        style={styles.fill}
      />
      <View style={[styles.sun, { backgroundColor: palette.sunGlow }]}>
        <View style={styles.sunCore} />
      </View>

      <View style={[styles.parallaxLayer, { width: worldWidth, transform: [{ translateX: farOffset }] }]}>
        {clouds.map((c, i) => (
          <Cloud key={`cloud-${i}`} x={c.x} y={c.y} scale={c.scale} />
        ))}
        {farHills.map((h, i) => (
          <Hill key={`far-${i}`} x={h.x} size={h.size} color={palette.hillFar} />
        ))}
        {gears.map((g, i) => (
          <GearSilhouette key={`gear-${i}`} x={g.x} size={g.size} />
        ))}
      </View>

      <View style={[styles.parallaxLayer, { width: worldWidth, transform: [{ translateX: nearOffset }] }]}>
        {nearHills.map((h, i) => (
          <Hill key={`near-${i}`} x={h.x} size={h.size} color={palette.hillNear} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  parallaxLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  sun: {
    position: 'absolute',
    right: 40,
    top: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.sun,
  },
  cloud: {
    position: 'absolute',
  },
  cloudLobe: {
    position: 'absolute',
    backgroundColor: palette.cloud,
    borderRadius: 999,
  },
});
