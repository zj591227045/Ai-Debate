import React, { useState, useCallback, useEffect } from 'react';
import { LLMService } from '../modules/debate-flow/services/LLMService';
import { ProcessedSpeech, JudgeConfig, ScoringContext, Score, ScoringRules } from '../modules/debate-flow/types/interfaces';
import { ModelConfig } from '../modules/model/types/config';
import { UnifiedLLMService } from '../modules/llm/services/UnifiedLLMService';
import { ModelService } from '../modules/model/services/ModelService';
import { CharacterConfigService } from '../modules/debate-flow/services/CharacterConfigService';
import type { CharacterConfig } from '../modules/debate-flow/types/character';
import './ScoringTest.css';

const defaultJudgeConfig: JudgeConfig = {
  id: 'test_judge',
  name: '测试评委'
};

export const ScoringTest: React.FC = () => {
  const [judgeConfig, setJudgeConfig] = useState<JudgeConfig>(defaultJudgeConfig);
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [characters, setCharacters] = useState<CharacterConfig[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterConfig | null>(null);
  const [speechContent, setSpeechContent] = useState('');
  const [scoringResult, setScoringResult] = useState('');
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载AI角色列表
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const characterService = new CharacterConfigService();
        const allCharacters = await characterService.getActiveCharacters();
        // 只获取评委角色
        const judges = allCharacters.filter(char => char.role === 'judge');
        setCharacters(judges);
      } catch (err) {
        setError('加载评委角色失败: ' + (err instanceof Error ? err.message : String(err)));
      }
    };

    loadCharacters();
  }, []);

  // 处理角色选择
  const handleCharacterSelect = async (characterId: string) => {
    try {
      const character = characters.find(c => c.id === characterId);
      if (!character) {
        throw new Error('未找到选中的角色');
      }

      setSelectedCharacter(character);
      
      // 更新评委配置
      setJudgeConfig({
        id: character.id,
        name: character.name,
        characterConfig: character
      });

      // 获取角色对应的模型配置
      if (character.callConfig?.direct?.modelId) {
        const modelService = new ModelService();
        const config = await modelService.getModelById(character.callConfig.direct.modelId);
        if (config) {
          setModelConfig(config);
          setError(null);
        }
      }
    } catch (err) {
      setError('选择角色失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // 开始评分
  const handleStartScoring = useCallback(async () => {
    if (!speechContent.trim() || !selectedCharacter) {
      setError('请输入发言内容并选择评委角色');
      return;
    }

    setIsScoring(true);
    setError(null);
    setScoringResult('');

    const speech: ProcessedSpeech = {
      id: 'test_speech_' + Date.now(),
      content: speechContent,
      timestamp: Date.now(),
      round: 1,
      type: 'speech',
      playerId: 'test_player',
      role: 'user',
      metadata: {
        wordCount: speechContent.length
      }
    };

    const context: ScoringContext = {
      judge: judgeConfig,
      rules: {
        dimensions: [
          { 
            name: 'logic', 
            weight: 0.3, 
            description: '论证的完整性、连贯性和说服力',
            criteria: [
              '论点表述清晰完整',
              '论证过程连贯合理',
              '结论具有说服力'
            ]
          },
          { 
            name: 'evidence', 
            weight: 0.3, 
            description: '论据的相关性、可靠性和充分性',
            criteria: [
              '论据与论点高度相关',
              '论据来源可靠',
              '论据数量充分'
            ]
          },
          { 
            name: 'delivery', 
            weight: 0.2, 
            description: '语言的清晰度、流畅度和感染力',
            criteria: [
              '语言表达清晰准确',
              '语言组织流畅自然',
              '表达具有感染力'
            ]
          },
          { 
            name: 'rebuttal', 
            weight: 0.2, 
            description: '对对方论点的理解和有效反驳',
            criteria: [
              '准确理解对方论点',
              '反驳针对性强',
              '反驳论证有力'
            ]
          }
        ]
      },
      previousScores: [{
        id: 'test-score-1',
        speechId: 'test-speech-1',
        judgeId: 'test-judge-1',
        playerId: 'test-player-1',
        round: 1,
        timestamp: Date.now(),
        dimensions: {
          logic: 8.5,
          evidence: 8.0,
          delivery: 8.0,
          rebuttal: 7.5
        },
        totalScore: 8.0,
        comment: '整体表现良好，论证逻辑清晰，论据充分可靠。',
        feedback: {
          strengths: ['论证逻辑清晰', '论据充分可靠'],
          weaknesses: ['反驳力度可以加强'],
          suggestions: ['建议进一步加强反驳的针对性']
        }
      }]
    };

    try {
      const llmService = new LLMService();
      let result = '';
      
      for await (const chunk of llmService.generateScore(speech, context)) {
        result += chunk;
        setScoringResult(prev => prev + chunk);
      }

      // 验证结果是否为有效的JSON
      try {
        const scoreData = JSON.parse(result);
        console.log('评分结果解析成功:', scoreData);
      } catch (parseError) {
        setError('评分结果格式无效: ' + (parseError instanceof Error ? parseError.message : String(parseError)));
      }
    } catch (err) {
      setError('评分失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsScoring(false);
    }
  }, [speechContent, selectedCharacter, judgeConfig]);

  return (
    <div className="scoring-test">
      <h1>评分测试</h1>

      {/* 角色选择 */}
      <section className="character-section">
        <h2>选择评委角色</h2>
        <select 
          onChange={(e) => handleCharacterSelect(e.target.value)}
          disabled={isScoring}
          value={selectedCharacter?.id || ''}
        >
          <option value="">请选择评委角色</option>
          {characters.map(char => (
            <option key={char.id} value={char.id}>
              {char.name}
            </option>
          ))}
        </select>
        {selectedCharacter && modelConfig && (
          <div className="character-info">
            <div className="info-row">
              <label>角色名称:</label>
              <span>{selectedCharacter.name}</span>
            </div>
            <div className="info-row">
              <label>使用模型:</label>
              <span>{modelConfig.name}</span>
            </div>
            <div className="info-row">
              <label>模型提供商:</label>
              <span>{modelConfig.provider}</span>
            </div>
            <div className="info-row">
              <label>角色描述:</label>
              <p>{selectedCharacter.description || '无'}</p>
            </div>
          </div>
        )}
      </section>

      {/* 评委配置 */}
      <section>
        <h2>评委配置</h2>
        <div className="form-group">
          <label>评委名称</label>
          <input
            type="text"
            value={judgeConfig.name}
            onChange={(e) => setJudgeConfig(prev => ({
              ...prev,
              name: e.target.value
            }))}
            disabled={isScoring}
          />
        </div>
      </section>

      {/* 发言内容 */}
      <section>
        <h2>发言内容</h2>
        <div className="form-group">
          <textarea
            value={speechContent}
            onChange={(e) => setSpeechContent(e.target.value)}
            rows={6}
            disabled={isScoring}
          />
        </div>
      </section>

      {/* 操作按钮 */}
      <section>
        <button
          onClick={handleStartScoring}
          disabled={isScoring || !speechContent.trim() || !selectedCharacter}
        >
          {isScoring ? '评分中...' : '开始评分'}
        </button>
      </section>

      {/* 错误信息 */}
      {error && (
        <section className="error-section">
          <div className="error-message">{error}</div>
        </section>
      )}

      {/* 评分结果 */}
      {scoringResult && (
        <section>
          <h2>评分结果</h2>
          <pre className="scoring-result">{scoringResult}</pre>
        </section>
      )}
    </div>
  );
};

export default ScoringTest; 