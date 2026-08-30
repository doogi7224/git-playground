import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View } from 'react-native';
import GameScreen from './src/screens/GameScreen';
import StartScreen from './src/screens/StartScreen';
import StageSelectScreen from './src/screens/StageSelectScreen';
import { nextStageId, StageId } from './src/stages';

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'stageSelect' | 'game'>('menu');
  const [stageId, setStageId] = useState<StageId>(1);

  const startStage = (stage: StageId) => {
    setStageId(stage);
    setScreen('game');
  };

  const advanceStage = () => {
    const next = nextStageId(stageId);
    if (next == null) setScreen('menu');
    else startStage(next);
  };

  return (
    <View style={{ flex: 1 }}>
      {screen === 'menu' && <StartScreen onStart={() => setScreen('stageSelect')} />}
      {screen === 'stageSelect' && <StageSelectScreen onSelect={startStage} onBack={() => setScreen('menu')} />}
      {screen === 'game' && <GameScreen key={`stage-${stageId}`} stageId={stageId} onNextStage={advanceStage} onExit={() => setScreen('menu')} />}
      <StatusBar hidden />
    </View>
  );
}
