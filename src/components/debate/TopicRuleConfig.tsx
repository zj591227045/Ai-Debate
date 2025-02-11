import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Input, Radio, Checkbox, Button, InputNumber, Select, Space } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { useJudgeConfig } from '../../hooks/useJudgeConfig';
import { Judge } from '../../types/judge';
import type { RuleConfig } from '../../types/rules';
import { useDispatch } from 'react-redux';
import { updateRuleConfig, updateDebateConfig } from '../../store/slices/gameConfigSlice';
import type { DebateConfig } from '../../types/debate';
import { useCharacter } from '../../modules/character/context/CharacterContext';
import type { CharacterConfig } from '../../modules/character/types';

const { TextArea } = Input;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
`;

const ConfigSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
`;

const Card = styled.div`
  flex: 1;
  min-width: 300px;
  max-width: 100%;
  background: #fff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 24px;
  margin-bottom: 20px;

  @media (min-width: 768px) {
    max-width: calc(50% - 10px);
  }

  @media (min-width: 1200px) {
    max-width: calc(33.333% - 14px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const CardTitle = styled.div`
  font-size: 16px;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledButton = styled(Button)`
  height: 32px;
  &.ant-btn-primary {
    background-color: #4157ff;
  }
`;

const FormItem = styled.div`
  margin-bottom: 16px;

  .label {
    margin-bottom: 8px;
  }

  .ant-input,
  .ant-input-textarea {
    width: 100%;
  }
`;

const DimensionItem = styled.div`
  margin-bottom: 16px;
  background: white;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const DimensionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  .dimension-name {
    flex: 1;
  }

  .dimension-weight {
    width: 120px;
    display: flex;
    align-items: center;
    gap: 8px;

    .weight-label {
      color: rgba(0, 0, 0, 0.45);
      font-size: 14px;
      white-space: nowrap;
    }
  }
`;

const DimensionDescription = styled.div`
  width: 100%;
`;

const BonusItem = styled.div`
  margin-bottom: 8px;
`;

const AdvancedSection = styled.div<{ visible: boolean }>`
  display: ${props => props.visible ? 'block' : 'none'};
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
`;

const TotalScore = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 20px;
  font-size: 16px;
  color: #1890ff;
  font-weight: 500;
`;

const DimensionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
`;

const CustomScoreSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
`;

const CustomScoreItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const ScoreHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
  border: 1px solid #f0f0f0;
  padding: 12px 16px;
  border-radius: 4px;
  background: #fff;
  min-height: 48px;
`;

const ExpandButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  padding: 0;
  height: auto;
  
  &:hover {
    color: #4157ff;
  }

  .anticon {
    font-size: 12px;
  }
`;

const ScoreText = styled.div`
  font-size: 14px;
  color: #1890ff;
  font-weight: 500;
  white-space: nowrap;
  margin-left: 16px;
`;

const DimensionSection = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'block' : 'none'};
  margin-top: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
`;

const ScoreConfigContent = styled.div`
  margin-top: 16px;
`;

