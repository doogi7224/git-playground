import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Background from '../components/Background';
import ArrowView from '../components/ArrowView';
import BioCoilView from '../components/BioCoilView';
import BossView from '../components/BossView';
import BowPickupView from '../components/BowPickupView';
import CheckpointView from '../components/CheckpointView';
import ChestnutRollerView from '../components/ChestnutRollerView';
import LootRevealView from '../components/LootRevealView';
import CogPickupView from '../components/CogPickupView';
import Controls from '../components/Controls';
import CoinView from '../components/CoinView';
import EffectsView from '../components/EffectsView';
import EnemyView from '../components/EnemyView';
import FlagView from '../components/FlagView';
import Hud from '../components/Hud';
import JumperView from '../components/JumperView';
import PlatformView from '../components/PlatformView';
import PlayerView from '../components/PlayerView';
import PortalView from '../components/PortalView';
import PressurePistonView from '../components/PressurePistonView';
import RootPointView from '../components/RootPointView';
import RopeView from '../components/RopeView';
import SeedProjectileView from '../components/SeedProjectileView';
import SporeSpriteView from '../components/SporeSpriteView';
import TurretView from '../components/TurretView';
import TreasureCacheView from '../components/TreasureCacheView';
import { VIEWPORT_HEIGHT } from '../game/constants';
import { createLevel } from '../game/level';
import { computeCameraX, createInitialState, stepGame } from '../game/physics';
import { GameState, InputState } from '../game/types';
import { palette } from '../theme';

// The game world must use the complete available device frame.  A fixed 16:9
// container creates black pillarboxes on wide landscape phones, which reads
// as a broken background instead of intentional framing.
// At this zoom a 40px player reads at about 10% of the frame height on a
// 16:9 phone, matching the approved composition without changing any physics
// or hitbox constants. The extra logical space above is scenery only.
const DESIGN_VIEW_HEIGHT_MULTIPLIER = 1.65;
const WORLD_BOTTOM_BREATHING_ROOM = 40;
const FIXED_STEP = 1 / 60;
const MAX_FRAME_TIME = 0.1;
const MAX_STEPS_PER_FRAME = 4;
// Keep one generous screen of overscan so fast dashes never reveal objects
// mounting at the edge. Everything farther away only wastes layout/animation
// work and is invisible behind stageClip.
const CULL_OVERSCAN_SCREENS = 1;

type HorizontalBounds = { x: number; width?: number };

