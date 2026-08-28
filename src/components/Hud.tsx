import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COG_COLORS } from './CogPickupView';
import { OVERDRIVE_MAX, STARTING_LIVES } from '../game/constants';
import { CogType } from '../game/types';
import { palette } from '../theme';

// Life pips: STARTING_LIVES slots always render so a lost life reads as an
// emptied brass husk rather than the row simply getting shorter.
function LifePips({ lives }: { lives: number }) {
  const slots = Array.from({ length: STARTING_LIVES }, (_, i) => i < lives);
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeCaption}>LIFE</Text>
      {slots.map((alive, i) => (
        <View key={i} style={[styles.lifePip, alive ? styles.lifePipAlive : styles.lifePipLost]}>
          <View style={[styles.lifePipCore, alive && styles.lifePipCoreAlive]} />
        </View>
      ))}
    </View>
  );
}

// Overdrive gauge: brass-capped glass tube with a slow shimmer while it has
// any charge, and a bright one-shot flash+punch the moment it fills to 100%.
function OverdriveGauge({ gaugeFill, overdriveActive }: { gaugeFill: number; overdriveActive: boolean }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const wasFull = useRef(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1400, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  useEffect(() => {
    const isFull = gaugeFill >= 1;
    if (isFull && !wasFull.current) {
      flash.setValue(1);
      Animated.timing(flash, { toValue: 0, duration: 650, useNativeDriver: true }).start();
    }
    wasFull.current = isFull;
  }, [gaugeFill, flash]);

  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-60, 200] });
  const flashScale = flash.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const flashOpacity = flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] });

  return (
    <Animated.View style={[styles.gaugeRow, { transform: [{ scale: flashScale }] }]}>
      <Text style={styles.gaugeLabel}>OVERDRIVE</Text>
      <View style={styles.gaugeCap} />
      <View style={[styles.gaugeTrack, overdriveActive && styles.gaugeTrackActive]}>
        <LinearGradient
          colors={overdriveActive ? [palette.coinShine, palette.coinGold] : [palette.uiPrimary, palette.uiPrimaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gaugeFill, { width: `${gaugeFill * 100}%` }]}
        />
        {gaugeFill > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.gaugeShimmer, { transform: [{ translateX: shimmerX }, { rotate: '20deg' }] }]}
          />
        )}
        <Animated.View pointerEvents="none" style={[styles.gaugeFlash, { opacity: flashOpacity }]} />
      </View>
      <View style={styles.gaugeCap} />
      {overdriveActive && <Text style={styles.overdriveLabel}>오버드라이브!</Text>}
    </Animated.View>
  );
}

export default function Hud({
  score,
  lives,
  overdriveGauge,
  overdriveActive,
  equippedCogs,
  arrows,
  maxArrows,
}: {
  score: number;
  lives: number;
  overdriveGauge: number;
  overdriveActive: boolean;
  equippedCogs: (CogType | null)[];
  arrows: number;
  maxArrows: number;
}) {
  const gaugeFill = Math.min(1, overdriveGauge / OVERDRIVE_MAX);
  const equipped = equippedCogs.filter((c): c is CogType => c != null);
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeCaption}>GEAR</Text>
          <View style={styles.coinIcon}>
            <View style={styles.coinShine} />
          </View>
          <Text style={styles.text}>{score}</Text>
        </View>
        <LifePips lives={lives} />
      </View>
      {maxArrows > 0 && <View style={styles.ammoBadge}><Text style={styles.badgeCaption}>ARROWS</Text><Text style={styles.ammoText}>➤ {arrows}/{maxArrows}</Text></View>}
      <OverdriveGauge gaugeFill={gaugeFill} overdriveActive={overdriveActive} />
      {equipped.length > 0 && (
        <View style={styles.cogRow}>
          {equipped.map((c) => (
            <View key={c} style={[styles.cogDot, { backgroundColor: COG_COLORS[c] }]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: palette.uiPlateDeep,
    borderWidth: 1,
    borderColor: palette.uiPlateEdge,
  },
  ammoBadge: { position: 'absolute', top: 58, left: 22, flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: palette.uiPlate, borderRadius: 10, borderWidth: 1.5, borderColor: palette.uiPlateEdge, paddingHorizontal: 10, paddingVertical: 5 },
  ammoText: { color: '#8fe4d2', fontSize: 14, fontWeight: '900' },
  gaugeCap: {
    width: 10,
    height: 16,
    borderRadius: 3,
    backgroundColor: palette.uiPrimaryDark,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  gaugeLabel: {
    marginRight: 2,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: palette.uiTextMuted,
  },
  gaugeTrack: {
    width: 190,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(20,30,45,0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  gaugeTrackActive: {
    borderColor: palette.coinGold,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  gaugeShimmer: {
    position: 'absolute',
    top: -10,
    width: 16,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  gaugeFlash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#fff',
  },
  overdriveLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.coinGold,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.uiPlate,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: palette.uiPlateEdge,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeCaption: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: palette.uiTextMuted,
  },
  bloomBadge: {
    borderWidth: 1.5,
    overflow: 'visible',
  },
  bloomGlow: {
    position: 'absolute',
    left: -4,
    right: -4,
    top: -4,
    bottom: -4,
    borderRadius: 20,
  },
  bloomDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  coinIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.coinGold,
    borderWidth: 1.5,
    borderColor: palette.coinGoldDark,
    overflow: 'hidden',
  },
  coinShine: {
    position: 'absolute',
    top: 1.5,
    left: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.coinShine,
  },
  text: {
    fontSize: 21,
    fontWeight: '800',
    color: '#fff',
  },
  lifePip: {
    width: 18,
    height: 18,
    borderRadius: 5,
    transform: [{ rotate: '45deg' }],
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifePipAlive: {
    backgroundColor: 'rgba(60, 122, 86, 0.35)',
    borderColor: palette.moss,
  },
  lifePipLost: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  lifePipCore: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'transparent',
  },
  lifePipCoreAlive: {
    backgroundColor: palette.mossTint,
  },
  cogRow: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'center',
  },
  cogDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
