import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  onLeftIn: () => void;
  onLeftOut: () => void;
  onRightIn: () => void;
  onRightOut: () => void;
  onJump: () => void;
}

export default function Controls({ onLeftIn, onLeftOut, onRightIn, onRightOut, onJump }: Props) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.dpad}>
        <Pressable
          onPressIn={onLeftIn}
          onPressOut={onLeftOut}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.label}>◀</Text>
        </Pressable>
        <Pressable
          onPressIn={onRightIn}
          onPressOut={onRightOut}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.label}>▶</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={onJump}
        style={({ pressed }) => [styles.button, styles.jumpButton, pressed && styles.pressed]}
      >
        <Text style={styles.label}>▲</Text>
      </Pressable>
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
  },
  dpad: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  jumpButton: {
    backgroundColor: 'rgba(255,213,74,0.55)',
  },
  pressed: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  label: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
});
