import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Checkbox, Input, Select, Slider, InputNumber, Radio } from 'antd';
import { DownOutlined, UpOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import type { RuleConfig } from '../../types/rules';
import type { DebateConfig } from '../../types/debate';
import { TextArea as HighlightTextArea } from '../../modules/common/components/TextArea';

const { TextArea } = Input;

// 通用配置面板容器
const ConfigPanel = styled.div`
  ${({ theme }) => theme.mixins.glassmorphism}
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.normal};
  flex: 1;

  // 在移动端上的特殊样式
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-bottom: 0;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const PanelHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  background: ${({ theme }) => theme.colors.background.container};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PanelTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin: 0;
  opacity: 0.9;
`;

const ResetButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.background.hover};
  }
`;

const PanelContent = styled.div`
  padding: 1.5rem;
  background: ${({ theme }) => theme.colors.background.container};
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  // 确保内容在面板内正确滚动
  overflow-y: auto;
  max-height: 60vh;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.secondary};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border.primary};
    border-radius: 3px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const StyledInput = styled(Input)`
  background: rgba(65, 87, 255, 0.1) !important;
  border: 1px solid rgba(65, 87, 255, 0.2) !important;
  color: #E8F0FF !important;
  border-radius: ${({ theme }) => theme.radius.md};
  height: 40px;

  &::placeholder {
    color: rgba(232, 240, 255, 0.6) !important;
  }

  &:hover, &:focus {
    background: rgba(65, 87, 255, 0.15) !important;
    border-color: rgba(65, 87, 255, 0.3) !important;
  }
`;

const StyledHighlightTextArea = styled(HighlightTextArea)`
  background: rgba(65, 87, 255, 0.1) !important;
  border: 1px solid rgba(65, 87, 255, 0.2) !important;
  color: #E8F0FF !important;
  border-radius: ${({ theme }) => theme.radius.md};
  resize: none;
  
  &::placeholder {
    color: rgba(232, 240, 255, 0.6) !important;
  }

  &:hover, &:focus {
    background: rgba(65, 87, 255, 0.15) !important;
    border-color: rgba(65, 87, 255, 0.3) !important;
  }

  &.ant-input {
    &:hover, &:focus {
      background: rgba(65, 87, 255, 0.15) !important;
      color: #E8F0FF !important;
    }
  }

  &.topic-textarea {
    height: 120px;
  }

  &.rules-textarea {
    height: 105px;
  }

  &.scoring-textarea {
    height: 145px;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const StyledCheckbox = styled(Checkbox)`
  .ant-checkbox-inner {
    background: ${({ theme }) => theme.colors.background.secondary};
    border-color: ${({ theme }) => theme.colors.border.primary};
  }
  
  .ant-checkbox-checked .ant-checkbox-inner {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
  
  .ant-checkbox + span {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const ExpandableSection = styled.div<{ isExpanded: boolean }>`
  margin-top: 1rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  transition: all ${({ theme }) => theme.transitions.normal};
  
  ${({ isExpanded }) => !isExpanded && `
    height: 0;
    padding: 0;
    margin: 0;
    overflow: hidden;
    border: none;
  `}
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  padding: 0.5rem;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

// 添加 StyledSelect 组件
const StyledSelect = styled(Select)`
  .ant-select-selector {
    background: rgba(65, 87, 255, 0.1) !important;
    border: 1px solid rgba(65, 87, 255, 0.2) !important;
    border-radius: ${({ theme }) => theme.radius.md} !important;
    height: 40px !important;
    padding: 4px 12px !important;

    .ant-select-selection-placeholder {
      color: rgba(232, 240, 255, 0.6) !important;
    }

    .ant-select-selection-item {
      color: #E8F0FF !important;
      line-height: 30px !important;
    }
  }

  &:hover, &.ant-select-focused {
    .ant-select-selector {
      background: rgba(65, 87, 255, 0.15) !important;
      border-color: rgba(65, 87, 255, 0.3) !important;
    }
  }

  .ant-select-arrow {
    color: rgba(232, 240, 255, 0.6) !important;
  }
`;

// 添加 StyledSlider 组件
const StyledSlider = styled(Slider)`
  .ant-slider-track {
    background-color: ${({ theme }) => theme.colors.primary};
  }
  
  .ant-slider-handle {
    border-color: ${({ theme }) => theme.colors.primary};
    
    &:hover, &:focus {
      border-color: ${({ theme }) => theme.colors.secondary};
    }
  }
  
  .ant-slider-rail {
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }
`;

// 添加新的样式组件
const RadioGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const RadioButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${({ active, theme }) => 
    active ? theme.colors.primary : theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ active, theme }) => 
    active ? theme.colors.primary : theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const DimensionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DimensionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const DimensionRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.error};
  cursor: pointer;
  padding: 0.25rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
  }
`;

const AddButton = styled.button`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px dashed ${({ theme }) => theme.colors.border.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const WeightSum = styled.span<{ isValid: boolean }>`
  color: ${({ isValid, theme }) => isValid ? theme.colors.success : theme.colors.error};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  ${({ theme }) => theme.mixins.textGlow};
  opacity: 0.9;
`;

const DimensionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const Container = styled.div`
  ${({ theme }) => theme.mixins.glassmorphism}
  margin-top: 2rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background.container};
  transition: all ${({ theme }) => theme.transitions.normal};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin: 0;
  ${({ theme }) => theme.mixins.textGlow};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const PlayerList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  background: ${({ theme }) => theme.colors.background.container};
`;

const PlayerCard = styled.div`
  ${({ theme }) => theme.mixins.glassmorphism}
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: ${({ theme }) => theme.radius.md};
  transition: all ${({ theme }) => theme.transitions.normal};
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.border.secondary};
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledAvatar = styled.span`
  background: ${({ theme }) => theme.colors.background.accent};
  color: ${({ theme }) => theme.colors.text.primary};
  ${({ theme }) => theme.mixins.textGlow};
`;

