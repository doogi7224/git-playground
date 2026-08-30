import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { STAGE_CATALOG, StageId } from '../stages';
import { palette } from '../theme';

interface Props {
  onSelect: (stage: StageId) => void;
  onBack: () => void;
}


export default function StageSelectScreen({ onSelect, onBack }: Props) {
  return (
    <ImageBackground source={require('../../assets/backgrounds/menu_forest_expedition_clean_v2.png')} resizeMode="cover" style={styles.container}>
      <LinearGradient colors={['rgba(8, 22, 19, 0.32)', 'rgba(8, 18, 18, 0.86)']} style={StyleSheet.absoluteFill} />
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>CHOOSE YOUR EXPEDITION</Text>
        <Text style={styles.title}>스테이지 선택</Text>
        <Text style={styles.subtitle}>원정할 지역을 선택하세요</Text>
        <ScrollView style={styles.stageScroll} contentContainerStyle={styles.stageList} showsVerticalScrollIndicator={false}>
          {STAGE_CATALOG.map((stage) => (
            <Pressable key={stage.id} onPress={() => onSelect(stage.id)} style={styles.cardShadow}>
              <ImageBackground source={stage.image} resizeMode="cover" style={styles.card} imageStyle={styles.cardImage}>
                <LinearGradient colors={['rgba(9, 24, 23, 0.08)', 'rgba(7, 16, 16, 0.9)']} style={StyleSheet.absoluteFill} />
                <View style={styles.cardBadge}><Text style={styles.cardBadgeText}>{stage.badge}</Text></View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardSubtitle}>{stage.subtitle}</Text>
                  <Text style={styles.cardTitle}>{stage.title}</Text>
                  <Text style={styles.cardDetail}>{stage.detail}</Text>
                </View>
                <View style={styles.playSeal}><Text style={styles.playSealText}>▶</Text></View>
              </ImageBackground>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>← 메인 메뉴</Text></Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  panel: { width: '100%', maxWidth: 760, padding: 24, borderRadius: 22, borderWidth: 1.5, borderColor: palette.uiPlateEdge, backgroundColor: 'rgba(13, 28, 25, 0.88)', alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: palette.mossTint },
  title: { marginTop: 3, fontSize: 29, fontWeight: '900', color: '#fff' },
  subtitle: { marginTop: 5, fontSize: 13, color: palette.uiTextMuted },
  stageScroll: { width: '100%', maxHeight: 360, marginTop: 18 },
  stageList: { gap: 12, paddingBottom: 2 },
  cardShadow: { borderRadius: 15, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 7 },
  card: { height: 118, padding: 14, justifyContent: 'flex-end', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(237, 201, 112, 0.8)', borderRadius: 15 },
  cardImage: { borderRadius: 13 },
  cardBadge: { position: 'absolute', top: 11, left: 11, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: 'rgba(12, 24, 21, 0.82)', borderWidth: 1, borderColor: 'rgba(255, 226, 142, 0.55)' },
  cardBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: '#ffe5a2' },
  cardCopy: { maxWidth: '80%' },
  cardSubtitle: { fontSize: 8, fontWeight: '900', letterSpacing: 1.2, color: '#b7ead6' },
  cardTitle: { marginTop: 2, fontSize: 20, fontWeight: '900', color: '#fff' },
  cardDetail: { marginTop: 2, fontSize: 11, color: 'rgba(255,255,255,0.78)' },
  playSeal: { position: 'absolute', right: 15, bottom: 15, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(220, 161, 56, 0.92)', borderWidth: 2, borderColor: '#fff0b9' },
  playSealText: { marginLeft: 2, fontSize: 17, color: '#493000' },
  backButton: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 9, borderWidth: 1, borderColor: palette.uiPlateEdge, backgroundColor: 'rgba(8, 17, 15, 0.7)' },
  backText: { fontSize: 12, fontWeight: '900', color: palette.coinShine },
});
