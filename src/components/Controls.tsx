import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef } from 'react';
import { Animated, GestureResponderEvent, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette } from '../theme';

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

function ButtonFace({ label, big, scale }: { label: string; big?: boolean; scale: Animated.Value }) {
  return (
    <Animated.View style={[styles.buttonShadow, big && styles.bigButton, { transform: [{ scale }] }]}>
      <LinearGradient
        colors={big ? [palette.uiPrimary, palette.uiPrimaryDark] : ['#ffffff', '#d7e6f0']}
        style={styles.buttonInner}
      >
        <Text style={[styles.label, big && styles.bigLabel]}>{label}</Text>
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
}: Props) {
  const leftRef = useRef<View>(null);
  const rightRef = useRef<View>(null);
  const jumpRef = useRef<View>(null);
  const dashRef = useRef<View>(null);
  const grappleRef = useRef<View>(null);

  const rects = useRef<{ left: Rect | null; right: Rect | null; jump: Rect | null; dash: Rect | null; grapple: Rect | null }>({
    left: null,
    right: null,
    jump: null,
    dash: null,
    grapple: null,
  });
  const held = useRef({ left: false, right: false, jump: false, dash: false, grapple: false });

  const leftScale = useRef(new Animated.Value(1)).current;
  const rightScale = useRef(new Animated.Value(1)).current;
  const jumpScale = useRef(new Animated.Value(1)).current;
  const dashScale = useRef(new Animated.Value(1)).current;
  const grappleScale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: Animated.Value, toValue: number) => {
    Animated.spring(value, { toValue, useNativeDriver: true, speed: toValue < 1 ? 30 : 20 }).start();
  };

  const measure = useCallback((ref: React.RefObject<View | null>, key: 'left' | 'right' | 'jump' | 'dash' | 'grapple') => {
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
      <View style={styles.dpad}>
        <View ref={leftRef} onLayout={() => measure(leftRef, 'left')}>
          <ButtonFace label="◀" scale={leftScale} />
        </View>
        <View ref={rightRef} onLayout={() => measure(rightRef, 'right')}>
          <ButtonFace label="▶" scale={rightScale} />
        </View>
      </View>
      <View style={styles.actionPad}>
        <View ref={grappleRef} onLayout={() => measure(grappleRef, 'grapple')}>
          <ButtonFace label="◎" scale={grappleScale} />
        </View>
        <View ref={dashRef} onLayout={() => measure(dashRef, 'dash')}>
          <ButtonFace label="»" scale={dashScale} />
        </View>
        <View ref={jumpRef} onLayout={() => measure(jumpRef, 'jump')}>
          <ButtonFace label="▲" big scale={jumpScale} />
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
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  dpad: {
    flexDirection: 'row',
    gap: 14,
  },
  actionPad: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
  },
  buttonShadow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  bigButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  buttonInner: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  label: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.uiSecondaryDark,
  },
  bigLabel: {
    fontSize: 30,
    color: '#5a3d00',
  },
});
