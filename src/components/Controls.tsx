import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef } from 'react';
import { Animated, GestureResponderEvent, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';

// On mobile web, a held touch on an element without these is liable to be
// interpreted by the browser as a text-selection long-press or a pinch/zoom
// candidate, which can steal the touch (with a haptic tick) mid-press.
// Native builds ignore these.
const noBrowserGestures: ViewStyle | undefined =
  Platform.OS === 'web'
    ? ({
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
      } as unknown as ViewStyle)
    : undefined;

interface Props {
  onLeftIn: () => void;
  onLeftOut: () => void;
  onRightIn: () => void;
  onRightOut: () => void;
  onJump: () => void;
  onDash: () => void;
  onGrappleIn: () => void;
  onGrappleOut: () => void;
  onAttack: () => void;
  hasBow: boolean;
  arrows: number;
}

interface Rect {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

function pointInRect(x: number, y: number, r: Rect | null): boolean {
  if (!r) return false;
  return x >= r.pageX && x <= r.pageX + r.width && y >= r.pageY && y <= r.pageY + r.height;
}

// Each button gets a role color so the pad reads as distinct instruments
// rather than five identical circles (CLAUDE.md 19 — 모바일 컨트롤). The
// press-glow ring is derived from the same `scale` Animated.Value the touch
// handler already drives (see handleTouches below) via interpolation, so
// there's no extra Animated.Value or React state added just for the glow.
type ButtonRole = 'move' | 'grapple' | 'dash' | 'jump' | 'attack';

const ROLE_COLORS: Record<ButtonRole, [string, string]> = {
  // Dark jewel-and-metal faces stay readable over bright scenery without
  // looking like flat toy controls.
  move: ['rgba(104, 180, 105, 0.58)', 'rgba(23, 91, 51, 0.48)'],
  grapple: ['#3f9b86', '#174b43'],
  dash: ['#b24f37', '#4b1d1b'],
  jump: ['#d5a947', '#624018'],
  attack: ['#398b88', '#153f43'],
};

function ButtonFace({ label, role, big, scale, disabled }: { label: string; role: ButtonRole; big?: boolean; scale: Animated.Value; disabled?: boolean }) {
  const glowOpacity = scale.interpolate({ inputRange: [0.88, 1], outputRange: [1, 0], extrapolate: 'clamp' });
  const [faceTop, faceBottom] = ROLE_COLORS[role];
  return (
    <Animated.View style={[styles.buttonShadow, role === 'move' && styles.moveButtonShadow, big && styles.bigButton, disabled && styles.disabledButton, { transform: [{ scale }] }]}>
      <LinearGradient colors={[faceTop, faceBottom]} style={[styles.buttonInner, role === 'move' && styles.moveButtonInner]}>
        {/* bolt rivets — the "작은 볼트" motif from the brass/steampunk frame spec */}
        <View style={[styles.rivet, styles.rivetN]} />
        <View style={[styles.rivet, styles.rivetE]} />
        <View style={[styles.rivet, styles.rivetS]} />
        <View style={[styles.rivet, styles.rivetW]} />
        <View style={styles.glassHighlight} />
        <Animated.View pointerEvents="none" style={[styles.pressGlow, { opacity: glowOpacity }]} />
        <Text style={[styles.label, role === 'move' && styles.moveLabel, big && styles.bigLabel]}>{label}</Text>
        {role !== 'move' && <Text style={[styles.roleLabel, big && styles.bigRoleLabel]}>
          {role === 'grapple' ? 'HOOK' : role === 'dash' ? 'DASH' : role === 'attack' ? 'ARROW' : 'JUMP'}
        </Text>}
      </LinearGradient>
    </Animated.View>
  );
}

// React Native's built-in gesture responder system only ever has one active
// "responder" for the whole app: pressing a second Pressable while a first
// one is held sends the first RESPONDER_TERMINATED and cancels its press.
// That's exactly what broke "hold move + tap jump" — it isn't a web-only
// glitch, it's how Pressable's responder negotiation works everywhere.
// The fix is to never let the buttons claim the responder individually: one
// top-level view claims it for the whole control pad, and on every touch
// event we recompute which buttons are under an active touch from
// `nativeEvent.touches` (the full, current list of fingers down), which is
// naturally multi-touch since it's just coordinates, not a single gesture.
export default function Controls({
  onLeftIn,
  onLeftOut,
  onRightIn,
  onRightOut,
  onJump,
  onDash,
  onGrappleIn,
  onGrappleOut,
  onAttack,
  hasBow,
  arrows,
}: Props) {
  const leftRef = useRef<View>(null);
  const rightRef = useRef<View>(null);
  const jumpRef = useRef<View>(null);
  const dashRef = useRef<View>(null);
  const grappleRef = useRef<View>(null);
  const attackRef = useRef<View>(null);

  const rects = useRef<{ left: Rect | null; right: Rect | null; jump: Rect | null; dash: Rect | null; grapple: Rect | null; attack: Rect | null }>({
    left: null,
    right: null,
    jump: null,
    dash: null,
    grapple: null,
    attack: null,
  });
  const held = useRef({ left: false, right: false, jump: false, dash: false, grapple: false, attack: false });

  const leftScale = useRef(new Animated.Value(1)).current;
  const rightScale = useRef(new Animated.Value(1)).current;
  const jumpScale = useRef(new Animated.Value(1)).current;
  const dashScale = useRef(new Animated.Value(1)).current;
  const grappleScale = useRef(new Animated.Value(1)).current;
  const attackScale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: Animated.Value, toValue: number) => {
    Animated.spring(value, { toValue, useNativeDriver: true, speed: toValue < 1 ? 30 : 20 }).start();
  };

  const measure = useCallback((ref: React.RefObject<View | null>, key: 'left' | 'right' | 'jump' | 'dash' | 'grapple' | 'attack') => {
    ref.current?.measure((_x, _y, width, height, pageX, pageY) => {
      rects.current[key] = { pageX, pageY, width, height };
    });
  }, []);

  const handleTouches = useCallback(
    (evt: GestureResponderEvent) => {
      // `touches` is the authoritative list of what's currently down — on a
      // release/terminate it is correctly empty, which must mean "nothing is
      // held" rather than falling back to the event's own last-known point
      // (that point is the finger that just lifted, so treating it as still
      // touching is exactly what kept movement running after release).
      const touches = evt.nativeEvent.touches;
      const hitLeft = touches.some((t) => pointInRect(t.pageX, t.pageY, rects.current.left));
      const hitRight = touches.some((t) => pointInRect(t.pageX, t.pageY, rects.current.right));
      const hitJump = touches.some((t) => pointInRect(t.pageX, t.pageY, rects.current.jump));
      const hitDash = touches.some((t) => pointInRect(t.pageX, t.pageY, rects.current.dash));
      const hitGrapple = touches.some((t) => pointInRect(t.pageX, t.pageY, rects.current.grapple));
      const hitAttack = touches.some((t) => pointInRect(t.pageX, t.pageY, rects.current.attack));

      if (hitLeft !== held.current.left) {
        held.current.left = hitLeft;
        animateTo(leftScale, hitLeft ? 0.88 : 1);
        if (hitLeft) onLeftIn();
        else onLeftOut();
      }
      if (hitRight !== held.current.right) {
        held.current.right = hitRight;
        animateTo(rightScale, hitRight ? 0.88 : 1);
        if (hitRight) onRightIn();
        else onRightOut();
      }
      if (hitJump !== held.current.jump) {
        animateTo(jumpScale, hitJump ? 0.88 : 1);
        if (hitJump) onJump();
        held.current.jump = hitJump;
      }
      if (hitDash !== held.current.dash) {
        animateTo(dashScale, hitDash ? 0.88 : 1);
        if (hitDash) onDash();
        held.current.dash = hitDash;
      }
      if (hitGrapple !== held.current.grapple) {
        held.current.grapple = hitGrapple;
        animateTo(grappleScale, hitGrapple ? 0.88 : 1);
        if (hitGrapple) onGrappleIn();
        else onGrappleOut();
      }
      if (hitAttack !== held.current.attack) {
        animateTo(attackScale, hitAttack ? 0.88 : 1);
        if (hitAttack && hasBow) onAttack();
        held.current.attack = hitAttack;
      }
    },
    [
      onLeftIn,
      onLeftOut,
      onRightIn,
      onRightOut,
      onJump,
      onDash,
      onGrappleIn,
      onGrappleOut,
      leftScale,
      rightScale,
      jumpScale,
      dashScale,
      grappleScale,
      attackScale,
      hasBow,
      onAttack,
    ]
  );

  return (
    <View
      style={[styles.container, noBrowserGestures]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouches}
      // onResponderGrant only fires for the *first* touch that establishes
      // the responder; every touchstart after that (a second finger landing
      // while the first is still down) is delivered as onResponderStart
      // instead — without it, a finger added after another was already held
      // is silently ignored. Likewise a partial release (one of several
      // fingers lifting while others remain down) fires onResponderEnd, not
      // onResponderRelease (that's reserved for the *last* finger lifting).
      onResponderStart={handleTouches}
      onResponderMove={handleTouches}
      onResponderEnd={handleTouches}
      onResponderRelease={handleTouches}
      onResponderTerminate={handleTouches}
    >
      <View style={styles.dpadModule}>
        <View style={styles.dpad}>
        <View ref={leftRef} onLayout={() => measure(leftRef, 'left')}>
          <ButtonFace label="←" role="move" scale={leftScale} />
        </View>
        <View ref={rightRef} onLayout={() => measure(rightRef, 'right')}>
          <ButtonFace label="→" role="move" scale={rightScale} />
        </View>
        </View>
      </View>
      <View style={styles.actionPad}>
        <View ref={jumpRef} onLayout={() => measure(jumpRef, 'jump')}>
          <ButtonFace label="▲" role="jump" big scale={jumpScale} />
        </View>
        <View ref={grappleRef} onLayout={() => measure(grappleRef, 'grapple')}>
          <ButtonFace label="⚓" role="grapple" scale={grappleScale} />
        </View>
        <View ref={dashRef} onLayout={() => measure(dashRef, 'dash')}>
          <ButtonFace label="»" role="dash" scale={dashScale} />
        </View>
        <View ref={attackRef} onLayout={() => measure(attackRef, 'attack')}>
          <ButtonFace label="➜" role="attack" scale={attackScale} disabled={!hasBow || arrows <= 0} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    alignItems: 'flex-end',
  },
  dpad: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  dpadModule: {
    padding: 0,
  },
  actionPad: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
  },
  buttonShadow: {
    width: 76,
    height: 76,
    borderRadius: 38,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  moveButtonShadow: {
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bigButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  buttonInner: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(230, 186, 92, 0.9)',
    borderTopColor: 'rgba(255, 239, 187, 0.95)',
    overflow: 'hidden',
  },
  moveButtonInner: {
    borderWidth: 2,
    borderColor: 'rgba(214, 238, 167, 0.72)',
    backgroundColor: 'rgba(57, 132, 79, 0.48)',
    overflow: 'hidden',
  },
  label: {
    marginTop: 5,
    fontSize: 30,
    fontWeight: '800',
    color: '#f6edd7',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  bigLabel: {
    marginTop: 4,
    fontSize: 38,
    color: '#fff3cb',
  },
  moveLabel: {
    marginTop: 0,
    fontSize: 48,
    lineHeight: 54,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(9, 49, 22, 0.58)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  disabledButton: { opacity: 0.38 },
  roleLabel: {
    marginTop: -2,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
    color: 'rgba(255,246,214,0.72)',
  },
  bigRoleLabel: {
    marginTop: -1,
    fontSize: 9,
    color: 'rgba(255,247,213,0.86)',
  },
  // Small bolt/rivet dots at the compass points of the ring — the "작은 볼트"
  // detail called for in CLAUDE.md 19 so buttons read as machined parts
  // rather than flat circles.
  rivet: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  rivetN: { top: 6 },
  rivetS: { bottom: 6 },
  rivetE: { right: 6 },
  rivetW: { left: 6 },
  // A soft upper highlight to sell a lacquered/glass button face.
  glassHighlight: {
    position: 'absolute',
    top: 3,
    left: '18%',
    right: '18%',
    height: '38%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  // Fades in as the button is pressed (driven by the same scale Animated.Value).
  pressGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});
