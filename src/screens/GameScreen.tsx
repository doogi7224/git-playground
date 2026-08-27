import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Background from '../components/Background';
import BioCoilView from '../components/BioCoilView';
import BossView from '../components/BossView';
import CheckpointView from '../components/CheckpointView';
import CogPickupView from '../components/CogPickupView';
import Controls from '../components/Controls';
import CoinView from '../components/CoinView';
import CorpsePlatformView from '../components/CorpsePlatformView';
import EffectsView from '../components/EffectsView';
import EnemyView from '../components/EnemyView';
import FlagView from '../components/FlagView';
import Hud from '../components/Hud';
import PlatformView from '../components/PlatformView';
import PlayerView from '../components/PlayerView';
import PortalView from '../components/PortalView';
import PressurePistonView from '../components/PressurePistonView';
import RootPointView from '../components/RootPointView';
import RopeView from '../components/RopeView';
import ShiftNodeView from '../components/ShiftNodeView';
import SporeSpriteView from '../components/SporeSpriteView';
import SteamBlowerView from '../components/SteamBlowerView';
import { VIEWPORT_HEIGHT } from '../game/constants';
import { createLevel } from '../game/level';
import { computeCameraX, createInitialState, stepGame } from '../game/physics';
import { GameState, InputState } from '../game/types';
import { palette } from '../theme';

// Presentation-only layout constants (not game/constants.ts): how much screen
// space to reserve above/below the scaled game stage so the HUD and mobile
// controls never overlap the ground/platform band of the world. Sized to
// comfortably clear Hud's own content height and Controls' tallest (jump)
// button + its bottom offset/shadow.
const HUD_RESERVED_TOP = 96;
const CONTROLS_RESERVED_BOTTOM = 130;
// Clamp how far the fixed VIEWPORT_HEIGHT logical space is scaled up/down so
// very short landscape windows don't over-shrink the world while tall phone
// and tablet layouts can still fill the full band between HUD and controls.
const MIN_STAGE_SCALE = 0.6;
const MAX_STAGE_SCALE = 4.5;

