import { useState, useCallback, useEffect } from 'react';
import {
  JudgeConfigState,
  DimensionType,
  DimensionScores,
} from '../types/judge';
import { useCharacter } from '../modules/character/context/CharacterContext';

const DEFAULT_DIMENSION_SCORES: DimensionScores = {
  logic: 35,
  humanness: 30,
  compliance: 35,
};

export const useJudgeConfig = () => {
  const { state: characterState } = useCharacter();
  const [config, setConfig] = useState<JudgeConfigState>({
    selectedJudgeId: '',
    scoringRule: '',
    dimensionScores: DEFAULT_DIMENSION_SCORES,
    customScoreRules: [],
  });

  const availableJudges = characterState.characters.map(character => ({
    id: character.id,
    name: character.name,
    description: character.description,
  }));

  const handleJudgeSelect = useCallback((judgeId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedJudgeId: judgeId,
    }));
  }, []);

  const handleScoringRuleChange = useCallback((rule: string) => {
    setConfig(prev => ({
      ...prev,
      scoringRule: rule,
    }));
  }, []);

  const handleDimensionChange = useCallback((dimension: DimensionType, value: number) => {
    setConfig(prev => ({
      ...prev,
      dimensionScores: {
        ...prev.dimensionScores,
        [dimension]: value,
      },
    }));
  }, []);

  const addCustomScoreRule = useCallback((name: string, score: number) => {
    setConfig(prev => ({
      ...prev,
      customScoreRules: [
        ...prev.customScoreRules,
        {
          id: Date.now().toString(),
          name,
          score,
        },
      ],
    }));
  }, []);

  const removeCustomScoreRule = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      customScoreRules: prev.customScoreRules.filter(rule => rule.id !== id),
    }));
  }, []);

  const getTotalScore = useCallback(() => {
    const dimensionTotal = Object.values(config.dimensionScores).reduce((sum, score) => sum + score, 0);
    const customTotal = config.customScoreRules.reduce((sum, rule) => sum + rule.score, 0);
    return dimensionTotal + customTotal;
  }, [config.dimensionScores, config.customScoreRules]);

  const resetConfig = useCallback(() => {
    setConfig({
      selectedJudgeId: '',
      scoringRule: '',
      dimensionScores: DEFAULT_DIMENSION_SCORES,
      customScoreRules: [],
    });
  }, []);

  return {
    config,
    handleJudgeSelect,
    handleScoringRuleChange,
    handleDimensionChange,
    addCustomScoreRule,
    removeCustomScoreRule,
    getTotalScore,
    resetConfig,
    availableJudges,
  };
}; 