const AIBadge = styled.div`
  position: absolute;
  bottom: -0.5rem;
  right: -0.5rem;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.2rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  ${({ theme }) => theme.mixins.textGlow};
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PlayerName = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin: 0;
  ${({ theme }) => theme.mixins.textGlow};
`;

const CharacterInfo = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const CharacterSelect = styled.div`
  margin: 0.5rem 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const StyledInputNumber = styled(InputNumber)`
  background: rgba(65, 87, 255, 0.1) !important;
  border: 1px solid rgba(65, 87, 255, 0.2) !important;
  border-radius: ${({ theme }) => theme.radius.md} !important;
  width: 100% !important;

  .ant-input-number-input {
    color: #E8F0FF !important;
    height: 38px !important;
  }

  &:hover, &:focus {
    background: rgba(65, 87, 255, 0.15) !important;
    border-color: rgba(65, 87, 255, 0.3) !important;
  }

  .ant-input-number-handler-wrap {
    background: rgba(65, 87, 255, 0.2) !important;
    border-left: 1px solid rgba(65, 87, 255, 0.2) !important;

    .ant-input-number-handler {
      border-color: rgba(65, 87, 255, 0.2) !important;
      
      &:hover {
        .ant-input-number-handler-up-inner,
        .ant-input-number-handler-down-inner {
          color: #E8F0FF !important;
        }
      }
    }

    .ant-input-number-handler-up-inner,
    .ant-input-number-handler-down-inner {
      color: rgba(232, 240, 255, 0.6) !important;
    }
  }
