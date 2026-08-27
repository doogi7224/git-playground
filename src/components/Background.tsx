import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { BloomState } from '../game/types';
import { palette } from '../theme';

interface Props {
  cameraX: number;
  worldWidth: number;
  viewportHeight: number;
  bloomState: BloomState;
}

const MOUNTAIN_SOURCES = [
  require('../../assets/backgrounds/mountain_1.png'),
  require('../../assets/backgrounds/mountain_2.png'),
];
const CLOUD_SOURCES = [
  require('../../assets/backgrounds/cloud_1.png'),
  require('../../assets/backgrounds/cloud_2.png'),
];
const DECOR_MECH_SOURCE = require('../../assets/backgrounds/decor_mech.png');
const DECOR_WILD_SOURCE = require('../../assets/backgrounds/decor_wild.png');

function Cloud({ x, y, scale, variant }: { x: number; y: number; scale: number; variant: number }) {
  return (
    <Image
      source={CLOUD_SOURCES[variant % CLOUD_SOURCES.length]}
      resizeMode="contain"
      style={[styles.cloud, { left: x, top: y, transform: [{ scale }] }]}
    />
  );
}

function Mountain({ x, size, variant }: { x: number; size: number; variant: number }) {
  return (
    <Image
      source={MOUNTAIN_SOURCES[variant % MOUNTAIN_SOURCES.length]}
      resizeMode="contain"
      style={[styles.mountain, { left: x, bottom: -size * 0.08, width: size, height: size * 0.56 }]}
    />
  );
}

// Mechanical-state decoration: an illustrated gear-tower ruin poking over the
// horizon, cross-faded against the wild decoration in the same slot.
function GearDecor({ x, size, opacity }: { x: number; size: number; opacity: Animated.AnimatedInterpolation<number> }) {
  return (
    <Animated.Image
      source={DECOR_MECH_SOURCE}
      resizeMode="contain"
      style={[styles.decor, { left: x, bottom: 0, width: size, height: size * 1.3, opacity }]}
    />
  );
}

// Wild-state decoration: an illustrated moss tree/rock cluster, cross-faded
// in against the same silhouette slots the gear towers use.
function VineDecor({ x, size, opacity }: { x: number; size: number; opacity: Animated.AnimatedInterpolation<number> }) {
  return (
    <Animated.Image
      source={DECOR_WILD_SOURCE}
      resizeMode="contain"
      style={[styles.decor, { left: x, bottom: 0, width: size, height: size * 1.3, opacity }]}
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
        variant: i,
      })),
    [worldWidth]
  );

  const farHills = useMemo(
    () =>
      Array.from({ length: Math.ceil(worldWidth / 420) }, (_, i) => ({
        x: i * 420 - 60,
        size: 420 + ((i * 37) % 120),
        variant: i,
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
        {farHills.map((h, i) => (
          <Mountain key={`mtn-${i}`} x={h.x} size={h.size} variant={h.variant} />
        ))}
        {clouds.map((c, i) => (
          <Cloud key={`cloud-${i}`} x={c.x} y={c.y} scale={c.scale} variant={c.variant} />
        ))}
        {decorSlots.map((g, i) => (
          <GearDecor key={`gear-${i}`} x={g.x} size={g.size} opacity={mechOpacity} />
        ))}
        {decorSlots.map((g, i) => (
          <VineDecor key={`vine-${i}`} x={g.x} size={g.size} opacity={wildOpacity} />
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
    width: 90,
    height: 50,
  },
  mountain: {
    position: 'absolute',
  },
  decor: {
    position: 'absolute',
  },
});
