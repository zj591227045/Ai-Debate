import { useState, useEffect } from 'react';
import type { Judge } from '../types/judge';
import { StateManager } from '../store/unified/StateManager';

export function useJudgeConfig() {
  const stateManager = StateManager.getInstance();
  const [characters, setCharacters] = useState(() => {
    const state = stateManager.getState();
    return Object.values(state.characters.byId);
  });
  const [config, setConfig] = useState({
    selectedJudge: null as Judge | null,
    scoringRule: '',
    dimensions: [] as Array<{
      name: string;
      weight: number;
      description: string;
    }>,
    customScores: [] as Array<{
      name: string;
      score: number;
    }>,
  });

  useEffect(() => {
    const unsubscribe = stateManager.subscribe((newState) => {
      setCharacters(Object.values(newState.characters.byId));
    });
    return () => unsubscribe();
  }, []);

  const handleJudgeSelect = (judge: Judge) => {
    setConfig(prev => ({
      ...prev,
      selectedJudge: judge,
    }));
  };

  const handleScoringRuleChange = (rule: string) => {
    setConfig(prev => ({
      ...prev,
      scoringRule: rule,
    }));
  };

  const handleDimensionChange = (dimension: { name: string; weight: number; description: string }, value: number) => {
    setConfig(prev => ({
      ...prev,
      dimensions: prev.dimensions.map(d =>
        d.name === dimension.name ? { ...d, weight: value } : d
      ),
    }));
  };

  const addCustomScoreRule = (name: string, score: number) => {
    setConfig(prev => ({
      ...prev,
      customScores: [
        ...prev.customScores,
        {
          name,
          score,
        },
      ],
    }));
  };

  const removeCustomScoreRule = (name: string) => {
    setConfig(prev => ({
      ...prev,
      customScores: prev.customScores.filter(s => s.name !== name),
    }));
  };

  const getTotalScore = () => {
    const dimensionTotal = config.dimensions.reduce((sum, d) => sum + d.weight, 0);
    const customTotal = config.customScores.reduce((sum, s) => sum + s.score, 0);
    return dimensionTotal + customTotal;
  };

  const resetConfig = () => {
    setConfig({
      selectedJudge: null,
      scoringRule: '',
      dimensions: [],
      customScores: [],
    });
  };

  return {
    config,
    handleJudgeSelect,
    handleScoringRuleChange,
    handleDimensionChange,
    addCustomScoreRule,
    removeCustomScoreRule,
    getTotalScore,
    resetConfig,
    availableJudges: characters,
  };
} 