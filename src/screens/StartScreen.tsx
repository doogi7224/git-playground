import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

export default function StartScreen({ onStart }: { onStart: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <ImageBackground source={require('../../assets/backgrounds/scene_forest_v3.png')} resizeMode="cover" style={styles.container}>
      <LinearGradient
        colors={['rgba(16,35,32,0.04)', 'rgba(22,40,34,0.18)', 'rgba(18,28,24,0.62)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.ambientLeafA} />
      <View style={styles.ambientLeafB} />

      <View style={styles.brassPanel}>
        <View style={[styles.rivetCorner, styles.rivetTL]} />
        <View style={[styles.rivetCorner, styles.rivetTR]} />
        <View style={[styles.rivetCorner, styles.rivetBL]} />
        <View style={[styles.rivetCorner, styles.rivetBR]} />

        <Text style={styles.eyebrow}>A BRIGHT FOREST EXPEDITION</Text>
        <Text style={styles.title}>WILDROOT</Text>
        <View style={styles.titleRule}>
          <View style={styles.ruleLine} />
          <View style={styles.ruleLeaf}><View style={styles.ruleLeafCore} /></View>
          <View style={styles.ruleLine} />
        </View>
        <Text style={styles.tagline}>THE SUNSEED TRAIL · 태양씨앗의 길</Text>

        <View style={styles.heroRow}>
          <Image
            source={require('../../assets/sprites/scout_v3/scout_idle_0.png')}
            resizeMode="contain"
            style={styles.hero}
          />
          <View style={styles.storyBlock}>
            <Text style={styles.storyTitle}>숲의 흐름을 이어가라</Text>
            <Text style={styles.subtitle}>
              달리고, 뛰고, 대시하고, 루트훅을 이어 태양씨앗의 길을 완주하세요.
            </Text>
            <Text style={styles.featureLine}>DASH  ·  ROOT-HOOK  ·  RELIC BOW</Text>
          </View>
        </View>

        <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onStart}>
          <Animated.View style={[styles.startButtonShadow, { transform: [{ scale }] }]}>
            <LinearGradient colors={[palette.uiPrimary, palette.uiPrimaryDark]} style={styles.startButton}>
              <View style={styles.startGlassHighlight} />
              <Text style={styles.startKicker}>BEGIN THE TRAIL</Text>
              <Text style={styles.startLabel}>여정 시작</Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>

        <View style={styles.controlStrip}>
          <Text style={styles.hint}>◀▶ 이동　▲ 점프　» 대시　◎ 루트훅　➤ 활</Text>
          <Text style={styles.hintSub}>활은 초반 유물 획득 후 사용 · 적은 밟거나 화살로 대응</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, overflow: 'hidden' },
  ambientLeafA: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 18,
    borderColor: 'rgba(150, 217, 141, 0.12)', left: -72, bottom: -42,
  },
  ambientLeafB: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 13,
    borderColor: 'rgba(240, 198, 93, 0.12)', right: -40, top: 52,
  },
  brassPanel: {
    width: '100%', maxWidth: 560, alignItems: 'center', paddingVertical: 22, paddingHorizontal: 22,
    borderRadius: 22, backgroundColor: 'rgba(28,38,31,0.76)', borderWidth: 2, borderColor: palette.uiPlateEdge,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 12,
  },
  rivetCorner: {
    position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: palette.uiPrimary,
    borderWidth: 1, borderColor: palette.dirtDark,
  },
  rivetTL: { top: 9, left: 9 },
  rivetTR: { top: 9, right: 9 },
  rivetBL: { bottom: 9, left: 9 },
  rivetBR: { bottom: 9, right: 9 },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.8, color: palette.uiTextMuted },
  title: {
    marginTop: 3, fontSize: 44, lineHeight: 48, fontWeight: '900', color: palette.coinShine, letterSpacing: 2,
    textShadowColor: palette.uiPrimaryDark, textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0,
  },
  titleRule: { width: '72%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleLine: { flex: 1, height: 1, backgroundColor: palette.uiPlateEdge },
  ruleLeaf: {
    width: 14, height: 10, borderRadius: 8, backgroundColor: palette.mossTint,
    alignItems: 'center', justifyContent: 'center',
  },
  ruleLeafCore: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.uiPlateDeep },
  tagline: { marginTop: 4, fontSize: 12, fontWeight: '800', color: palette.uiPrimary, letterSpacing: 0.8 },
  heroRow: {
    width: '100%', marginTop: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  hero: { width: 96, height: 96 },
  storyBlock: { flexShrink: 1, maxWidth: 330, gap: 5 },
  storyTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 13, lineHeight: 19, color: palette.uiTextMuted },
  featureLine: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: palette.mossTint },
  startButtonShadow: {
    marginTop: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 7, elevation: 8,
  },
  startButton: {
    minWidth: 210, paddingHorizontal: 34, paddingVertical: 10, borderRadius: 12, borderWidth: 2,
    borderColor: palette.coinShine, alignItems: 'center', overflow: 'hidden',
  },
  startGlassHighlight: {
    position: 'absolute', top: 3, left: '8%', right: '8%', height: '35%', borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  startKicker: { fontSize: 7, fontWeight: '900', letterSpacing: 1.2, color: '#5a3d00' },
  startLabel: { fontSize: 19, lineHeight: 23, fontWeight: '900', color: '#4b3200' },
  controlStrip: {
    width: '100%', marginTop: 15, paddingTop: 10, alignItems: 'center', borderTopWidth: 1,
    borderColor: palette.uiPlateEdge,
  },
  hint: { fontSize: 11, fontWeight: '800', color: '#fff', textAlign: 'center' },
  hintSub: { marginTop: 3, fontSize: 9, color: palette.uiTextMuted, textAlign: 'center' },
});
