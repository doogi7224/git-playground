import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { COG_SOURCES } from './CogPickupView';
import { COG_MAGNET_WARNING_DURATION, STARTING_LIVES } from '../game/constants';
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

export default function Hud({
  score,
  lives,
  equippedCogs,
  shieldCharges,
  magnetFor,
  arrows,
  maxArrows,
}: {
  score: number;
  lives: number;
  equippedCogs: (CogType | null)[];
  shieldCharges: number;
  magnetFor: number;
  arrows: number;
  maxArrows: number;
}) {
  const magnetWarning = equippedCogs.includes('magnet') && magnetFor > 0 && magnetFor <= COG_MAGNET_WARNING_DURATION;
  const magnetOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    magnetOpacity.stopAnimation();
    magnetOpacity.setValue(1);
    if (!magnetWarning) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(magnetOpacity, { toValue: 0.25, duration: 300, useNativeDriver: true }),
      Animated.timing(magnetOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [magnetOpacity, magnetWarning]);

  const allStatusCogs: { type: CogType; label: string }[] = [
    { type: 'magnet', label: `자석 ${Math.ceil(magnetFor)}초` },
    { type: 'mirror', label: '보호막' },
  ];
  const statusCogs = allStatusCogs.filter(({ type }) => equippedCogs.includes(type));
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
      {shieldCharges > 0 && <View style={styles.shieldBadge}><Text style={styles.badgeCaption}>SHIELD</Text><Text style={styles.shieldIcon}>✦</Text></View>}
      {maxArrows > 0 && <View style={styles.ammoBadge}><Text style={styles.badgeCaption}>ARROWS</Text><Text style={styles.ammoText}>➤ {arrows}/{maxArrows}</Text></View>}
      {statusCogs.length > 0 && (
        <View style={styles.cogStatusRow}>
          {statusCogs.map(({ type, label }) => (
            <Animated.View key={type} style={[styles.cogStatus, type === 'magnet' && { opacity: magnetOpacity }]}>
              <Image source={COG_SOURCES[type]} resizeMode="contain" style={styles.cogIcon} />
              <Text style={styles.cogLabel}>{label}</Text>
            </Animated.View>
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
  ammoBadge: { position: 'absolute', top: 58, left: 22, flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: palette.uiPlate, borderRadius: 10, borderWidth: 1.5, borderColor: palette.uiPlateEdge, paddingHorizontal: 10, paddingVertical: 5 },
  ammoText: { color: '#8fe4d2', fontSize: 14, fontWeight: '900' },
  shieldBadge: { position: 'absolute', top: 58, right: 22, flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: 'rgba(65, 119, 164, 0.86)', borderRadius: 10, borderWidth: 1.5, borderColor: '#a7d5ff', paddingHorizontal: 10, paddingVertical: 5 },
  shieldIcon: { color: '#e8f6ff', fontSize: 14, fontWeight: '900' },
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
  cogStatusRow: { position: 'absolute', top: 96, left: 22, flexDirection: 'row', gap: 5, alignItems: 'center' },
  cogStatus: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(224,169,79,0.65)', backgroundColor: 'rgba(20,24,22,0.88)', paddingVertical: 3, paddingHorizontal: 5 },
  cogIcon: { width: 20, height: 20 },
  cogLabel: { color: '#f4ecd7', fontSize: 7, fontWeight: '900', letterSpacing: 0.45 },
});
