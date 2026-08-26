import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BloomState } from '../game/types';
import { palette } from '../theme';

interface Props {
  cameraX: number;
  worldWidth: number;
  viewportHeight: number;
  bloomState: BloomState;
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

// Mechanical-state decoration: a distant gear silhouette poking over the horizon.
function GearSilhouette({ x, size, opacity }: { x: number; size: number; opacity: Animated.AnimatedInterpolation<number> }) {
  const teeth = 8;
  return (
    <Animated.View style={{ position: 'absolute', left: x, bottom: -size * 0.3, width: size, height: size, opacity }}>
      {Array.from({ length: teeth }, (_, i) => (
        <View
          key={i}
          style={[
            styles.gearTooth,
            {
              width: size * 0.16,
              height: size * 0.16,
              left: size / 2 - (size * 0.16) / 2,
              top: size / 2 - (size * 0.16) / 2,
              transform: [{ rotate: `${(360 / teeth) * i}deg` }, { translateY: -size * 0.42 }],
            },
          ]}
        />
      ))}
      <View
        style={{
          position: 'absolute',
          left: size * 0.18,
          top: size * 0.18,
          width: size * 0.64,
          height: size * 0.64,
          borderRadius: size / 2,
          borderWidth: size * 0.1,
          borderColor: 'rgba(140, 100, 50, 0.4)',
        }}
      />
    </Animated.View>
  );
}

// Wild-state decoration: a cluster of leaning vine/leaf fronds, cross-faded
// in against the same silhouette slots the gears use.
function VineCluster({ x, size, opacity }: { x: number; size: number; opacity: Animated.AnimatedInterpolation<number> }) {
  return (
    <Animated.View style={{ position: 'absolute', left: x, bottom: -size * 0.1, width: size, height: size * 1.3, opacity }}>
      <View
        style={{
          position: 'absolute',
          left: size * 0.42,
          bottom: 0,
          width: size * 0.16,
          height: size * 1.2,
          borderRadius: size * 0.08,
          backgroundColor: 'rgba(60, 122, 86, 0.4)',
        }}
      />
      {[0.2, 0.45, 0.7].map((t, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: i % 2 === 0 ? size * 0.1 : size * 0.5,
            bottom: size * 1.2 * t,
            width: size * 0.42,
            height: size * 0.22,
            borderRadius: size * 0.12,
            backgroundColor: 'rgba(60, 122, 86, 0.35)',
            transform: [{ rotate: i % 2 === 0 ? '-25deg' : '25deg' }],
          }}
        />
      ))}
    </Animated.View>
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

export default function Background({ cameraX, worldWidth, viewportHeight, bloomState }: Props) {
  const farOffset = -cameraX * 0.25;
  const nearOffset = -cameraX * 0.5;

  // Cross-fades the whole background (sky tint + far-layer decoration set)
  // between a mechanical and a wild mood whenever the level-wide Bloom Shift
  // state flips, so the world outside the platforms themselves also reads as
  // "a different state now" (CLAUDE.md 19 — 기계×자연 시각 대비 / Bloom Shift).
  const wildAnim = useRef(new Animated.Value(bloomState === 'wild' ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(wildAnim, {
      toValue: bloomState === 'wild' ? 1 : 0,
      duration: 650,
      useNativeDriver: true,
    }).start();
  }, [bloomState, wildAnim]);
  const wildOpacity = wildAnim;
  const mechOpacity = wildAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

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

  const decorSlots = useMemo(
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
      <LinearGradient colors={[palette.skyTop, palette.skyBottom]} style={styles.fill} />
      <Animated.View style={[styles.fill, { opacity: mechOpacity }]}>
        <LinearGradient colors={['rgba(169, 118, 47, 0.22)', 'transparent']} style={styles.fill} />
      </Animated.View>
      <Animated.View style={[styles.fill, { opacity: wildOpacity }]}>
        <LinearGradient colors={['rgba(60, 122, 86, 0.22)', 'transparent']} style={styles.fill} />
      </Animated.View>

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
        {decorSlots.map((g, i) => (
          <GearSilhouette key={`gear-${i}`} x={g.x} size={g.size} opacity={mechOpacity} />
        ))}
        {decorSlots.map((g, i) => (
          <VineCluster key={`vine-${i}`} x={g.x} size={g.size} opacity={wildOpacity} />
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
    bottom: 0,
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
  gearTooth: {
    position: 'absolute',
    backgroundColor: 'rgba(140, 100, 50, 0.4)',
    borderRadius: 2,
  },
});
