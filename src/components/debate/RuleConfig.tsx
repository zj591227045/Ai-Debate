import React from 'react';
import { Space, Button, Radio, Input, Collapse, Checkbox, InputNumber } from 'antd';
import { ConfigContainer, ConfigHeader, ConfigContent, Title, FormItem } from '../../styles/config';
import type { RuleConfig, RuleConfigProps } from '../../types/rules';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { RadioChangeEvent } from 'antd/es/radio';
const { Panel } = Collapse;

const RuleConfigComponent: React.FC<RuleConfigProps> = ({
  config,
  onChange,
}) => {
  return (
    <ConfigContainer>
      <ConfigHeader>
        <Title>规则配置</Title>
        <Space>
          <Button onClick={() => onChange({ ...config })}>重置</Button>
          <Button type="primary" onClick={() => onChange({ ...config })}>保存</Button>
        </Space>
      </ConfigHeader>

      <ConfigContent>
        <div className="form-item">
          <label>辩论模式</label>
          <Radio.Group
            value={config.format}
            onChange={(e: RadioChangeEvent) => onChange({ ...config, format: e.target.value as 'free' | 'structured' })}
          >
            <Radio.Button value="free">自由辩论</Radio.Button>
            <Radio.Button value="structured">正反方辩论</Radio.Button>
          </Radio.Group>
        </div>

        <div className="form-item">
          <label>规则说明</label>
          <Input.TextArea
            placeholder="输入规则说明"
            value={config.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, description: e.target.value })}
            rows={4}
          />
        </div>

        <Collapse>
          <Panel header="高级规则" key="advanced">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="form-item">
                <label>字数限制</label>
                <Space>
                  <InputNumber
                    min={0}
                    placeholder="最小字数"
                    value={config.advancedRules.minLength}
                    onChange={(value: number | null) => onChange({
                      ...config,
                      advancedRules: {
                        ...config.advancedRules,
                        minLength: value || 0
                      }
                    })}
                  />
                  <InputNumber
                    min={0}
                    placeholder="最大字数"
                    value={config.advancedRules.maxLength}
                    onChange={(value: number | null) => onChange({
                      ...config,
                      advancedRules: {
                        ...config.advancedRules,
                        maxLength: value || 0
                      }
                    })}
                  />
                </Space>
              </div>

              <div className="form-item">
                <Checkbox
                  checked={config.advancedRules.allowQuoting}
                  onChange={(e: CheckboxChangeEvent) => onChange({
                    ...config,
                    advancedRules: {
                      ...config.advancedRules,
                      allowQuoting: e.target.checked
                    }
                  })}
                >
                  允许引用
                </Checkbox>
              </div>

              <div className="form-item">
                <Checkbox
                  checked={config.advancedRules.requireResponse}
                  onChange={(e: CheckboxChangeEvent) => onChange({
                    ...config,
                    advancedRules: {
                      ...config.advancedRules,
                      requireResponse: e.target.checked
                    }
                  })}
                >
                  要求回应
                </Checkbox>
              </div>

              <div className="form-item">
                <Checkbox
                  checked={config.advancedRules.allowStanceChange}
                  onChange={(e: CheckboxChangeEvent) => onChange({
                    ...config,
                    advancedRules: {
                      ...config.advancedRules,
                      allowStanceChange: e.target.checked
                    }
                  })}
                >
                  允许立场转换
                </Checkbox>
              </div>

              <div className="form-item">
                <Checkbox
                  checked={config.advancedRules.requireEvidence}
                  onChange={(e: CheckboxChangeEvent) => onChange({
                    ...config,
                    advancedRules: {
                      ...config.advancedRules,
                      requireEvidence: e.target.checked
                    }
                  })}
                >
                  要求证据支持
                </Checkbox>
              </div>
            </Space>
          </Panel>
        </Collapse>
      </ConfigContent>
    </ConfigContainer>
  );
};

export const defaultRuleConfig: RuleConfig = {
  format: 'free',
  timeLimit: 300,
  totalRounds: 3,
  debateFormat: 'free',
  description: '',
  basicRules: {
    speechLengthLimit: {
      min: 60,
      max: 300
    },
    allowEmptySpeech: false,
    allowRepeatSpeech: false
  },
  advancedRules: {
    maxLength: 1000,
    minLength: 100,
    allowQuoting: true,
    requireResponse: true,
    allowStanceChange: false,
    requireEvidence: true
  }
};

export default RuleConfigComponent; 