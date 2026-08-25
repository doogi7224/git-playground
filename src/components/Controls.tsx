import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

interface Props {
  onLeftIn: () => void;
  onLeftOut: () => void;
  onRightIn: () => void;
  onRightOut: () => void;
  onJump: () => void;
}

function GameButton({
  label,
  big,
  onPressIn,
  onPressOut,
}: {
  label: string;
  big?: boolean;
  onPressIn: () => void;
  onPressOut?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 30 }).start();
    onPressIn();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    onPressOut?.();
  };

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[styles.buttonShadow, big && styles.bigButton, { transform: [{ scale }] }]}>
        <LinearGradient
          colors={big ? [palette.uiPrimary, palette.uiPrimaryDark] : ['#ffffff', '#d7e6f0']}
          style={styles.buttonInner}
        >
          <Text style={[styles.label, big && styles.bigLabel]}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export default function Controls({ onLeftIn, onLeftOut, onRightIn, onRightOut, onJump }: Props) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.dpad}>
        <GameButton label="◀" onPressIn={onLeftIn} onPressOut={onLeftOut} />
        <GameButton label="▶" onPressIn={onRightIn} onPressOut={onRightOut} />
      </View>
      <GameButton label="▲" big onPressIn={onJump} />
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
