import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { MOVE_SPEED } from '../game/constants';
import { Player } from '../game/types';

// Sprout is drawn larger than its collision box (a full-body AI-generated
// running-pose sprite with limbs splayed wide, so a good portion of the
// square is empty space) and anchored so its feet sit on the hitbox's
// bottom edge, centered on the hitbox's horizontal center.
const VISUAL_SIZE = 58;
const LANDING_IMPACT_VY = 400; // px/s: falling faster than this on landing triggers a squash pulse
const DASH_TRAIL_LENGTH = 3; // afterimage copies kept while dashing

interface TrailPoint {
  left: number;
  top: number;
  facing: 1 | -1;
}

export default function PlayerView({ player }: { player: Player }) {
  const blinking = player.invulnerableFor > 0 && Math.floor(player.invulnerableFor * 10) % 2 === 0;

  const prevVy = useRef(player.vy);
  const prevOnGround = useRef(player.onGround);
  const impact = useRef(new Animated.Value(0)).current;

  const prevTouchingWall = useRef(player.touchingWall);
  const wallPuff = useRef(new Animated.Value(0)).current;
  const wallPuffSide = useRef<1 | -1>(1);

  useEffect(() => {
    const justLanded = player.onGround && !prevOnGround.current;
    if (justLanded && prevVy.current > LANDING_IMPACT_VY) {
      impact.setValue(1);
      Animated.spring(impact, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 18 }).start();
    }

    // Wall-jump: the frame we leave a wall while still moving upward is a
    // push-off, not a fall-off — a small dust/leaf puff on that side sells
    // the kick (CLAUDE.md 19 — 벽점프 파편 효과).
    const justPushedOffWall = prevTouchingWall.current !== 0 && player.touchingWall === 0 && player.vy < 0;
    if (justPushedOffWall) {
      wallPuffSide.current = prevTouchingWall.current > 0 ? -1 : 1;
      wallPuff.setValue(1);
      Animated.timing(wallPuff, { toValue: 0, duration: 320, useNativeDriver: true }).start();
    }

    prevVy.current = player.vy;
    prevOnGround.current = player.onGround;
    prevTouchingWall.current = player.touchingWall;
  }, [player.vy, player.onGround, player.touchingWall, impact, wallPuff]);

  // Dash afterimage trail: while dashing, remember the last few rendered
  // positions so we can draw faded copies behind the sprite. Mutated directly
  // during render (not in an effect) because PlayerView already re-renders on
  // every physics tick driven by the parent's game loop, matching the
  // existing per-frame style used for `bobY` below — no extra state/renders.
  const trailRef = useRef<TrailPoint[]>([]);
  const isDashing = player.dashTimer > 0;

  // Airborne squash/stretch from vertical speed (jumping up / falling).
  const airStretch = Math.max(-1, Math.min(1, player.vy / 500));
  const airScaleY = 1 + airStretch * 0.12;
  const airScaleX = 1 - airStretch * 0.08;

  // A brief extra squash on hard landings, decaying via the `impact` spring.
  const landScaleY = impact.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] });
  const landScaleX = impact.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });

  // Idle breathing when still; a footstep-like bob tied to distance
  // traveled (not wall-clock time) while actually running on the ground.
  const isRunning = player.onGround && Math.abs(player.vx) > 10;
  const bobY = isRunning ? Math.sin(player.x * 0.28) * 2.4 : Math.sin(Date.now() / 480) * 1.1;

  // Lean into the run direction; magnitude scales with speed, sign comes
  // from `facing` so it reads correctly after the horizontal flip below.
  const leanDeg = isRunning ? Math.min(1, Math.abs(player.vx) / MOVE_SPEED) * 7 : 0;

  const left = player.x + player.width / 2 - VISUAL_SIZE / 2;
  const top = player.y + player.height - VISUAL_SIZE + bobY;

  if (isDashing) {
    trailRef.current = [{ left, top, facing: player.facing }, ...trailRef.current].slice(0, DASH_TRAIL_LENGTH);
  } else if (trailRef.current.length > 0) {
    trailRef.current = [];
  }

  const wallPuffOpacity = wallPuff.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const wallPuffSpread = wallPuff.interpolate({ inputRange: [0, 1], outputRange: [0, 16] });

  return (
    <>
      {/* Dash afterimages + speed lines — CLAUDE.md 19: "대시: 잔상 + 속도선 + 짧은 파티클". */}
      {isDashing &&
        trailRef.current.map((point, i) => (
          <Image
            key={i}
            source={require('../../assets/sprites/sprout.png')}
            resizeMode="contain"
            style={[
              styles.sprite,
              styles.trailGhost,
              {
                left: point.left,
                top: point.top,
                opacity: 0.28 - i * 0.08,
                transform: [{ scaleX: point.facing }],
              },
            ]}
          />
        ))}
      {isDashing && (
        <View style={[styles.speedLineWrap, { left, top: top + VISUAL_SIZE * 0.3 }]}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.speedLine,
                {
                  top: i * 7,
                  right: player.facing > 0 ? undefined : VISUAL_SIZE - 2,
                  left: player.facing > 0 ? VISUAL_SIZE - 2 : undefined,
                  width: 10 + i * 4,
                  transform: [{ scaleX: -player.facing }],
                },
              ]}
            />
          ))}
        </View>
      )}

      <Animated.Image
        source={require('../../assets/sprites/sprout.png')}
        resizeMode="contain"
        style={[
          styles.sprite,
          {
            left,
            top,
            opacity: blinking ? 0.35 : 1,
            transform: [
              { scaleX: player.facing * airScaleX },
              { scaleY: airScaleY },
              { scaleX: landScaleX },
              { scaleY: landScaleY },
              { rotate: `${leanDeg}deg` },
            ],
          },
        ]}
      />

      {/* Wall-jump puff: a few dust/leaf flecks kicking off the wall side. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.wallPuffWrap,
          {
            left: left + VISUAL_SIZE / 2 + wallPuffSide.current * (VISUAL_SIZE / 2),
            top: top + VISUAL_SIZE * 0.55,
            opacity: wallPuffOpacity,
          },
        ]}
      >
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.wallPuffFleck,
              {
                transform: [
                  { translateX: Animated.multiply(wallPuffSpread, wallPuffSide.current * (0.4 + i * 0.3)) },
                  { translateY: -i * 3 },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  trailGhost: {
    tintColor: '#bfe3d6',
  },
  speedLineWrap: {
    position: 'absolute',
    width: VISUAL_SIZE,
    height: VISUAL_SIZE * 0.4,
  },
  speedLine: {
    position: 'absolute',
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  wallPuffWrap: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  wallPuffFleck: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(60, 122, 86, 0.8)',
  },
  sprite: {
    position: 'absolute',
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
  },
});