const ScoreDimensions = styled.div`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const JudgeOption = styled.div`
  padding: 8px 0;

  .judge-name {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .judge-description {
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
    line-height: 1.5;
  }
`;

interface TopicRuleConfigProps {
  ruleConfig: RuleConfig;
  onRuleConfigChange: (config: RuleConfig) => void;
  debateConfig: DebateConfig;
  onDebateConfigChange: (config: Partial<DebateConfig>) => void;
}

export const TopicRuleConfig: React.FC<TopicRuleConfigProps> = ({
  ruleConfig,
  onRuleConfigChange,
  debateConfig,
  onDebateConfigChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  
  const {
    config: judgeConfig,
    handleJudgeSelect,
    handleScoringRuleChange,
    handleDimensionChange,
    addCustomScoreRule,
    removeCustomScoreRule,
    getTotalScore,
    availableJudges,
  } = useJudgeConfig();

  const dispatch = useDispatch();
  const { state: characterState } = useCharacter();

  const handleRuleChange = (newConfig: Partial<RuleConfig>) => {
    const updatedConfig = {
      ...ruleConfig,
      ...newConfig
    };
    console.log('TopicRuleConfig - Updating rule config:', updatedConfig);
    onRuleConfigChange(updatedConfig);
    dispatch(updateRuleConfig(updatedConfig));
  };

  const handleJudgeConfigChange = (judging: Partial<DebateConfig['judging']>) => {
    console.group('=== 裁判配置更新 ===');
    console.log('当前配置:', debateConfig.judging);
    console.log('更新内容:', judging);
    
    // 保持现有维度的权重和描述
    const updatedDimensions = judging.dimensions || debateConfig.judging.dimensions.map(dim => ({
      ...dim,
      weight: Number(dim.weight) || 0,  // 确保权重是数字
      description: dim.description || ''
    }));

    const updatedJudging = {
      description: judging.description || debateConfig.judging.description,
      dimensions: updatedDimensions,
      totalScore: judging.totalScore || debateConfig.judging.totalScore,
      selectedJudge: judging.selectedJudge || debateConfig.judging.selectedJudge
    };
    
    console.log('更新后的配置:', updatedJudging);
    console.groupEnd();
    
    // 更新本地状态
    onDebateConfigChange({
      judging: updatedJudging
    });

    // 同时更新 Redux store
    dispatch(updateDebateConfig({
      ...debateConfig,
      judging: updatedJudging
    }));
  };

  // 计算总分
  const calculateTotalScore = (dimensions: DebateConfig['judging']['dimensions']) => {
    return dimensions.reduce((total, dim) => total + (Number(dim.weight) || 0), 0);
  };

  const handleDimensionWeightChange = (index: number, weight: number) => {
    console.group('=== 评分维度权重更新 ===');
    console.log('维度索引:', index);
    console.log('新权重:', weight);
    console.log('当前维度:', debateConfig.judging.dimensions[index]);

    const updatedDimensions = [...debateConfig.judging.dimensions];
    updatedDimensions[index] = {
      ...updatedDimensions[index],
      weight: Number(weight)
    };

    const totalScore = calculateTotalScore(updatedDimensions);
    console.log('更新后的总分:', totalScore);
    console.log('更新后的维度:', updatedDimensions);

    const updatedJudging = {
      ...debateConfig.judging,
      dimensions: updatedDimensions,
      totalScore
    };

    console.log('更新后的裁判配置:', updatedJudging);
    console.groupEnd();

    // 更新本地状态和 Redux store
    handleJudgeConfigChange(updatedJudging);
  };

  const handleTopicChange = (topic: Partial<DebateConfig['topic']>) => {
    //console.log('TopicRuleConfig - handleTopicChange - Input:', topic);
    //console.log('TopicRuleConfig - handleTopicChange - Current Config:', debateConfig.topic);
    
    const updatedTopic = {
      ...debateConfig.topic,
      ...topic
    };
    
    //console.log('TopicRuleConfig - handleTopicChange - Updated Topic:', updatedTopic);
    
    // 更新本地状态
    onDebateConfigChange({ 
      topic: updatedTopic
    });
    
    // 更新 Redux store
    dispatch(updateDebateConfig({ 
      topic: updatedTopic,
      rules: debateConfig.rules,
      judging: debateConfig.judging
    }));
  };

  const toggleDimensions = () => {
    setShowDimensions(prev => !prev);
  };

  //console.log('TopicRuleConfig - Render - Current debateConfig:', debateConfig);

  return (
    <Container>
      <ConfigSection>
        <Card>
          <CardHeader>
            <CardTitle>主题配置</CardTitle>
            <ButtonGroup>
              <StyledButton>重置</StyledButton>
              <StyledButton type="primary">保存</StyledButton>
            </ButtonGroup>
          </CardHeader>
          <FormItem>
            <div className="label">主题名称</div>
            <Input 
              placeholder="请输入辩题" 
              value={debateConfig.topic.title}
              onChange={e => {
                console.log('TopicRuleConfig - Title Input - Value:', e.target.value);
                handleTopicChange({ 
                  title: e.target.value
                });
              }}
            />
          </FormItem>
          <FormItem>
            <div className="label">主题背景</div>
            <TextArea 
              rows={4} 
              placeholder="输入主题背景说明" 
              value={debateConfig.topic.description}
              onChange={e => {
                console.log('TopicRuleConfig - Description Input - Value:', e.target.value);
                handleTopicChange({ 
                  description: e.target.value
                });
              }}
            />
          </FormItem>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>规则配置</CardTitle>
            <ButtonGroup>
              <StyledButton onClick={() => onRuleConfigChange({ ...ruleConfig })}>重置</StyledButton>
              <StyledButton type="primary" onClick={() => onRuleConfigChange({ ...ruleConfig })}>保存</StyledButton>
            </ButtonGroup>
          </CardHeader>
          <FormItem>
            <div className="label">辩论模式</div>
            <Radio.Group
              value={ruleConfig.format}
              onChange={e => handleRuleChange({ format: e.target.value as 'free' | 'structured' })}
            >
              <Radio.Button value="free">自由辩论</Radio.Button>
              <Radio.Button value="structured">正反方辩论</Radio.Button>
            </Radio.Group>
          </FormItem>
          <FormItem>
            <div className="label">规则说明</div>
            <TextArea
              placeholder="输入规则说明"
              value={ruleConfig.description}
              onChange={e => handleRuleChange({ description: e.target.value })}
              rows={4}
            />
          </FormItem>
          <Checkbox
            checked={showAdvanced}
            onChange={e => setShowAdvanced(e.target.checked)}
          >
            高级规则
          </Checkbox>
          <AdvancedSection visible={showAdvanced}>
            <FormItem>
              <div className="label">字数限制</div>
              <Space>
                <InputNumber
                  min={0}
                  placeholder="最小字数"
                  value={ruleConfig.advancedRules.minLength}
                  onChange={value => handleRuleChange({
                    advancedRules: {
                      ...ruleConfig.advancedRules,
                      minLength: value || 0
                    }
                  })}
                />
                <InputNumber
                  min={0}
                  placeholder="最大字数"
                  value={ruleConfig.advancedRules.maxLength}
                  onChange={value => handleRuleChange({
                    advancedRules: {
                      ...ruleConfig.advancedRules,
                      maxLength: value || 0
                    }
                  })}
                />
              </Space>
            </FormItem>
            <FormItem>
              <Checkbox
                checked={ruleConfig.advancedRules.allowQuoting}
                onChange={e => handleRuleChange({
                  advancedRules: {
                    ...ruleConfig.advancedRules,
                    allowQuoting: e.target.checked
                  }
                })}
              >
                允许引用
              </Checkbox>
            </FormItem>
            <FormItem>
              <Checkbox
                checked={ruleConfig.advancedRules.requireResponse}
                onChange={e => handleRuleChange({
                  advancedRules: {
                    ...ruleConfig.advancedRules,
                    requireResponse: e.target.checked
                  }
                })}
              >
                要求回应
              </Checkbox>
            </FormItem>
            <FormItem>
              <Checkbox
                checked={ruleConfig.advancedRules.allowStanceChange}
                onChange={e => handleRuleChange({
                  advancedRules: {
                    ...ruleConfig.advancedRules,
                    allowStanceChange: e.target.checked
                  }
                })}
              >
                允许立场转换
              </Checkbox>
            </FormItem>
            <FormItem>
              <Checkbox
                checked={ruleConfig.advancedRules.requireEvidence}
                onChange={e => handleRuleChange({
                  advancedRules: {
                    ...ruleConfig.advancedRules,
                    requireEvidence: e.target.checked
                  }
                })}
              >
                要求证据支持
              </Checkbox>
            </FormItem>
          </AdvancedSection>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>裁判配置</CardTitle>
            <ButtonGroup>
              <StyledButton onClick={() => {
                console.log('重置裁判配置:', {
                  current: debateConfig.judging,
                  default: {
                    description: '',
                    dimensions: [],
                    totalScore: 100,
                    selectedJudge: undefined
                  }
                });
                handleJudgeConfigChange({
                  description: '',
                  dimensions: [],
                  totalScore: 100,
                  selectedJudge: undefined
                });
              }}>重置</StyledButton>
              <StyledButton type="primary" onClick={() => {
                console.log('保存裁判配置:', debateConfig.judging);
                // 这里可以添加保存前的验证逻辑
                handleJudgeConfigChange(debateConfig.judging);
              }}>保存</StyledButton>
            </ButtonGroup>
          </CardHeader>

          <FormItem>
            <div className="label">裁判选择</div>
            <Select
              style={{ width: '100%' }}
              placeholder="选择裁判"
              value={debateConfig.judging.selectedJudge?.id}
              onChange={(value: string) => {
                console.log('选择裁判:', {
                  selectedId: value,
                  availableCharacters: characterState.characters
                });
                const selectedJudge = characterState.characters.find(
                  (c: CharacterConfig) => c.id === value
                );
                if (selectedJudge) {
                  handleJudgeConfigChange({
                    selectedJudge: {
                      id: selectedJudge.id,
                      name: selectedJudge.name,
                      avatar: selectedJudge.avatar
                    }
                  });
                }
              }}
            >
              {characterState.characters.map((character: CharacterConfig) => (
                <Select.Option 
                  key={character.id} 
                  value={character.id}
                  label={character.name}
                >
                  <JudgeOption>
                    <div className="judge-name">{character.name}</div>
                    <div className="judge-description">{character.description}</div>
                  </JudgeOption>
                </Select.Option>
              ))}
            </Select>
          </FormItem>

          <FormItem>
            <div className="label">评分规则</div>
            <TextArea 
              rows={4} 
              placeholder="输入评分规则说明"
              value={judgeConfig.scoringRule}
              onChange={e => {
                handleScoringRuleChange(e.target.value);
                handleJudgeConfigChange({
                  ...debateConfig.judging,
                  description: e.target.value
                });
              }}
            />
          </FormItem>

          <ScoreHeader>
            <ExpandButton 
              type="text"
              onClick={toggleDimensions}
              icon={showDimensions ? <DownOutlined /> : <RightOutlined />}
            >
              评分维度配置（高级）
            </ExpandButton>
            <ScoreText>总分：{calculateTotalScore(debateConfig.judging.dimensions)} 分</ScoreText>
          </ScoreHeader>

          <DimensionSection $visible={showDimensions}>
            <ScoreConfigContent>
              {debateConfig.judging.dimensions.map((dimension, index) => (
                <DimensionItem key={dimension.id || index}>
                  <DimensionHeader>
                    <div className="dimension-name">
                      <Input
                        value={dimension.name}
                        onChange={e => {
                          const updatedDimensions = [...debateConfig.judging.dimensions];
                          updatedDimensions[index] = {
                            ...dimension,
                            name: e.target.value
                          };
                          handleJudgeConfigChange({
                            ...debateConfig.judging,
                            dimensions: updatedDimensions
                          });
                        }}
                        placeholder="维度名称"
                      />
                    </div>
                    <div className="dimension-weight">
                      <span className="weight-label">权重:</span>
                      <InputNumber
                        value={dimension.weight}
                        onChange={value => handleDimensionWeightChange(index, Number(value))}
                        min={0}
                        max={100}
                        formatter={value => `${value}分`}
                        parser={value => Number(value?.replace('分', '') || 0)}
                      />
                    </div>
                  </DimensionHeader>
                  <DimensionDescription>
                    <Input
                      value={dimension.description}
                      onChange={e => {
                        const updatedDimensions = [...debateConfig.judging.dimensions];
                        updatedDimensions[index] = {
                          ...dimension,
                          description: e.target.value
                        };
                        handleJudgeConfigChange({
                          ...debateConfig.judging,
                          dimensions: updatedDimensions
                        });
                      }}
                      placeholder="请输入评分说明"
                    />
                  </DimensionDescription>
                </DimensionItem>
              ))}
              <Button 
                type="dashed" 
                onClick={() => {
                  const newDimension = {
                    id: crypto.randomUUID(),
                    name: '',
                    weight: 0,
                    description: '',
                    criteria: []
                  };
                  const updatedDimensions = [...debateConfig.judging.dimensions, newDimension];
                  const totalScore = calculateTotalScore(updatedDimensions);
                  
                  const updatedJudging = {
                    ...debateConfig.judging,
                    dimensions: updatedDimensions,
                    totalScore
                  };

                  // 更新本地状态和 Redux store
                  handleJudgeConfigChange(updatedJudging);
                }}
                style={{ width: '100%', marginTop: '8px' }}
              >
                添加评分维度
              </Button>
            </ScoreConfigContent>
          </DimensionSection>
        </Card>
      </ConfigSection>
    </Container>
  );
};

export default TopicRuleConfig; 