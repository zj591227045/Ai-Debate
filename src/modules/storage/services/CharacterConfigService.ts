import type { CharacterConfig } from '../../character/types/character';
import { defaultCharacterConfig } from '../../character/types/character';
import { BaseStorageService } from './BaseStorageService';
import { characterStorageSchema, CharacterStorage } from '../validation/schemas/character.schema';
import { v4 as uuidv4 } from 'uuid';

export class CharacterConfigService extends BaseStorageService<CharacterStorage> {
  protected storageKey = 'character_configs';
  protected schema = characterStorageSchema;

  // 获取启用的角色配置
  async getActiveCharacters(): Promise<CharacterConfig[]> {
    const characters = await this.getAll();
    console.log('获取活动角色列表:', characters);
    return characters.filter(character => !character.isTemplate);
  }

  // 获取模板角色
  async getTemplates(): Promise<CharacterConfig[]> {
    const characters = await this.getAll();
    console.log('获取模板列表:', characters);
    return characters.filter(character => character.isTemplate);
  }

  // 从模板创建角色
  async createFromTemplate(templateId: string, overrides: Partial<CharacterConfig>): Promise<void> {
    console.log('从模板创建角色, templateId:', templateId, 'overrides:', overrides);
    const template = await this.getById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const now = Date.now();
    const uniqueId = `char_${templateId.replace('template_', '')}_${now}`;
    
    const newCharacter = {
      ...defaultCharacterConfig,
      ...template,
      ...overrides,
      id: uniqueId,
      isTemplate: false,
      templateId: templateId,
      createdAt: now,
      updatedAt: now,
    };

    console.log('准备创建新角色:', newCharacter);
    try {
      await this.create(newCharacter);
      console.log('角色创建成功');
    } catch (error) {
      console.error('创建角色失败:', error);
      throw error;
    }
  }

  // 保存为模板
  async saveAsTemplate(characterId: string, templateName: string): Promise<void> {
    console.log('保存为模板, characterId:', characterId, 'templateName:', templateName);
    const character = await this.getById(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    const now = Date.now();
    const template = {
      ...character,
      id: `template_${now}`,
      name: templateName,
      isTemplate: true,
      createdAt: now,
      updatedAt: now,
    };

    console.log('准备创建模板:', template);
    try {
      await this.create(template);
      console.log('模板创建成功');
    } catch (error) {
      console.error('创建模板失败:', error);
      throw error;
    }
  }

  // 重写create方法，确保添加必要的字段
  async create(data: Partial<CharacterStorage>): Promise<void> {
    console.log('开始创建角色配置:', data);
    const now = Date.now();
    const completeData: CharacterStorage = {
      id: data.id || uuidv4(),
      name: data.name || '未命名角色',
      persona: {
        personality: data.persona?.personality || [],
        speakingStyle: data.persona?.speakingStyle || '',
        background: data.persona?.background || '',
        values: data.persona?.values || [],
        argumentationStyle: data.persona?.argumentationStyle || [],
        customDescription: data.persona?.customDescription || ''
      },
      callConfig: {
        type: 'direct',
        direct: {
          provider: data.callConfig?.direct?.provider || 'default',
          modelId: data.callConfig?.direct?.modelId || 'default',
          model: data.callConfig?.direct?.model || 'default'
        }
      },
      createdAt: data.createdAt || now,
      updatedAt: now,
      isTemplate: data.isTemplate ?? false,
      description: data.description || '',
      avatar: data.avatar || '',
      templateId: data.templateId || undefined
    };

    try {
      // 验证数据
      const validationResult = await this.schema.safeParseAsync(completeData);
      if (!validationResult.success) {
        console.error('角色配置验证失败:', validationResult.error);
        throw new Error(`角色配置验证失败: ${validationResult.error.message}`);
      }

      console.log('角色配置验证成功，准备保存:', completeData);
      await super.create(completeData);
      console.log('角色配置保存成功');
    } catch (error) {
      console.error('保存角色配置失败:', error);
      throw error;
    }
  }

  // 重写update方法，确保添加必要的字段
  async update(id: string, data: Partial<CharacterStorage>): Promise<void> {
    console.log('开始更新角色配置:', id, data);
    const existing = await this.getById(id);
    if (!existing) {
      console.error('角色不存在:', id);
      throw new Error('Character not found');
    }

    // 确保深层合并时保持必需字段
    const updatedData: CharacterStorage = {
      ...existing,
      ...data,
      persona: {
        ...existing.persona,
        ...(data.persona || {}),
        personality: data.persona?.personality || existing.persona.personality,
        speakingStyle: data.persona?.speakingStyle || existing.persona.speakingStyle,
        background: data.persona?.background || existing.persona.background,
        values: data.persona?.values || existing.persona.values,
        argumentationStyle: data.persona?.argumentationStyle || existing.persona.argumentationStyle,
        customDescription: data.persona?.customDescription || existing.persona.customDescription
      },
      callConfig: {
        type: 'direct',
        direct: {
          provider: data.callConfig?.direct?.provider || existing.callConfig?.direct?.provider || 'default',
          modelId: data.callConfig?.direct?.modelId || existing.callConfig?.direct?.modelId || 'default',
          model: data.callConfig?.direct?.model || existing.callConfig?.direct?.model || 'default'
        }
      },
      updatedAt: Date.now()
    };

    try {
      // 验证数据
      const validationResult = await this.schema.safeParseAsync(updatedData);
      if (!validationResult.success) {
        console.error('更新的角色配置验证失败:', validationResult.error);
        throw new Error(`更新的角色配置验证失败: ${validationResult.error.message}`);
      }

      console.log('更新的角色配置验证成功，准备保存:', updatedData);
      await super.update(id, updatedData);
      console.log('角色配置更新成功');
    } catch (error) {
      console.error('更新角色配置失败:', error);
      throw error;
    }
  }

  // 验证角色配置
  async validateConfig(config: Partial<CharacterConfig>): Promise<boolean> {
    console.log('验证配置:', config);
    try {
      const now = Date.now();
      const data = {
        ...defaultCharacterConfig,
        ...config,
        id: config.id || uuidv4(),
        createdAt: config.createdAt || now,
        updatedAt: now,
        isTemplate: config.isTemplate ?? false,
      };
      const validationResult = await this.schema.safeParseAsync(data);
      if (!validationResult.success) {
        console.error('配置验证失败:', validationResult.error);
        return false;
      }
      console.log('配置验证成功');
      return true;
    } catch (error) {
      console.error('验证过程出错:', error);
      return false;
    }
  }

  // 删除角色
  async deleteCharacter(characterId: string): Promise<void> {
    console.log('删除角色, characterId:', characterId);
    try {
      const character = await this.getById(characterId);
      if (!character) {
        throw new Error('Character not found');
      }
      
      // 如果是模板，检查是否有依赖此模板的角色
      if (character.isTemplate) {
        const allCharacters = await this.getAll();
        const hasDependent = allCharacters.some(char => char.templateId === characterId);
        if (hasDependent) {
          throw new Error('Cannot delete template: it has dependent characters');
        }
      }
      
      await this.delete(characterId);
      console.log('角色删除成功');
    } catch (error) {
      console.error('删除角色失败:', error);
      throw error;
    }
  }
} 