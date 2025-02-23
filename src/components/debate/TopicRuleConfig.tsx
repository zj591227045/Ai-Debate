import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Input, Radio, Checkbox, Button, InputNumber, Select, Space, Form } from 'antd';
import { DownOutlined, RightOutlined, DeleteOutlined } from '@ant-design/icons';
import type { RuleConfig } from '../../types/rules';
import type { DebateConfig } from '../../types/debate';
import { useStore } from '../../modules/state';
import { StateLogger } from '../../modules/state/utils';
import type { CharacterConfig } from '../../modules/character/types';
import { useCharacter } from '../../modules/character';

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

const logger = StateLogger.getInstance();

interface TopicRuleConfigProps {
  ruleConfig: RuleConfig;
  onRuleConfigChange: (newRuleConfig: RuleConfig) => void;
  debateConfig: DebateConfig;
  onDebateConfigChange: (config: Partial<DebateConfig>) => void;
}

const TopicRuleConfig: React.FC<TopicRuleConfigProps> = ({
  ruleConfig,
  onRuleConfigChange,
  debateConfig,
  onDebateConfigChange
}) => {
  const { state: gameConfig, setState: setGameConfig } = useStore('gameConfig');
  const { state: characterState } = useCharacter();
  const [showDimensions, setShowDimensions] = useState(false);
  const [showAdvancedRules, setShowAdvancedRules] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    onDebateConfigChange({
      topic: {
        ...debateConfig.topic,
        title: newTitle
      }
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    onDebateConfigChange({
      topic: {
        ...debateConfig.topic,
        description: newDescription
      }
    });
  };

  const handleRuleChange = (newConfig: Partial<RuleConfig>) => {
    const updatedConfig = {
      ...ruleConfig,
      ...newConfig
    };
    onRuleConfigChange(updatedConfig);
  };

  const handleJudgeConfigChange = (judging: Partial<DebateConfig['judging']>) => {
    onDebateConfigChange({
      judging: {
        ...debateConfig.judging,
        ...judging
      }
    });
  };

  const calculateTotalScore = (dimensions: DebateConfig['judging']['dimensions']) => {
    return dimensions.reduce((total, dim) => total + (Number(dim.weight) || 0), 0);
  };

  const handleDimensionWeightChange = (index: number, weight: number) => {
    if (debateConfig.judging?.dimensions) {
      const updatedDimensions = [...debateConfig.judging.dimensions];
      updatedDimensions[index] = {
        ...updatedDimensions[index],
        weight
      };
      handleJudgeConfigChange({
        dimensions: updatedDimensions
      });
    }
  };

  return (
    <Container>
      <ConfigSection>
        <Card>
          <CardHeader>
            <CardTitle>主题配置</CardTitle>
            <ButtonGroup>
              <StyledButton onClick={() => onDebateConfigChange({
                topic: {
                  title: '',
                  description: '',
                  rounds: 3
                }
              })}>重置</StyledButton>
              <StyledButton type="primary">保存</StyledButton>
            </ButtonGroup>
          </CardHeader>
          <FormItem>
            <div className="label">主题名称</div>
            <Input 
              placeholder="请输入辩题" 
              value={debateConfig.topic.title}
              onChange={handleTitleChange}
            />
          </FormItem>
          <FormItem>
            <div className="label">主题背景</div>
            <TextArea 
              rows={4} 
              placeholder="输入主题背景说明" 
              value={debateConfig.topic.description}
              onChange={handleDescriptionChange}
            />
          </FormItem>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>规则配置</CardTitle>
            <ButtonGroup>
              <StyledButton onClick={() => handleRuleChange({ ...ruleConfig })}>重置</StyledButton>
              <StyledButton type="primary" onClick={() => handleRuleChange({ ...ruleConfig })}>保存</StyledButton>
            </ButtonGroup>
          </CardHeader>
          <FormItem>
            <div className="label">游戏模式</div>
            <Radio.Group
              value={ruleConfig.debateFormat}
              onChange={e => handleRuleChange({ debateFormat: e.target.value as 'free' | 'structured' })}
            >
              <Radio.Button value="free">自由模式</Radio.Button>
              <Radio.Button value="structured" disabled title="功能正在开发中">阵营模式</Radio.Button>
              <Radio.Button value="elimination" disabled title="功能正在开发中">淘汰模式</Radio.Button>
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
            checked={showAdvancedRules}
            onChange={e => setShowAdvancedRules(e.target.checked)}
          >
            高级规则
          </Checkbox>
          <AdvancedSection visible={showAdvancedRules}>
            <FormItem>
              <div className="label">字数限制</div>
              <Space>
                <InputNumber
                  min={0}
                  placeholder="最小字数"
                  value={ruleConfig.advancedRules?.speechLengthLimit.min}
                  onChange={value => handleRuleChange({
                    advancedRules: {
                      ...ruleConfig.advancedRules,
                      speechLengthLimit: {
                        min: value || 0,
                        max: ruleConfig.advancedRules.speechLengthLimit.max
                      }
                    }
                  })}
                />
                <InputNumber
                  min={0}
                  placeholder="最大字数"
                  value={ruleConfig.advancedRules?.speechLengthLimit.max}
                  onChange={value => handleRuleChange({
                    advancedRules: {
                      ...ruleConfig.advancedRules,
                      speechLengthLimit: {
                        min: ruleConfig.advancedRules.speechLengthLimit.min,
                        max: value || 0
                      }
                    }
                  })}
                />
              </Space>
            </FormItem>
            <FormItem>
              <Checkbox
                checked={ruleConfig.advancedRules?.allowQuoting}
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
                checked={ruleConfig.advancedRules?.requireResponse}
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
                checked={ruleConfig.advancedRules?.allowStanceChange}
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
                checked={ruleConfig.advancedRules?.requireEvidence}
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
                handleJudgeConfigChange({
                  description: '',
                  dimensions: [],
                  totalScore: 100,
                  selectedJudge: undefined
                });
              }}>重置</StyledButton>
              <StyledButton type="primary" onClick={() => {
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
                const selectedJudge = characterState.characters.filter(
                  (c: CharacterConfig) => !c.isTemplate && !c.id.startsWith('human_')
                ).find(
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
              {characterState.characters.filter((character: CharacterConfig) => 
                !character.isTemplate && !character.id.startsWith('human_')
              ).map((character: CharacterConfig) => (
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
              value={debateConfig.judging.description}
              onChange={e => {
                handleJudgeConfigChange({
                  description: e.target.value
                });
              }}
            />
          </FormItem>

          <ScoreHeader>
            <ExpandButton 
              type="text"
              onClick={() => setShowDimensions(!showDimensions)}
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
                  handleJudgeConfigChange({
                    dimensions: [...debateConfig.judging.dimensions, newDimension]
                  });
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