export default function GameScreen({ onExit }: { onExit: () => void }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const frameWidth = windowWidth;
  const frameHeight = windowHeight;
  // The world's Y coordinates (ground, platforms, enemy spawn heights, etc.)
  // are all authored against the fixed VIEWPORT_HEIGHT logical space and must
  // stay untouched — see CLAUDE.md 19 ("그래픽과 실제 충돌 박스를 분리한다").
  // Rather than stretching that logical space, we scale the whole stage up
  // to fill the actual device screen and shrink how many world-px are
  // visible horizontally to match, so gameplay math never sees this at all.
  const logicalStageHeight = VIEWPORT_HEIGHT * DESIGN_VIEW_HEIGHT_MULTIPLIER;
  const stageScale = frameHeight / logicalStageHeight;
  const viewportWidth = frameWidth / stageScale;
  const worldOffsetY = logicalStageHeight - VIEWPORT_HEIGHT - WORLD_BOTTOM_BREATHING_ROOM;
  const level = useMemo(() => createLevel(), []);
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(level));

  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jumpPressed: false,
    dashPressed: false,
    grappleHeld: false,
    attackPressed: false,
  });
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    const loop = (now: number) => {
      if (lastTimeRef.current != null) {
        const frameTime = Math.min((now - lastTimeRef.current) / 1000, MAX_FRAME_TIME);
        accumulatorRef.current += frameTime;
        const input: InputState = {
          left: inputRef.current.left,
          right: inputRef.current.right,
          jumpPressed: inputRef.current.jumpPressed,
          dashPressed: inputRef.current.dashPressed,
          grappleHeld: inputRef.current.grappleHeld,
          attackPressed: inputRef.current.attackPressed,
        };
        const stepCount = Math.min(
          Math.floor(accumulatorRef.current / FIXED_STEP),
          MAX_STEPS_PER_FRAME,
        );
        if (stepCount > 0) {
          accumulatorRef.current -= stepCount * FIXED_STEP;
          if (stepCount === MAX_STEPS_PER_FRAME) {
            // Drop a runaway backlog after a long pause instead of spending
            // several frames visibly fast-forwarding the player.
            accumulatorRef.current = Math.min(accumulatorRef.current, FIXED_STEP);
          }
          inputRef.current.jumpPressed = false;
          inputRef.current.dashPressed = false;
          inputRef.current.attackPressed = false;
          setGameState((prev) => {
            let next = prev;
            for (let i = 0; i < stepCount; i += 1) {
              next = stepGame(
                next,
                i === 0
                  ? input
                  : { ...input, jumpPressed: false, dashPressed: false, attackPressed: false },
                level,
                FIXED_STEP,
              );
            }
            return next;
          });
        }
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
  const cullPadding = viewportWidth * CULL_OVERSCAN_SCREENS;
  const cullMinX = cameraX - cullPadding;
  const cullMaxX = cameraX + viewportWidth + cullPadding;
  const isVisible = ({ x, width = 0 }: HorizontalBounds) => x + width >= cullMinX && x <= cullMaxX;

  return (
    <View style={styles.outer}>
      <View style={[styles.gameFrame, { width: frameWidth, height: frameHeight }]}>
      <View style={styles.stageClip}>
        <View
          style={[
            styles.stage,
            { width: viewportWidth, height: logicalStageHeight, transform: [{ scale: stageScale }] },
          ]}
        >
          <Background cameraX={cameraX} worldWidth={level.worldWidth} viewportWidth={viewportWidth} viewportHeight={logicalStageHeight} />
          <View style={[styles.world, { top: worldOffsetY, width: level.worldWidth, transform: [{ translateX: -cameraX }] }]}>
            {level.platforms.filter(isVisible).map((p) => (
              <PlatformView key={p.id} platform={p} />
            ))}
            {level.rootPoints.filter(isVisible).map((r) => (
              <RootPointView key={r.id} point={r} />
            ))}
            {gameState.cogPickups.filter(isVisible).map((c) => (
              <CogPickupView key={c.id} cog={c} />
            ))}
            <BowPickupView pickup={gameState.bowPickup} />
            {level.checkpoints.slice(1).map((c, i) => ({ ...c, checkpointIndex: i + 1 })).filter(isVisible).map((c) => (
              <CheckpointView key={c.checkpointIndex} x={c.x} groundY={level.groundY} reached={gameState.checkpointIndex >= c.checkpointIndex} />
            ))}
            {gameState.pressurePistons.filter(isVisible).map((p) => (
              <PressurePistonView key={p.id} piston={p} />
            ))}
            <FlagView flag={level.flag} />
            <PortalView portal={level.portal} />
            <BossView boss={gameState.boss} />
            {gameState.coins.filter((c) => !c.collected && isVisible(c)).map((c) => (
              <CoinView key={c.id} coin={c} />
            ))}
            {gameState.enemies.filter(isVisible).map((e) => (
              <EnemyView key={e.id} enemy={e} />
            ))}
            {gameState.chestnutRollers.filter(isVisible).map((r) => (
              <ChestnutRollerView key={r.id} roller={r} />
            ))}
            {gameState.treasureCaches.filter(isVisible).map((c) => <TreasureCacheView key={c.id} cache={c} />)}
            {gameState.bioCoils.filter(isVisible).map((c) => (
              <BioCoilView key={c.id} coil={c} />
            ))}
            {gameState.sporeSprites.filter(isVisible).map((s) => (
              <SporeSpriteView key={s.id} sprite={s} />
            ))}
            {gameState.jumpers.filter(isVisible).map((j) => (
              <JumperView key={j.id} jumper={j} />
            ))}
            {gameState.turrets.filter(isVisible).map((t) => (
              <TurretView key={t.id} turret={t} />
            ))}
            {gameState.seeds.filter(isVisible).map((s) => (
              <SeedProjectileView key={s.id} seed={s} />
            ))}
            {gameState.arrows.filter(isVisible).map((a) => (
              <ArrowView key={a.id} arrow={a} />
            ))}
            <RopeView player={gameState.player} />
            <PlayerView player={gameState.player} />
            <EffectsView effects={gameState.effects} />
            {gameState.lootReveals.map((l) => <LootRevealView key={l.id} reveal={l} />)}
          </View>
        </View>
      </View>

      <Hud
        score={gameState.score}
        lives={gameState.lives}
        equippedCogs={[gameState.player.equippedHead, gameState.player.equippedBody, gameState.player.equippedFoot]}
        shieldCharges={gameState.player.shieldCharges}
        arrows={gameState.player.arrows}
        maxArrows={gameState.player.maxArrows}
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
        onAttack={() => (inputRef.current.attackPressed = true)}
        hasBow={gameState.player.hasBow}
        arrows={gameState.player.arrows}
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
              {gameState.phase === 'win' ? 'TRAIL COMPLETE' : 'TRAIL INTERRUPTED'}
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
              {gameState.phase === 'win' ? '태양씨앗의 길을 완주했습니다' : '길 위에서 잠시 멈췄습니다'}
            </Text>
            <Text style={styles.overlaySubtitle}>
              {gameState.phase === 'win' ? '숲의 표식을 되찾고, 다음 원정의 길을 열었습니다.' : '마지막 표식에서 다시 시작해 흐름을 이어가세요.'}
            </Text>
            <View style={styles.overlayScorePanel}>
              <Text style={styles.overlayScoreLabel}>SUNSEEDS COLLECTED</Text>
              <View style={styles.overlayScoreRow}>
                <View style={styles.coinDot}><View style={styles.coinDotCore} /></View>
                <Text style={styles.overlayScore}>{gameState.score}</Text>
              </View>
            </View>
            <View style={styles.overlayButtons}>
              <Pressable onPress={restart}>
                <LinearGradient colors={[palette.uiPrimary, palette.uiPrimaryDark]} style={styles.overlayButton}>
                  <Text style={styles.overlayButtonKicker}>RETURN TO THE TRAIL</Text>
                  <Text style={styles.overlayButtonText}>다시 도전</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={onExit}>
                <LinearGradient
                  colors={[palette.uiSecondary, palette.uiSecondaryDark]}
                  style={styles.overlayButton}
                >
                  <Text style={styles.overlayButtonKickerLight}>RETURN TO CAMP</Text>
                  <Text style={styles.overlayButtonTextLight}>원정 준비</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#101b1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameFrame: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: palette.skyBottom,
  },
  // The complete visual game frame. Hud and Controls remain siblings of the
  // stage so they overlay the scenery without stealing vertical world space.
  stageClip: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  // Laid out at its own small logical size (VIEWPORT_HEIGHT-tall) and then
  // scaled up into the 16:9 frame. Gameplay coordinates never see this scale.
  stage: {
    top: 0,
    left: 0,
    overflow: 'hidden',
    transformOrigin: 'top left',
  },
  world: {
    position: 'absolute',
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
