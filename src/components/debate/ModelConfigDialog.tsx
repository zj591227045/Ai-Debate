import React from 'react';
import styled from '@emotion/styled';
import { ModelConfig, ModelProvider, PRESET_MODELS } from '../../types/model';

interface ModelConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: ModelConfig;
  onSave: (config: ModelConfig) => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Dialog = styled.div`
  background-color: ${props => props.theme.colors.background.default};
  border-radius: ${props => props.theme.radius.lg};
  padding: ${props => props.theme.spacing.lg};
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const Title = styled.h2`
  margin: 0 0 ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.xl};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.sm};
  background-color: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.sm};
  background-color: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.lg};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border: none;
  border-radius: ${props => props.theme.radius.sm};
  background-color: ${props => 
    props.variant === 'primary' 
      ? props.theme.colors.primary 
      : props.theme.colors.background.secondary
  };
  color: ${props => 
    props.variant === 'primary'
      ? props.theme.colors.white
      : props.theme.colors.text.primary
  };
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }
`;

export const ModelConfigDialog: React.FC<ModelConfigDialogProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSave,
}) => {
  const [config, setConfig] = React.useState<ModelConfig>(currentConfig);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value as ModelProvider;
    if (provider === 'custom') {
      setConfig({
        ...config,
        provider,
        modelName: '',
        customConfig: {
          providerName: '',
          modelParameters: {},
        },
      });
    } else {
      setConfig({
        ...config,
        provider,
        modelName: PRESET_MODELS[provider].models[0],
        apiEndpoint: PRESET_MODELS[provider].endpoints.default,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={e => e.stopPropagation()}>
        <Title>模型配置</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>模型提供商</Label>
            <Select
              value={config.provider}
              onChange={handleProviderChange}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
              <option value="custom">自定义</option>
            </Select>
          </FormGroup>

          {config.provider === 'custom' ? (
            <>
              <FormGroup>
                <Label>提供商名称</Label>
                <Input
                  type="text"
                  value={config.customConfig?.providerName || ''}
                  onChange={e => setConfig({
                    ...config,
                    customConfig: {
                      ...config.customConfig!,
                      providerName: e.target.value,
                    },
                  })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>API 端点</Label>
                <Input
                  type="text"
                  value={config.apiEndpoint || ''}
                  onChange={e => setConfig({
                    ...config,
                    apiEndpoint: e.target.value,
                  })}
                  required
                />
              </FormGroup>
            </>
          ) : (
            <FormGroup>
              <Label>模型</Label>
              <Select
                value={config.modelName}
                onChange={e => setConfig({
                  ...config,
                  modelName: e.target.value,
                })}
              >
                {PRESET_MODELS[config.provider as Exclude<ModelProvider, 'custom'>].models.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </Select>
            </FormGroup>
          )}

          <FormGroup>
            <Label>API Key</Label>
            <Input
              type="password"
              value={config.apiKey}
              onChange={e => setConfig({
                ...config,
                apiKey: e.target.value,
              })}
              required
            />
          </FormGroup>

          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" variant="primary">
              保存
            </Button>
          </ButtonGroup>
        </Form>
      </Dialog>
    </Overlay>
  );
}; 