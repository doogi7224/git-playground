import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Background from '../components/Background';
import BioCoilView from '../components/BioCoilView';
import CheckpointView from '../components/CheckpointView';
import CogPickupView from '../components/CogPickupView';
import Controls from '../components/Controls';
import CoinView from '../components/CoinView';
import CorpsePlatformView from '../components/CorpsePlatformView';
import EnemyView from '../components/EnemyView';
import FlagView from '../components/FlagView';
import Hud from '../components/Hud';
import PlatformView from '../components/PlatformView';
import PlayerView from '../components/PlayerView';
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
// very short (landscape phone) or very tall (desktop) windows don't zoom the
// world to an absurd degree.
const MIN_STAGE_SCALE = 0.6;
const MAX_STAGE_SCALE = 3;

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
            <Text style={styles.overlayTitle}>{gameState.phase === 'win' ? '🎉 클리어!' : '💀 게임 오버'}</Text>
            <View style={styles.overlayScoreRow}>
              <View style={styles.coinDot} />
              <Text style={styles.overlayScore}>{gameState.score}점</Text>
            </View>
            <View style={styles.overlayButtons}>
              <Pressable onPress={restart}>
                <LinearGradient colors={[palette.uiPrimary, palette.uiPrimaryDark]} style={styles.overlayButton}>
                  <Text style={styles.overlayButtonText}>다시 시작</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={onExit}>
                <LinearGradient
                  colors={[palette.uiSecondary, palette.uiSecondaryDark]}
                  style={styles.overlayButton}
                >
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
    backgroundColor: palette.cardBg,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 36,
    alignItems: 'center',
    gap: 14,
    borderWidth: 3,
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
    fontSize: 30,
    fontWeight: '800',
    color: palette.textDark,
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
  },
  overlayScore: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textDark,
  },
  overlayButtons: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
  },
  overlayButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
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
