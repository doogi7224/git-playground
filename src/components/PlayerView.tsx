import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { MOVE_SPEED } from '../game/constants';
import { Player } from '../game/types';

// Sprout is drawn larger than its collision box (a full-body AI-generated
// sprite with some padding) and anchored so its feet sit on the hitbox's
// bottom edge, centered on the hitbox's horizontal center.
const VISUAL_SIZE = 52;
const LANDING_IMPACT_VY = 400; // px/s: falling faster than this on landing triggers a squash pulse

export default function PlayerView({ player }: { player: Player }) {
  const blinking = player.invulnerableFor > 0 && Math.floor(player.invulnerableFor * 10) % 2 === 0;

  const prevVy = useRef(player.vy);
  const prevOnGround = useRef(player.onGround);
  const impact = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const justLanded = player.onGround && !prevOnGround.current;
    if (justLanded && prevVy.current > LANDING_IMPACT_VY) {
      impact.setValue(1);
      Animated.spring(impact, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 18 }).start();
    }
    prevVy.current = player.vy;
    prevOnGround.current = player.onGround;
  }, [player.vy, player.onGround, impact]);

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

  return (
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
  );
}

const styles = StyleSheet.create({
  sprite: {
    position: 'absolute',
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
  },
});
