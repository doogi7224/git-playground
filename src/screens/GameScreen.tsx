import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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

export default function GameScreen({ onExit }: { onExit: () => void }) {
  const { width: windowWidth } = useWindowDimensions();
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

  const cameraX = computeCameraX(gameState.player.x, windowWidth, level.worldWidth);

  return (
    <View style={styles.outer}>
      <View style={[styles.stage, { width: windowWidth, height: VIEWPORT_HEIGHT }]}>
        <Background cameraX={cameraX} worldWidth={level.worldWidth} viewportHeight={VIEWPORT_HEIGHT} />
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
          <View style={styles.card}>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  world: {
    position: 'absolute',
    top: 0,
    bottom: 0,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
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
