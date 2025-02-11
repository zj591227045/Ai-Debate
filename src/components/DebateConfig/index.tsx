import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Card, Button, Input, Radio, Checkbox, Space, Select, InputNumber } from 'antd';
import { useJudgeConfig } from '../../hooks/useJudgeConfig';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Judge } from '../../types/judge';

const { TextArea } = Input;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-md);
`;

const ConfigSection = styled.div`
  display: flex;
  gap: var(--spacing-md);
  > * {
    flex: 1;
    min-width: 300px;
  }
`;

const FormItem = styled.div`
  margin-bottom: var(--spacing-md);
  
  .ant-input, .ant-input-textarea {
    margin-top: var(--spacing-xs);
  }
`;

const DimensionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
`;

const BonusItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
`;

const TotalScore = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: var(--spacing-md);
  font-size: 16px;
  font-weight: 500;
  color: #1890ff;
`;

const CustomScoreSection = styled.div`
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
`;

const CustomScoreItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
`;

const ScoreHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
  border: 1px solid #f0f0f0;
  padding: 8px;
  border-radius: 4px;
`;

const ExpandButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DimensionSection = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'block' : 'none'};
  margin-top: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
`;

const DebateConfig: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleScore, setNewRuleScore] = useState<number>(0);
  const [showDimensions, setShowDimensions] = useState(false);
  
  const {
    config,
    handleJudgeSelect,
    handleScoringRuleChange,
    handleDimensionChange,
    addCustomScoreRule,
    removeCustomScoreRule,
    getTotalScore,
    availableJudges,
  } = useJudgeConfig();

  useEffect(() => {
    console.log('showDimensions state changed:', showDimensions);
  }, [showDimensions]);

  const toggleDimensions = () => {
    console.log('Toggle button clicked, current state:', showDimensions);
    setShowDimensions(prev => !prev);
  };

  const handleAddCustomRule = () => {
    if (newRuleName && newRuleScore) {
      addCustomScoreRule(newRuleName, newRuleScore);
      setNewRuleName('');
      setNewRuleScore(0);
    }
  };

  return (
    <Container>
      <Header>
        <h2>主题与规则模板</h2>
        <Space>
          <Button>加载模板</Button>
          <Button type="primary">保存为模板</Button>
        </Space>
      </Header>

      <ConfigSection>
        <Card title="主题配置">
          <FormItem>
            <div>主题名称</div>
            <Input placeholder="输入辩题" />
          </FormItem>
          <FormItem>
            <div>主题背景</div>
            <TextArea rows={4} placeholder="输入主题背景说明" />
          </FormItem>
        </Card>

        <Card title="规则配置">
          <FormItem>
            <Radio.Group defaultValue="structured">
              <Radio.Button value="structured">正反方辩论</Radio.Button>
              <Radio.Button value="free">自由辩论</Radio.Button>
            </Radio.Group>
          </FormItem>
          <FormItem>
            <div>规则说明</div>
            <TextArea rows={4} placeholder="输入规则说明" />
          </FormItem>
          <FormItem>
            <Checkbox>高级规则</Checkbox>
          </FormItem>
        </Card>

        <Card title="裁判配置">
          <FormItem>
            <div className="label">裁判选择</div>
            <Select
              style={{ width: '100%' }}
              placeholder="选择裁判"
              value={config.selectedJudgeId}
              onChange={handleJudgeSelect}
            >
              {availableJudges.map((judge: Judge) => (
                <Select.Option key={judge.id} value={judge.id}>
                  {judge.name}
                </Select.Option>
              ))}
            </Select>
          </FormItem>

          <FormItem>
            <div>评分规则</div>
            <TextArea 
              rows={4} 
              placeholder="输入评分规则说明"
              value={config.scoringRule}
              onChange={e => handleScoringRuleChange(e.target.value)}
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
            <div>总分：{getTotalScore()} 分</div>
          </ScoreHeader>

          <DimensionSection $visible={showDimensions} data-visible={showDimensions}>
            <DimensionItem>
              <span>逻辑性：</span>
              <InputNumber
                min={0}
                max={100}
                value={config.dimensionScores.logic}
                onChange={(value) => handleDimensionChange('logic', value || 0)}
              />
            </DimensionItem>
            <DimensionItem>
              <span>拟人程度：</span>
              <InputNumber
                min={0}
                max={100}
                value={config.dimensionScores.humanness}
                onChange={(value) => handleDimensionChange('humanness', value || 0)}
              />
            </DimensionItem>
            <DimensionItem>
              <span>规则遵守：</span>
              <InputNumber
                min={0}
                max={100}
                value={config.dimensionScores.compliance}
                onChange={(value) => handleDimensionChange('compliance', value || 0)}
              />
            </DimensionItem>
          </DimensionSection>

          <CustomScoreSection>
            <FormItem>
              <div>自定义评分规则</div>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="规则名称"
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                />
                <InputNumber
                  placeholder="分值"
                  value={newRuleScore}
                  onChange={value => setNewRuleScore(value || 0)}
                  min={0}
                  max={100}
                />
                <Button type="primary" onClick={handleAddCustomRule}>
                  添加
                </Button>
              </Space.Compact>
            </FormItem>

            {config.customScoreRules.map(rule => (
              <CustomScoreItem key={rule.id}>
                <span>{rule.name}：</span>
                <span>{rule.score}分</span>
                <Button 
                  type="text" 
                  danger 
                  onClick={() => removeCustomScoreRule(rule.id)}
                >
                  删除
                </Button>
              </CustomScoreItem>
            ))}
          </CustomScoreSection>
        </Card>
      </ConfigSection>
    </Container>
  );
};

export default DebateConfig; 