export default function GameScreen({ onExit }: { onExit: () => void }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // The world's Y coordinates (ground, platforms, enemy spawn heights, etc.)
  // are all authored against the fixed VIEWPORT_HEIGHT logical space and must
  // stay untouched — see CLAUDE.md 19 ("그래픽과 실제 충돌 박스를 분리한다").
  // Rather than stretching that logical space, we scale the whole stage up
  // to fill the actual device screen and shrink how many world-px are
  // visible horizontally to match, so gameplay math never sees this at all.
  const availableStageHeight = Math.max(120, windowHeight - HUD_RESERVED_TOP - CONTROLS_RESERVED_BOTTOM);
  const stageScale = Math.min(
    MAX_STAGE_SCALE,
    Math.max(MIN_STAGE_SCALE, availableStageHeight / VIEWPORT_HEIGHT)
  );
  const viewportWidth = windowWidth / stageScale;
  const level = useMemo(() => createLevel(), []);
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(level));

  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jumpPressed: false,
    dashPressed: false,
    grappleHeld: false,
  });
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const loop = (now: number) => {
      if (lastTimeRef.current != null) {
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
        const input: InputState = {
          left: inputRef.current.left,
          right: inputRef.current.right,
          jumpPressed: inputRef.current.jumpPressed,
          dashPressed: inputRef.current.dashPressed,
          grappleHeld: inputRef.current.grappleHeld,
        };
        inputRef.current.jumpPressed = false;
        inputRef.current.dashPressed = false;
        setGameState((prev) => stepGame(prev, input, level, dt));
      }
      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [level]);

  const restart = useCallback(() => {
    setGameState(createInitialState(level));
  }, [level]);

  const cameraX = computeCameraX(gameState.player.x, viewportWidth, level.worldWidth);

  // A short full-stage color wash the instant bloomState flips, on top of
  // Background's own slower cross-fade and Hud's badge pulse — together they
  // make a Bloom Shift read as "the world just changed" rather than just a
  // platform re-color (CLAUDE.md 19 — Bloom Shift 연출).
  const bloomFlash = useRef(new Animated.Value(0)).current;
  const prevBloomStateRef = useRef(gameState.bloomState);
  useEffect(() => {
    if (prevBloomStateRef.current !== gameState.bloomState) {
      prevBloomStateRef.current = gameState.bloomState;
      bloomFlash.setValue(1);
      Animated.timing(bloomFlash, { toValue: 0, duration: 550, useNativeDriver: true }).start();
    }
  }, [gameState.bloomState, bloomFlash]);
  const bloomFlashOpacity = bloomFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  return (
    <View style={styles.outer}>
      <View style={[styles.stageClip, { top: HUD_RESERVED_TOP, height: availableStageHeight }]}>
        <View
          style={[
            styles.stage,
            { width: viewportWidth, height: VIEWPORT_HEIGHT, transform: [{ scale: stageScale }] },
          ]}
        >
          <Background
            cameraX={cameraX}
            worldWidth={level.worldWidth}
            viewportWidth={viewportWidth}
            viewportHeight={VIEWPORT_HEIGHT}
            bloomState={gameState.bloomState}
          />
          <View style={[styles.world, { width: level.worldWidth, transform: [{ translateX: -cameraX }] }]}>
            {level.platforms
              .filter((p) => !p.visibleIn || p.visibleIn === gameState.bloomState)
              .map((p) => (
                <PlatformView key={p.id} platform={p} />
              ))}
            {gameState.corpsePlatforms.map((p) => (
              <CorpsePlatformView key={p.id} platform={p} />
            ))}
            {level.shiftNodes.map((n) => (
              <ShiftNodeView key={n.id} node={n} bloomState={gameState.bloomState} />
            ))}
            {level.rootPoints.map((r) => (
              <RootPointView key={r.id} point={r} />
            ))}
            {gameState.cogPickups.map((c) => (
              <CogPickupView key={c.id} cog={c} />
            ))}
            {level.checkpoints.slice(1).map((c, i) => (
              <CheckpointView key={i} x={c.x} groundY={level.groundY} reached={gameState.checkpointIndex >= i + 1} />
            ))}
            {gameState.pressurePistons.map((p) => (
              <PressurePistonView key={p.id} piston={p} bloomState={gameState.bloomState} />
            ))}
            <FlagView flag={level.flag} />
            <PortalView portal={level.portal} />
            <BossView boss={gameState.boss} />
            {gameState.coins.map((c) => (
              <CoinView key={c.id} coin={c} />
            ))}
            {gameState.enemies.map((e) => (
              <EnemyView key={e.id} enemy={e} bloomState={gameState.bloomState} />
            ))}
            {gameState.bioCoils.map((c) => (
              <BioCoilView key={c.id} coil={c} />
            ))}
            {gameState.steamBlowers.map((b) => (
              <SteamBlowerView key={b.id} blower={b} bloomState={gameState.bloomState} />
            ))}
            {gameState.sporeSprites.map((s) => (
              <SporeSpriteView key={s.id} sprite={s} bloomState={gameState.bloomState} />
            ))}
            <RopeView player={gameState.player} />
            <PlayerView player={gameState.player} />
            <EffectsView effects={gameState.effects} />
          </View>
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bloomFlash,
            {
              backgroundColor: gameState.bloomState === 'wild' ? palette.moss : palette.uiPrimary,
              opacity: bloomFlashOpacity,
            },
          ]}
        />
      </View>

      <Hud
        score={gameState.score}
        lives={gameState.lives}
        bloomState={gameState.bloomState}
        overdriveGauge={gameState.player.overdriveGauge}
        overdriveActive={gameState.player.overdriveTimer > 0}
        equippedCogs={[gameState.player.equippedHead, gameState.player.equippedBody, gameState.player.equippedFoot]}
      />

      <Controls
        onLeftIn={() => (inputRef.current.left = true)}
        onLeftOut={() => (inputRef.current.left = false)}
        onRightIn={() => (inputRef.current.right = true)}
        onRightOut={() => (inputRef.current.right = false)}
        onJump={() => (inputRef.current.jumpPressed = true)}
        onDash={() => (inputRef.current.dashPressed = true)}
        onGrappleIn={() => (inputRef.current.grappleHeld = true)}
        onGrappleOut={() => (inputRef.current.grappleHeld = false)}
      />

      {gameState.phase !== 'playing' && (
        <View style={styles.overlay}>
          <View
            style={[
              styles.card,
              { borderColor: gameState.phase === 'win' ? palette.moss : palette.uiDanger },
            ]}
          >
            <View style={[styles.rivetCorner, styles.rivetTL]} />
            <View style={[styles.rivetCorner, styles.rivetTR]} />
            <View style={[styles.rivetCorner, styles.rivetBL]} />
            <View style={[styles.rivetCorner, styles.rivetBR]} />
            <Text style={styles.overlayEyebrow}>
              {gameState.phase === 'win' ? 'EXPEDITION COMPLETE' : 'EXPEDITION INTERRUPTED'}
            </Text>
            <View
              style={[
                styles.statusSeal,
                { borderColor: gameState.phase === 'win' ? palette.moss : palette.uiDanger },
              ]}
            >
              <View
                style={[
                  styles.statusSealCore,
                  { backgroundColor: gameState.phase === 'win' ? palette.moss : palette.uiDanger },
                ]}
              />
            </View>
            <Text style={styles.overlayTitle}>
              {gameState.phase === 'win' ? '기어숲의 심장이 다시 뜁니다' : '태엽이 멈췄습니다'}
            </Text>
            <Text style={styles.overlaySubtitle}>
              {gameState.phase === 'win' ? '보호자를 깨우고 숲의 균형을 되찾았습니다.' : '장비를 정비하고 마지막 체크포인트에서 다시 도전하세요.'}
            </Text>
            <View style={styles.overlayScorePanel}>
              <Text style={styles.overlayScoreLabel}>COLLECTED GEAR</Text>
              <View style={styles.overlayScoreRow}>
                <View style={styles.coinDot}><View style={styles.coinDotCore} /></View>
                <Text style={styles.overlayScore}>{gameState.score}</Text>
              </View>
            </View>
            <View style={styles.overlayButtons}>
              <Pressable onPress={restart}>
                <LinearGradient colors={[palette.uiPrimary, palette.uiPrimaryDark]} style={styles.overlayButton}>
                  <Text style={styles.overlayButtonKicker}>RETRY EXPEDITION</Text>
                  <Text style={styles.overlayButtonText}>다시 도전</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={onExit}>
                <LinearGradient
                  colors={[palette.uiSecondary, palette.uiSecondaryDark]}
                  style={styles.overlayButton}
                >
                  <Text style={styles.overlayButtonKickerLight}>RETURN TO WORKSHOP</Text>
                  <Text style={styles.overlayButtonTextLight}>메인 메뉴</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: palette.skyBottom,
  },
  // Fixed-height band between the HUD and the mobile controls; clips the
  // scaled stage so it can never paint over either.
  stageClip: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  // Laid out at its own small logical size (VIEWPORT_HEIGHT-tall) and then
  // scaled up from its top-left corner to exactly fill stageClip — see the
  // stageScale comment above. Gameplay coordinates never see this scale.
  stage: {
    top: 0,
    left: 0,
    overflow: 'hidden',
    transformOrigin: 'top left',
  },
  world: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  bloomFlash: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.overlayBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '88%',
    maxWidth: 460,
    backgroundColor: palette.uiPlateDeep,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  // Same corner-bolt motif as Controls/StartScreen, tying the result screen
  // into the same steampunk instrument-panel language.
  rivetCorner: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: palette.woodDark,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  rivetTL: { top: 10, left: 10 },
  rivetTR: { top: 10, right: 10 },
  rivetBL: { bottom: 10, left: 10 },
  rivetBR: { bottom: 10, right: 10 },
  overlayTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: palette.coinShine,
    textAlign: 'center',
  },
  overlayEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: palette.uiTextMuted,
  },
  overlaySubtitle: {
    maxWidth: 340,
    fontSize: 12,
    lineHeight: 18,
    color: palette.uiTextMuted,
    textAlign: 'center',
  },
  statusSeal: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.uiPlate,
  },
  statusSealCore: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: palette.coinShine,
  },
  overlayScorePanel: {
    minWidth: 150,
    marginTop: 2,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.uiPlateEdge,
    backgroundColor: palette.uiPlate,
    alignItems: 'center',
  },
  overlayScoreLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: palette.uiTextMuted,
  },
  overlayScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.coinGold,
    borderWidth: 1.5,
    borderColor: palette.coinGoldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.coinShine,
  },
  overlayScore: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  overlayButtons: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
  },
  overlayButton: {
    minWidth: 132,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: palette.uiPlateHighlight,
    alignItems: 'center',
  },
  overlayButtonKicker: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#5a3d00',
  },
  overlayButtonKickerLight: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: palette.uiTextMuted,
  },
  overlayButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5a3d00',
  },
  overlayButtonTextLight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
