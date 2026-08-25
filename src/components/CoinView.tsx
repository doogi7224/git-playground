import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Coin } from '../game/types';

export default function CoinView({ coin }: { coin: Coin }) {
  if (coin.collected) return null;
  return <View style={[styles.coin, { left: coin.x, top: coin.y, width: coin.width, height: coin.height }]} />;
}

const styles = StyleSheet.create({
  coin: {
    position: 'absolute',
    backgroundColor: '#ffd54a',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#c99a1f',
  },
});
