import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Modal, Button, List, Tooltip, Upload, message } from 'antd';
import { DeleteOutlined, DownloadOutlined, UploadOutlined, ExportOutlined, ImportOutlined, SettingOutlined } from '@ant-design/icons';
import type { DebateConfig } from '../../types/debate';
import type { GameConfigState } from '../../types/config';
import type { UnifiedRole } from '../../types/roles';

const TemplateButton = styled(Button)`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  height: 2rem;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-1px);
    background: ${({ theme }) => theme.colors.background.hover};
    border-color: ${({ theme }) => theme.colors.border.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  .anticon {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const TemplateModal = styled(Modal)`
  .ant-modal-content {
    background: ${({ theme }) => theme.colors.background.primary};
    ${({ theme }) => theme.mixins.glassmorphism}
    border-radius: ${({ theme }) => theme.radius.lg};
  }

  .ant-modal-header {
    background: transparent;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  }

  .ant-modal-title {
    color: ${({ theme }) => theme.colors.text.primary};
    ${({ theme }) => theme.mixins.textGlow}
  }

  .ant-modal-close {
    color: ${({ theme }) => theme.colors.text.secondary};
  }

  .ant-modal-body {
    padding: 1.5rem;
  }

  p {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const TemplateList = styled(List<UnifiedTemplate>)`
  .ant-list-item {
    padding: 1rem;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.primary};
    background: ${({ theme }) => theme.colors.background.secondary};
    margin-bottom: 0.5rem;
    transition: all ${({ theme }) => theme.transitions.normal};

    &:hover {
      transform: translateY(-2px);
      border-color: ${({ theme }) => theme.colors.border.secondary};
      box-shadow: ${({ theme }) => theme.shadows.sm};
    }
  }
`;

const TemplateTitle = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  ${({ theme }) => theme.mixins.textGlow}
`;

const TemplateDescription = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: 0.25rem;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled(Button)`
  padding: 0.25rem 0.5rem;
  height: auto;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};

  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
    color: ${({ theme }) => theme.colors.primary};
  }

  &.delete-button:hover {
    color: ${({ theme }) => theme.colors.error};
  }
