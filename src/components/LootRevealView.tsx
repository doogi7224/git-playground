import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LootReveal, TreasureReward } from '../game/types';

const COPY: Record<TreasureReward, { icon: string; label: string; color: string }> = {
  sunseedBurst: { icon: '✦', label: 'SUNSEEDS +8', color: '#ffd55d' },
  arrowBundle: { icon: '➤', label: 'ARROW +1', color: '#8fe4d2' },
  lifeBloom: { icon: '✚', label: 'LIFE BLOOM', color: '#ef8173' },
  magnetCog: { icon: '⌁', label: '자석 30초', color: '#83cfc2' },
  mirrorCog: { icon: '✦', label: '보호막', color: '#9ad2ff' },
};

export default function LootRevealView({ reveal }: { reveal: LootReveal }) {
  const item = COPY[reveal.reward];
  const progress = 1 - Math.max(0, Math.min(1, reveal.timeLeft / 1.1));
  return <View pointerEvents="none" style={[styles.wrap, { left: reveal.x - 38, top: reveal.y - 42 - progress * 22, opacity: 1 - progress * 0.35 }]}><Text style={[styles.text, { color: item.color }]}>{item.icon} {item.label}</Text></View>;
}
const styles = StyleSheet.create({ wrap: { position: 'absolute', width: 76, alignItems: 'center' }, text: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } } });
