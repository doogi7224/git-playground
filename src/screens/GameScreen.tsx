import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Controls from '../components/Controls';
import CoinView from '../components/CoinView';
import EnemyView from '../components/EnemyView';
import FlagView from '../components/FlagView';
import Hud from '../components/Hud';
import PlatformView from '../components/PlatformView';
import PlayerView from '../components/PlayerView';
import { VIEWPORT_HEIGHT } from '../game/constants';
import { createLevel } from '../game/level';
import { computeCameraX, createInitialState, stepGame } from '../game/physics';
import { GameState, InputState } from '../game/types';

export default function GameScreen({ onExit }: { onExit: () => void }) {
  const { width: windowWidth } = useWindowDimensions();
  const level = useMemo(() => createLevel(), []);
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(level));

  const inputRef = useRef<InputState>({ left: false, right: false, jumpPressed: false });
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
        };
        inputRef.current.jumpPressed = false;
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
        <View style={[styles.world, { width: level.worldWidth, transform: [{ translateX: -cameraX }] }]}>
          {level.platforms.map((p) => (
            <PlatformView key={p.id} platform={p} />
          ))}
          <FlagView flag={level.flag} />
          {gameState.coins.map((c) => (
            <CoinView key={c.id} coin={c} />
          ))}
          {gameState.enemies.map((e) => (
            <EnemyView key={e.id} enemy={e} />
          ))}
          <PlayerView player={gameState.player} />
        </View>
      </View>

      <Hud score={gameState.score} lives={gameState.lives} />

      <Controls
        onLeftIn={() => (inputRef.current.left = true)}
        onLeftOut={() => (inputRef.current.left = false)}
        onRightIn={() => (inputRef.current.right = true)}
        onRightOut={() => (inputRef.current.right = false)}
        onJump={() => (inputRef.current.jumpPressed = true)}
      />

      {gameState.phase !== 'playing' && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>{gameState.phase === 'win' ? '🎉 클리어!' : '💀 게임 오버'}</Text>
          <Text style={styles.overlayScore}>코인 {gameState.score}점</Text>
          <View style={styles.overlayButtons}>
            <Pressable style={styles.overlayButton} onPress={restart}>
              <Text style={styles.overlayButtonText}>다시 시작</Text>
            </Pressable>
            <Pressable style={[styles.overlayButton, styles.secondaryButton]} onPress={onExit}>
              <Text style={styles.overlayButtonText}>메인 메뉴</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#87ceeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    overflow: 'hidden',
    backgroundColor: '#87ceeb',
  },
  world: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  overlayTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  overlayScore: {
    fontSize: 18,
    color: '#fff',
  },
  overlayButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  overlayButton: {
    backgroundColor: '#ffd54a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  secondaryButton: {
    backgroundColor: '#9aa0a6',
  },
  overlayButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3a2a00',
  },
});
