import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Arrow } from '../game/types';

export default function ArrowView({ arrow }: { arrow: Arrow }) {
  const visualWidth = arrow.width * 2.6;
  const visualHeight = arrow.height * 3.3;
  return <Image source={require('../../assets/sprites/leaf_arrow_v1/leaf_arrow.png')} resizeMode="contain" style={[styles.sprite, { left: arrow.x + arrow.width / 2 - visualWidth / 2, top: arrow.y + arrow.height / 2 - visualHeight / 2, width: visualWidth, height: visualHeight, transform: [{ scaleX: arrow.vx >= 0 ? 1 : -1 }] }]} />;
}

const styles = StyleSheet.create({ sprite: { position: 'absolute' } });
