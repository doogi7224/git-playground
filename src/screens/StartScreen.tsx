import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Animated, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

export default function StartScreen({ onStart }: { onStart: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [guideOpen, setGuideOpen] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState(false);
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  if (guideOpen) {
    return (
      <ImageBackground source={require('../../assets/backgrounds/menu_forest_expedition_v1.png')} resizeMode="cover" style={styles.container}>
        <LinearGradient colors={['rgba(16,35,32,0.25)', 'rgba(18,28,24,0.78)']} style={StyleSheet.absoluteFill} />
        <View style={styles.guidePanel}>
          <Text style={styles.guideEyebrow}>WILDROOT FIELD GUIDE</Text>
          <Text style={styles.guideTitle}>적 · 아이템 도감</Text>
          <ScrollView style={styles.guideScroll} contentContainerStyle={styles.guideContent} showsVerticalScrollIndicator={false}>
            <GuideSection title="몬스터 · 위험 요소" entries={[
              ['Brambleling', '순찰하다 가까이 오면 짧게 돌진합니다. 밟거나 화살로 처치하세요.'],
              ['Acorn Hopper', '웅크린 뒤 전방으로 점프합니다. 발판 끝에서는 방향을 바꿉니다.'],
              ['Root Turret', '충전 후 플레이어가 있던 방향으로 씨앗 탄환을 쏩니다.'],
              ['Chestnut Roller', '걷다가 빠르게 구릅니다. 구르는 동안은 화살과 스톰프가 통하지 않습니다.'],
              ['Bio-Coil', '웅크린 뒤 크게 도약하는 식물형 적입니다. 착지 뒤에는 빈틈이 생깁니다.'],
              ['Spore Sprite · Piston', '포자는 가까이 가면 느려지고, 피스톤은 점화 구간에 닿으면 위험합니다.'],
              ['Rootwarden', '보스의 공격 예고를 피하고 빈틈이 열렸을 때 공격하세요.'],
            ]} />
            <GuideSection title="아이템 · 보상" entries={[
              ['Sunseed', '점수용 수집품입니다. 길과 발판의 안전한 진행 방향을 알려줍니다.'],
              ['Relic Bow', '초반에 획득하면 화살 3발을 얻습니다. 화살은 최대 5발까지 보유합니다.'],
              ['자석', '30초 동안 가까운 Sunseed를 자동으로 끌어옵니다.'],
              ['보호막', '일반 피격을 한 번 막아주는 보호막을 충전합니다. 낙사는 막지 않습니다.'],
              ['? Root Cache', '아래에서 점프로 치면 자석·보호막·화살 +1·생명 +1 중 하나가 무작위로 나옵니다. 이후에도 고체 블록으로 남습니다.'],
              ['Relic Target', '유물 활의 화살로만 맞혀 열 수 있는 숲 과녁 보상입니다.'],
            ]} />
          </ScrollView>
          <Pressable onPress={() => setGuideOpen(false)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 시작 화면으로</Text>
          </Pressable>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/backgrounds/menu_forest_expedition_v1.png')} resizeMode="cover" style={styles.container}>
      <LinearGradient
        colors={['rgba(9,24,22,0.14)', 'rgba(11,27,24,0.18)', 'rgba(9,20,18,0.72)']}
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
        <Text style={styles.title}>GEARWOOD</Text>
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
              달리고, 뛰고, 대시하고, 루트훅을 이어 숲의 길을 완주하세요.
            </Text>
            <Text style={styles.featureLine}>DASH  ·  ROOT-HOOK  ·  RELIC BOW</Text>
          </View>
        </View>

        <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onStart}>
          <Animated.View style={[styles.startButtonShadow, { transform: [{ scale }] }]}>
            <LinearGradient colors={[palette.uiPrimary, palette.uiPrimaryDark]} style={styles.startButton}>
              <View style={styles.startGlassHighlight} />
              <Text style={styles.startKicker}>BEGIN THE ADVENTURE</Text>
              <Text style={styles.startLabel}>모험 시작</Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>

        <View style={styles.secondaryActions}>
          <Pressable onPress={() => setGuideOpen(true)} style={styles.guideButton}>
            <Text style={styles.guideButtonText}>도감</Text>
          </Pressable>
          <Pressable onPress={() => setSettingsNotice(true)} style={styles.guideButton}>
            <Text style={styles.guideButtonText}>설정</Text>
          </Pressable>
        </View>

        {settingsNotice ? (
          <View style={styles.settingsNotice}>
            <Text style={styles.settingsNoticeText}>설정 메뉴는 준비 중입니다.</Text>
            <Pressable onPress={() => setSettingsNotice(false)} hitSlop={8}>
              <Text style={styles.settingsNoticeClose}>닫기</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.controlStrip}>
          <Text style={styles.hint}>◀▶ 이동　▲ 점프　» 대시　◎ 루트훅　➤ 활</Text>
          <Text style={styles.hintSub}>활은 초반 유물 획득 후 사용 · 적은 밟거나 화살로 대응</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

function GuideSection({ title, entries }: { title: string; entries: [string, string][] }) {
  return (
    <View style={styles.guideSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {entries.map(([name, description]) => (
        <View key={name} style={styles.guideEntry}>
          <Text style={styles.entryName}>{name}</Text>
          <Text style={styles.entryDescription}>{description}</Text>
        </View>
      ))}
    </View>
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
    width: '100%', maxWidth: 560, alignItems: 'center', paddingVertical: 18, paddingHorizontal: 22,
    borderRadius: 22, backgroundColor: 'rgba(19,29,25,0.79)', borderWidth: 2, borderColor: palette.uiPlateEdge,
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
    marginTop: 3, fontSize: 42, lineHeight: 46, fontWeight: '900', color: palette.coinShine, letterSpacing: 2,
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
  hero: { width: 86, height: 86 },
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
  secondaryActions: { marginTop: 10, flexDirection: 'row', gap: 9 },
  guideButton: { minWidth: 118, alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: palette.uiPlateEdge, backgroundColor: 'rgba(22, 30, 25, 0.76)' },
  guideButtonText: { color: palette.coinShine, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  settingsNotice: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(8, 15, 13, 0.82)' },
  settingsNoticeText: { color: palette.uiTextMuted, fontSize: 10, fontWeight: '700' },
  settingsNoticeClose: { color: palette.coinShine, fontSize: 10, fontWeight: '900' },
  controlStrip: {
    width: '100%', marginTop: 15, paddingTop: 10, alignItems: 'center', borderTopWidth: 1,
    borderColor: palette.uiPlateEdge,
  },
  hint: { fontSize: 11, fontWeight: '800', color: '#fff', textAlign: 'center' },
  hintSub: { marginTop: 3, fontSize: 9, color: palette.uiTextMuted, textAlign: 'center' },
  guidePanel: { width: '100%', maxWidth: 600, maxHeight: '88%', borderRadius: 20, padding: 20, backgroundColor: 'rgba(24, 33, 28, 0.94)', borderWidth: 2, borderColor: palette.uiPlateEdge },
  guideEyebrow: { color: palette.mossTint, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, textAlign: 'center' },
  guideTitle: { marginTop: 3, color: palette.coinShine, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  guideScroll: { marginTop: 13 },
  guideContent: { gap: 13, paddingBottom: 4 },
  guideSection: { gap: 7 },
  sectionTitle: { color: palette.uiPrimary, fontSize: 14, fontWeight: '900', letterSpacing: 0.4 },
  guideEntry: { padding: 10, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  entryName: { color: '#fff', fontSize: 13, fontWeight: '900' },
  entryDescription: { marginTop: 3, color: palette.uiTextMuted, fontSize: 11, lineHeight: 16 },
  backButton: { marginTop: 14, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: palette.uiPlateEdge, paddingVertical: 10, backgroundColor: palette.uiPlate },
  backButtonText: { color: palette.coinShine, fontSize: 13, fontWeight: '900' },
});