`;

const UploadWrapper = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px dashed ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.background.secondary};
  text-align: center;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  .ant-upload-text {
    color: ${({ theme }) => theme.colors.text.primary};
  }

  .anticon {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

interface StoredPlayer {
  id: string;
  name: string;
  role: UnifiedRole;
  team?: number;
  isAI: boolean;
  characterId?: string;
}

// 基础模板接口
interface BaseTemplate {
  id: string;
  name: string;
  type?: string;
  isPreset?: boolean;
  order?: number;
  topic: DebateConfig['topic'];
  rules: DebateConfig['rules'];
  judging: DebateConfig['judging'];
}

// 预置模板接口
interface PresetTemplate extends BaseTemplate {
  type: 'preset';
  isPreset: true;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

// 存储模板接口
interface StoredTemplate extends BaseTemplate {
  createdAt: string;
  updatedAt: string;
  players?: StoredPlayer[];
}

// 统一模板类型
type UnifiedTemplate = StoredTemplate | PresetTemplate;

interface AIPlayer {
  playerId: string;
  role?: UnifiedRole;
  team?: number;
  characterId?: string;
}

interface TemplateManagerProps {
  currentConfig: DebateConfig;
  onLoadTemplate: (config: DebateConfig) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  currentConfig,
  onLoadTemplate,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [presetTemplates, setPresetTemplates] = useState<PresetTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<UnifiedTemplate[]>([]);

  useEffect(() => {
    loadTemplates();
    loadPresetTemplates();
  }, []);

  useEffect(() => {
    const sorted = getSortedTemplates();
    setAllTemplates(sorted);
  }, [templates, presetTemplates]);

  const loadPresetTemplates = async () => {
    try {
      const response = await fetch('/templates/preset_templates.json');
      const data = await response.json();
      setPresetTemplates(data.presetTemplates || []);
    } catch (error) {
      console.error('加载预置模板失败:', error);
    }
  };

  const loadTemplates = () => {
    try {
      const savedTemplates = JSON.parse(localStorage.getItem('debate_templates') || '{}');
      console.log('[loadTemplates] 从 localStorage 读取的原始模板数据:', savedTemplates);
      
      const templatesArray = typeof savedTemplates === 'object' && savedTemplates !== null
        ? Object.values(savedTemplates)
        : [];
      
      console.log('[loadTemplates] 转换后的模板数组:', templatesArray);
      
      const validTemplates = templatesArray.filter((template: any) => {
        const isValid = template && 
                       template.config && 
                       template.config.topic && 
                       typeof template.config.topic.title === 'string' &&
                       template.id;
        if (!isValid) {
          console.log('[loadTemplates] 无效的模板:', template);
        }
        return isValid;
      }).map((template: any) => {
        console.log('[loadTemplates] 处理模板前的原始数据:', template);
        const mappedTemplate = {
          id: template.id,
          name: template.name || '未命名模板',
          topic: template.config.topic,
          rules: {
            ...template.config.rules,
            description: template.config.rules.description,
            advancedRules: {
              ...template.config.rules.advancedRules
            }
          },
          judging: template.config.judging,
          players: template.config.players || [],
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        };
        console.log('[loadTemplates] 处理后的模板数据:', mappedTemplate);
        return mappedTemplate;
      }) as StoredTemplate[];
      
      console.log('[loadTemplates] 最终有效的模板列表:', validTemplates);
      setTemplates(validTemplates);
    } catch (error) {
      console.error('[loadTemplates] 加载模板失败:', error);
      message.error('加载模板失败');
      setTemplates([]);
    }
  };

  const getSortedTemplates = (): UnifiedTemplate[] => {
    const allTemplates = [...templates, ...presetTemplates];
    return allTemplates.sort((a, b) => {
      // 用户模板优先
      if (a.isPreset !== b.isPreset) {
        return a.isPreset ? 1 : -1;
      }
      // 按更新时间倒序（预置模板使用固定时间）
      const aTime = a.updatedAt || '2024-01-01T00:00:00.000Z';
      const bTime = b.updatedAt || '2024-01-01T00:00:00.000Z';
      const timeDiff = new Date(bTime).getTime() - new Date(aTime).getTime();
      if (timeDiff !== 0) return timeDiff;
      // 预置模板按order排序
      return (a.order || 0) - (b.order || 0);
    });
  };

  const handleSaveTemplate = () => {
    try {
      if (!currentConfig.topic || !currentConfig.rules || !currentConfig.judging) {
        message.error('当前配置不完整，无法保存');
        return;
      }

      console.log('[TemplateManager.handleSaveTemplate] 当前完整配置信息:', currentConfig);
      console.log('[TemplateManager.handleSaveTemplate] 规则配置详情:', {
        debateFormat: currentConfig.rules.debateFormat,
        description: currentConfig.rules.description,
        advancedRules: currentConfig.rules.advancedRules
      });

      const gameConfig = JSON.parse(localStorage.getItem('state_gameConfig') || '{}');
      console.log('[TemplateManager.handleSaveTemplate] 从 localStorage 读取的游戏配置:', gameConfig);
      
      const players = gameConfig.players || [];
      
      const templateId = Date.now().toString();
      const newTemplate = {
        id: templateId,
        name: currentConfig.topic.title || '未命名模板',
        config: {
          topic: {
            ...currentConfig.topic,
            title: currentConfig.topic.title || '未命名模板',
            description: currentConfig.topic.description || ''
          },
          rules: {
            debateFormat: gameConfig.debate?.rules?.debateFormat || currentConfig.rules.debateFormat,
            description: gameConfig.debate?.rules?.description || '',
            advancedRules: {
              speechLengthLimit: gameConfig.debate?.rules?.advancedRules?.speechLengthLimit || {
                min: 100,
                max: 1000
              },
              allowQuoting: gameConfig.debate?.rules?.advancedRules?.allowQuoting ?? true,
              requireResponse: gameConfig.debate?.rules?.advancedRules?.requireResponse ?? true,
              allowStanceChange: gameConfig.debate?.rules?.advancedRules?.allowStanceChange ?? true,
              requireEvidence: gameConfig.debate?.rules?.advancedRules?.requireEvidence ?? false
            }
          },
          judging: {
            ...currentConfig.judging,
            description: currentConfig.judging.description || '',
            dimensions: currentConfig.judging.dimensions || [],
            totalScore: currentConfig.judging.totalScore || 100,
            selectedJudge: currentConfig.judging.selectedJudge ? {
              id: currentConfig.judging.selectedJudge.id
            } : null
          },
          players: players.map((player: StoredPlayer) => ({
            id: player.id,
            name: player.name,
            role: player.role,
            isAI: player.isAI,
            characterId: player.characterId
          }))
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('[TemplateManager.handleSaveTemplate] 准备保存的模板:', newTemplate);
      console.log('[TemplateManager.handleSaveTemplate] 模板中的规则配置:', newTemplate.config.rules);
      
      const existingTemplates = JSON.parse(localStorage.getItem('debate_templates') || '{}');
      console.log('[TemplateManager.handleSaveTemplate] 现有模板:', existingTemplates);
      
      const updatedTemplates = {
        ...existingTemplates,
        [templateId]: newTemplate
      };
      
      localStorage.setItem('debate_templates', JSON.stringify(updatedTemplates));
      console.log('[TemplateManager.handleSaveTemplate] 保存到 localStorage 的数据:', updatedTemplates);
      
      loadTemplates();
      message.success('模板保存成功');
    } catch (error) {
      console.error('[TemplateManager.handleSaveTemplate] 保存模板失败:', error);
      message.error('保存模板失败');
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    try {
      const isPreset = presetTemplates.some(t => t.id === templateId);
      if (isPreset) {
        message.error('预置模板不能删除');
        return;
      }

      const existingTemplates = JSON.parse(localStorage.getItem('debate_templates') || '{}');
      
      if (!existingTemplates[templateId]) {
        message.error('模板不存在');
        return;
      }
      
      delete existingTemplates[templateId];
      localStorage.setItem('debate_templates', JSON.stringify(existingTemplates));
      
      const updatedTemplates = templates.filter(template => template.id !== templateId);
      setTemplates(updatedTemplates);
      
      message.success('模板删除成功');
    } catch (error) {
      console.error('Failed to delete template:', error);
      message.error('删除模板失败');
    }
  };

  const handleExportTemplate = (template: UnifiedTemplate) => {
    try {
      console.log('准备导出的模板:', template);
      
      const exportTemplate = {
        id: template.id,
        name: template.name,
        topic: template.topic,
        rules: template.rules,
        judging: {
          ...template.judging,
          selectedJudge: template.judging?.selectedJudge ? {
            id: template.judging.selectedJudge.id
          } : null
        },
        players: 'players' in template ? template.players?.map(player => ({
          id: player.id,
          name: player.name,
          role: player.role,
          characterId: player.characterId
        })) : undefined,
        createdAt: template.createdAt || new Date().toISOString(),
        updatedAt: template.updatedAt || new Date().toISOString()
      };

      console.log('最终导出的模板数据:', exportTemplate);

      const dataStr = JSON.stringify(exportTemplate, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `debate-template-${template.id}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('导出模板失败:', error);
      message.error('导出模板失败');
    }
  };

  const handleImportTemplate = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string);
        console.log('导入的原始模板数据:', template);
        
        if (!template.topic || !template.rules || !template.judging) {
          throw new Error('Invalid template format');
        }

        console.log('导入模板中的选手信息:', template.players);
        
        const convertedTemplate: DebateConfig = {
          topic: template.topic,
          rules: template.rules,
          judging: template.judging
        };

        console.log('转换后的模板配置:', convertedTemplate);
        
        if (template.players && template.players.length > 0) {
          console.log('保存选手信息到 localStorage');
          const gameConfig = JSON.parse(localStorage.getItem('state_gameConfig') || '{}');
          localStorage.setItem('state_gameConfig', JSON.stringify({
            ...gameConfig,
            players: template.players
          }));
        }

        onLoadTemplate(convertedTemplate);
        message.success('模板导入成功');
      } catch (error) {
        console.error('Failed to import template:', error);
        message.error('导入模板失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleLoadTemplate = (template: StoredTemplate | PresetTemplate) => {
    console.log('[TemplateManager.handleLoadTemplate] 加载模板的原始数据:', template);
    console.log('[TemplateManager.handleLoadTemplate] 原始规则配置:', template.rules);
    
    const convertedTemplate: DebateConfig = {
      topic: template.topic,
      rules: {
        debateFormat: template.rules.debateFormat || 'free',
        description: template.rules.description || '',
        advancedRules: {
          speechLengthLimit: template.rules.advancedRules?.speechLengthLimit || {
            min: 100,
            max: 1000
          },
          allowQuoting: template.rules.advancedRules?.allowQuoting ?? true,
          requireResponse: template.rules.advancedRules?.requireResponse ?? true,
          allowStanceChange: template.rules.advancedRules?.allowStanceChange ?? true,
          requireEvidence: template.rules.advancedRules?.requireEvidence ?? false
        }
      },
      judging: template.judging
    };

    console.log('[TemplateManager.handleLoadTemplate] 转换后的模板配置:', convertedTemplate);
    console.log('[TemplateManager.handleLoadTemplate] 转换后的规则配置:', convertedTemplate.rules);
    
    if (!template.isPreset && 'players' in template && template.players) {
      console.log('[TemplateManager.handleLoadTemplate] 保存选手信息到 localStorage');
      const gameConfig = JSON.parse(localStorage.getItem('state_gameConfig') || '{}');
      localStorage.setItem('state_gameConfig', JSON.stringify({
        ...gameConfig,
        players: template.players
      }));
    }

    onLoadTemplate(convertedTemplate);
    message.success('模板加载成功');
  };

  const renderTemplateItem = (item: StoredTemplate | PresetTemplate) => {
    if (!item || !item.topic) {
      return null;
    }

    return (
      <List.Item>
        <div>
          <TemplateTitle>
            {item.name}
            {item.isPreset && (
              <Tooltip title="预置模板">
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#888' }}>
                  (预置)
                </span>
              </Tooltip>
            )}
          </TemplateTitle>
          <TemplateDescription>{item.topic.title}</TemplateDescription>
        </div>
        <ActionGroup>
          <Tooltip title="使用此模板">
            <ActionButton onClick={() => handleLoadTemplate(item)}>
              <ImportOutlined />
            </ActionButton>
          </Tooltip>
          <Tooltip title="导出模板">
            <ActionButton onClick={() => handleExportTemplate(item)}>
              <ExportOutlined />
            </ActionButton>
          </Tooltip>
          {!item.isPreset && (
            <Tooltip title="删除模板">
              <ActionButton 
                className="delete-button"
                onClick={() => handleDeleteTemplate(item.id)}
              >
                <DeleteOutlined />
              </ActionButton>
            </Tooltip>
          )}
        </ActionGroup>
      </List.Item>
    );
  };

  return (
    <>
      <TemplateButton onClick={() => setIsModalVisible(true)}>
        <SettingOutlined />
        模板管理
      </TemplateButton>

      <TemplateModal
        title="模板管理"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <UploadWrapper>
          <Upload.Dragger
            accept=".json"
            beforeUpload={handleImportTemplate}
            showUploadList={false}
          >
            <p style={{ color: '#E8F0FF' }}>
              <UploadOutlined /> 点击或拖拽文件到此处导入模板
            </p>
          </Upload.Dragger>
        </UploadWrapper>

        <Button 
          type="primary" 
          onClick={handleSaveTemplate}
          style={{ marginBottom: '1rem' }}
        >
          保存当前配置为模板
        </Button>

        {allTemplates.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#E8F0FF',
            opacity: 0.8 
          }}>
            暂无模板
          </div>
        ) : (
          <TemplateList
            dataSource={allTemplates}
            renderItem={renderTemplateItem}
          />
        )}
      </TemplateModal>
    </>
  );
}; 