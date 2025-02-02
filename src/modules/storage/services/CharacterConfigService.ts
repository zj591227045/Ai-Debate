import type { CharacterConfig } from '../../character/types/character';
import { defaultCharacterConfig } from '../../character/types/character';
import { BaseStorageService } from './BaseStorageService';
import { characterStorageSchema, CharacterStorage } from '../validation/schemas/character.schema';

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

    const newCharacter = {
      ...defaultCharacterConfig,
      ...template,
      ...overrides,
      id: `char_${Date.now()}`,
      isTemplate: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    console.log('准备创建新角色:', newCharacter);
    try {
      const validationResult = await this.schema.safeParseAsync(newCharacter);
      if (!validationResult.success) {
        console.error('角色数据验证失败:', validationResult.error);
        throw new Error('Invalid character data');
      }
      await this.create(validationResult.data);
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

    const template = {
      ...character,
      id: `template_${Date.now()}`,
      name: templateName,
      isTemplate: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    console.log('准备创建模板:', template);
    try {
      const validationResult = await this.schema.safeParseAsync(template);
      if (!validationResult.success) {
        console.error('模板数据验证失败:', validationResult.error);
        throw new Error('Invalid template data');
      }
      await this.create(validationResult.data);
      console.log('模板创建成功');
    } catch (error) {
      console.error('创建模板失败:', error);
      throw error;
    }
  }

  // 验证角色配置
  async validateConfig(config: Partial<CharacterConfig>): Promise<boolean> {
    console.log('验证配置:', config);
    try {
      const data = {
        ...defaultCharacterConfig,
        ...config,
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
} 