`;

// 主题配置面板
export const TopicConfigPanel: React.FC<{
  debateConfig: DebateConfig;
  onDebateConfigChange: (config: Partial<DebateConfig>) => void;
}> = ({ debateConfig, onDebateConfigChange }) => {
  const handleReset = () => {
    onDebateConfigChange({
      topic: {
        title: '',
        description: '',
        rounds: 3
      }
    });
  };

  return (
    <ConfigPanel>
      <PanelHeader>
        <PanelTitle>主题配置</PanelTitle>
        <ResetButton onClick={handleReset}>
          <ReloadOutlined />
          重置
        </ResetButton>
      </PanelHeader>
      <PanelContent>
        <FormGroup>
          <Label>主题名称</Label>
          <StyledInput
            value={debateConfig.topic.title}
            onChange={(e) => onDebateConfigChange({
              topic: { ...debateConfig.topic, title: e.target.value }
            })}
            placeholder="请输入辩题"
          />
        </FormGroup>
        <FormGroup>
          <Label>主题背景</Label>
          <StyledHighlightTextArea
            className="topic-textarea"
            value={debateConfig.topic.description}
            onChange={(e) => onDebateConfigChange({
              topic: { ...debateConfig.topic, description: e.target.value }
            })}
            placeholder="请输入主题背景描述"
          />
        </FormGroup>
        <FormGroup>
          <Label>轮次设置</Label>
          <StyledInput
            type="number"
            min={1}
            max={10}
            value={debateConfig.topic.rounds}
            onChange={(e) => onDebateConfigChange({
              topic: { ...debateConfig.topic, rounds: parseInt(e.target.value) || 3 }
            })}
            placeholder="请输入轮次数量"
          />
        </FormGroup>
      </PanelContent>
    </ConfigPanel>
  );
};

// 规则配置面板
export const RuleConfigPanel: React.FC<{
  ruleConfig: RuleConfig;
  onRuleConfigChange: (config: RuleConfig) => void;
}> = ({ ruleConfig, onRuleConfigChange }) => {
  const handleReset = () => {
    onRuleConfigChange({
      debateFormat: 'structured',
      description: '',
      advancedRules: {
        speechLengthLimit: {
          min: 100,
          max: 1000,
        },
        allowQuoting: true,
        requireResponse: true,
        allowStanceChange: false,
        requireEvidence: true,
      },
      roundRules: [],
      scoringRules: []
    });
  };

  return (
    <ConfigPanel>
      <PanelHeader>
        <PanelTitle>规则配置</PanelTitle>
        <ResetButton onClick={handleReset}>
          <ReloadOutlined />
          重置
        </ResetButton>
      </PanelHeader>
      <PanelContent>
        <FormGroup>
          <Label>游戏模式</Label>
          <RadioGroup>
            <RadioButton
              active={ruleConfig.debateFormat === 'free'}
              onClick={() => onRuleConfigChange({
                ...ruleConfig,
                debateFormat: 'free'
              })}
            >
              自由模式
            </RadioButton>
            <RadioButton
              active={ruleConfig.debateFormat === 'structured'}
              onClick={() => onRuleConfigChange({
                ...ruleConfig,
                debateFormat: 'structured'
              })}
            >
              阵营模式
            </RadioButton>
            <RadioButton
              active={ruleConfig.debateFormat === 'tournament'}
              onClick={() => onRuleConfigChange({
                ...ruleConfig,
                debateFormat: 'tournament'
              })}
            >
              淘汰模式
            </RadioButton>
          </RadioGroup>
        </FormGroup>
        <FormGroup>
          <Label>规则说明</Label>
          <StyledHighlightTextArea
            className="rules-textarea"
            value={ruleConfig.description}
            onChange={(e) => onRuleConfigChange({
              ...ruleConfig,
              description: e.target.value
            })}
            placeholder="请输入规则说明"
          />
        </FormGroup>
        <FormGroup>
          <Label>字数限制</Label>
          <StyledSlider
            range
            min={100}
            max={2000}
            value={[
              ruleConfig.advancedRules.speechLengthLimit.min,
              ruleConfig.advancedRules.speechLengthLimit.max
            ]}
            onChange={(value: number[]) => onRuleConfigChange({
              ...ruleConfig,
              advancedRules: {
                ...ruleConfig.advancedRules,
                speechLengthLimit: {
                  min: value[0],
                  max: value[1]
                }
              }
            })}
          />
        </FormGroup>
      </PanelContent>
    </ConfigPanel>
  );
};

// 评分配置面板
export const ScoringConfigPanel: React.FC<{
  debateConfig: DebateConfig;
  onJudgeConfigChange: (judging: Partial<DebateConfig['judging']>) => void;
}> = ({ debateConfig, onJudgeConfigChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [judgeOptions, setJudgeOptions] = useState<{ value: string; label: string; }[]>([]);

  // 添加默认维度
  const defaultDimensions = [
    {
      id: '1',
      name: '逻辑性',
      weight: 40,
      description: '论证的逻辑严密程度',
      criteria: []
    },
    {
      id: '2',
      name: '拟人程度',
      weight: 30,
      description: '观点和论证的拟人化程度',
      criteria: []
    },
    {
      id: '3',
      name: '规则遵守',
      weight: 30,
      description: '对辩论规则的遵守程度',
      criteria: []
    }
  ];

  useEffect(() => {
    const loadJudgeOptions = () => {
      try {
        const characterConfigs = JSON.parse(localStorage.getItem('character_configs') || '[]');
        const filteredCharacters = characterConfigs
          .filter((char: any) => !char.isTemplate)
          .map((char: any) => ({
            value: char.id,
            label: char.name
          }));
        setJudgeOptions(filteredCharacters);
      } catch (error) {
        console.error('Failed to load judge options:', error);
        setJudgeOptions([]);
      }
    };

    loadJudgeOptions();
  }, []);

  const handleReset = () => {
    onJudgeConfigChange({
      description: '',
      dimensions: defaultDimensions,
      totalScore: 100,
      type: 'human'
    });
  };

  const handleJudgeChange = (value: unknown) => {
    if (typeof value === 'string') {
      const selectedCharacter = judgeOptions.find(opt => opt.value === value);
      if (selectedCharacter) {
        onJudgeConfigChange({
          ...debateConfig.judging,
          selectedJudge: {
            id: selectedCharacter.value,
            name: selectedCharacter.label
          }
        });
      }
    }
  };

  const handleAddDimension = () => {
    const newDimension = {
      id: Date.now().toString(),
      name: '',
      weight: 0,
      description: '',
      criteria: []
    };
    
    onJudgeConfigChange({
      ...debateConfig.judging,
      dimensions: [...(debateConfig.judging?.dimensions || []), newDimension]
    });
  };

  // 在组件挂载时，如果没有维度，则添加默认维度
  useEffect(() => {
    if (!debateConfig.judging?.dimensions || debateConfig.judging.dimensions.length === 0) {
      onJudgeConfigChange({
        ...debateConfig.judging,
        dimensions: defaultDimensions
      });
    }
  }, []);

  const handleRemoveDimension = (id: string) => {
    onJudgeConfigChange({
      ...debateConfig.judging,
      dimensions: (debateConfig.judging?.dimensions || []).filter(d => d.id !== id)
    });
  };

  const handleDimensionChange = (id: string, field: string, value: string | number) => {
    onJudgeConfigChange({
      ...debateConfig.judging,
      dimensions: (debateConfig.judging?.dimensions || []).map(d => 
        d.id === id ? { ...d, [field]: value } : d
      )
    });
  };

  // 计算权重总和
  const calculateWeightSum = () => {
    return (debateConfig.judging?.dimensions || []).reduce((sum, dim) => sum + (dim.weight || 0), 0);
  };

  return (
    <ConfigPanel>
      <PanelHeader>
        <PanelTitle>评分配置</PanelTitle>
        <ResetButton onClick={handleReset}>
          <ReloadOutlined />
          重置
        </ResetButton>
      </PanelHeader>
      <PanelContent>
        <FormGroup>
          <Label>裁判选择</Label>
          <StyledSelect
            style={{ width: '100%' }}
            value={debateConfig.judging?.selectedJudge?.id || ''}
            onChange={handleJudgeChange}
            options={judgeOptions}
          />
        </FormGroup>
        <FormGroup>
          <Label>评分规则</Label>
          <StyledHighlightTextArea
            className="scoring-textarea"
            value={debateConfig.judging?.description}
            onChange={(e) => onJudgeConfigChange({
              ...debateConfig.judging,
              description: e.target.value
            })}
            placeholder="请输入评分规则说明"
          />
        </FormGroup>
        <FormGroup>
          <DimensionHeader>
            <ExpandButton onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <UpOutlined /> : <DownOutlined />}
              评分维度
            </ExpandButton>
            <WeightSum isValid={calculateWeightSum() === 100}>
              权重总和：{calculateWeightSum()}
            </WeightSum>
          </DimensionHeader>
          <ExpandableSection isExpanded={isExpanded}>
            <DimensionList>
              {debateConfig.judging?.dimensions?.map((dimension) => (
                <DimensionItem key={dimension.id}>
                  <DimensionRow>
                    <StyledInput
                      value={dimension.name}
                      onChange={(e) => handleDimensionChange(dimension.id, 'name', e.target.value)}
                      placeholder="维度名称"
                      style={{ flex: 2 }}
                    />
                    <StyledInput
                      type="number"
                      value={dimension.weight}
                      onChange={(e) => handleDimensionChange(dimension.id, 'weight', parseInt(e.target.value) || 0)}
                      placeholder="权重"
                      style={{ flex: 1 }}
                    />
                    <DeleteButton onClick={() => handleRemoveDimension(dimension.id)}>
                      删除
                    </DeleteButton>
                  </DimensionRow>
                  <DimensionRow>
                    <StyledInput
                      value={dimension.description}
                      onChange={(e) => handleDimensionChange(dimension.id, 'description', e.target.value)}
                      placeholder="维度说明"
                      style={{ flex: 1 }}
                    />
                  </DimensionRow>
                </DimensionItem>
              ))}
              <AddButton onClick={handleAddDimension}>
                <PlusOutlined />
                添加评分维度
              </AddButton>
            </DimensionList>
          </ExpandableSection>
        </FormGroup>
      </PanelContent>
    </ConfigPanel>
  );
}; 