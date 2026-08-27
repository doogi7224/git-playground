import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { RouteGate } from '../game/types';

const ROUTE_SECONDS = 6;

// Presentation only: a soft rising vine reads as the safe aerial route;
// brass chevrons read as the fast route. The game trigger remains untouched.
export default function RouteGateView({ gate }: { gate: RouteGate }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const vine = gate.kind === 'vine';
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: gate.active ? [0.55, 0.96] : [0.18, 0.38] });
  const ticks = Math.max(0, Math.ceil(gate.timer));

  return (
    <View style={[s.wrap, { left: gate.x, top: gate.y, width: gate.width, height: gate.height }]} pointerEvents="none">
      <Animated.View style={[s.aura, vine ? s.vineAura : s.gearAura, { opacity }]} />
      <View style={s.hint}>
        <View style={[s.arrow, vine ? s.vineArrow : s.gearArrow]} />
        <Text style={[s.hintText, vine ? s.vineText : s.gearText]}>{vine ? 'EASY' : 'FAST'}</Text>
      </View>
      {vine ? <VineGate active={gate.active} /> : <GearGate active={gate.active} />}
      {gate.active && <View style={s.timer}>{Array.from({ length: ROUTE_SECONDS }, (_, i) => <View key={i} style={[s.tick, i < ticks ? (vine ? s.vineTick : s.gearTick) : s.emptyTick]} />)}</View>}
    </View>
  );
}

function VineGate({ active }: { active: boolean }) {
  return <View style={[s.body, active && s.open]}>
    <View style={[s.vinePost, s.leftPost]} /><View style={[s.vinePost, s.rightPost]} /><View style={s.vineArch} /><View style={s.vineCore} />
    {[0, 1, 2, 3].map(i => <View key={i} style={[s.leaf, i % 2 ? s.rightLeaf : s.leftLeaf, { top: 23 + i * 8 }]} />)}
  </View>;
}

function GearGate({ active }: { active: boolean }) {
  return <View style={[s.body, active && s.open]}>
    <View style={[s.gearPost, s.leftPost]} /><View style={[s.gearPost, s.rightPost]} /><View style={s.gearArch} />
    <View style={s.cog}><View style={s.cogCore} /></View><View style={[s.chevron, s.chevronOne]} /><View style={[s.chevron, s.chevronTwo]} />
  </View>;
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', overflow: 'visible', alignItems: 'center' },
  aura: { position: 'absolute', top: 14, width: 52, height: 52, borderRadius: 26, transform: [{ scaleX: 0.7 }] },
  vineAura: { backgroundColor: '#8edb85', shadowColor: '#d8ffd1', shadowOpacity: 0.9, shadowRadius: 10, elevation: 8 }, gearAura: { backgroundColor: '#ffd56a', shadowColor: '#fff1b0', shadowOpacity: 0.9, shadowRadius: 10, elevation: 8 },
  hint: { position: 'absolute', top: -22, alignItems: 'center', width: 46 }, arrow: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent' }, vineArrow: { borderBottomColor: '#d9ffd4' }, gearArrow: { borderBottomColor: '#fff1b0' },
  hintText: { marginTop: 1, fontSize: 5.5, fontWeight: '900', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 2 }, vineText: { color: '#e5ffe1' }, gearText: { color: '#fff1b0' },
  body: { position: 'absolute', bottom: 0, width: 30, height: 62, opacity: 0.88 }, open: { opacity: 1 },
  vinePost: { position: 'absolute', bottom: 0, width: 5, height: 45, borderRadius: 4, backgroundColor: '#285940', borderWidth: 1, borderColor: '#9fdc83' }, gearPost: { position: 'absolute', bottom: 0, width: 5, height: 45, borderRadius: 2, backgroundColor: '#7c5420', borderWidth: 1, borderColor: '#f5c761' }, leftPost: { left: 3 }, rightPost: { right: 3 },
  vineArch: { position: 'absolute', left: 4, right: 4, top: 8, height: 26, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderTopWidth: 5, borderLeftWidth: 4, borderRightWidth: 4, borderColor: '#3c7a56' }, vineCore: { position: 'absolute', top: 24, left: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: '#e7ffb5', borderWidth: 2, borderColor: '#72ae5e' },
  leaf: { position: 'absolute', width: 8, height: 5, borderRadius: 8, backgroundColor: '#8ecf74', borderWidth: 0.5, borderColor: '#d8ffbe' }, leftLeaf: { left: -1, transform: [{ rotate: '-35deg' }] }, rightLeaf: { right: -1, transform: [{ rotate: '35deg' }] },
  gearArch: { position: 'absolute', left: 4, right: 4, top: 8, height: 26, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderTopWidth: 5, borderLeftWidth: 4, borderRightWidth: 4, borderColor: '#c98a24' }, cog: { position: 'absolute', top: 21, left: 8, width: 14, height: 14, borderRadius: 7, backgroundColor: '#e0a94f', borderWidth: 2, borderColor: '#7c5420', alignItems: 'center', justifyContent: 'center' }, cogCore: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff1b0' },
  chevron: { position: 'absolute', width: 8, height: 8, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#fff1b0', transform: [{ rotate: '45deg' }] }, chevronOne: { top: 41, left: 7 }, chevronTwo: { top: 41, left: 14 },
  timer: { position: 'absolute', bottom: -8, flexDirection: 'row', gap: 1.5, paddingHorizontal: 2, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(20,24,22,0.78)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.28)' }, tick: { width: 3, height: 5, borderRadius: 1.5 }, vineTick: { backgroundColor: '#baff95' }, gearTick: { backgroundColor: '#ffd56a' }, emptyTick: { backgroundColor: 'rgba(255,255,255,0.2)' },
});
