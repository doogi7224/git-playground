import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View } from 'react-native';
import GameScreen from './src/screens/GameScreen';
import StartScreen from './src/screens/StartScreen';

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      {started ? <GameScreen onExit={() => setStarted(false)} /> : <StartScreen onStart={() => setStarted(true)} />}
      <StatusBar hidden />
    </View>
  );
}
