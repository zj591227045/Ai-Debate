import { v4 as uuidv4 } from 'uuid';
import type { DebateConfig } from '../types/debate';

export interface Template {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  config: DebateConfig;
}

export interface TemplateFile {
  metadata: {
    name: string;
    version: string;
    createdAt: Date;
    description?: string;
  };
  config: DebateConfig;
}

export interface SaveTemplateParams {
  name: string;
  config: DebateConfig;
}

interface StoredTemplate {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  config: DebateConfig;
}

export class TemplateManager {
  private static STORAGE_KEY = 'debate_templates';

  static async loadTemplates(): Promise<Template[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      
      const templates = JSON.parse(data) as Record<string, StoredTemplate>;
      return Object.values(templates).map(template => ({
        ...template,
        createdAt: new Date(template.createdAt),
        updatedAt: new Date(template.updatedAt)
      }));
    } catch (error) {
      console.error('加载模板失败:', error);
      return [];
    }
  }

  static async saveTemplate(params: SaveTemplateParams): Promise<string> {
    try {
      const { name, config } = params;
      const templates = await this.loadTemplatesFromStorage();
      
      const id = uuidv4();
      const now = new Date();
      
      templates[id] = {
        id,
        name,
        config,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await this.saveToStorage(templates);
      return id;
    } catch (error) {
      console.error('保存模板失败:', error);
      throw error;
    }
  }

  static async deleteTemplate(id: string): Promise<void> {
    try {
      const templates = await this.loadTemplatesFromStorage();
      if (!templates[id]) {
        throw new Error('模板不存在');
      }
      
      delete templates[id];
      await this.saveToStorage(templates);
    } catch (error) {
      console.error('删除模板失败:', error);
      throw error;
    }
  }

  private static async loadTemplatesFromStorage(): Promise<Record<string, StoredTemplate>> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return {};
    return JSON.parse(data) as Record<string, StoredTemplate>;
  }

  private static async saveToStorage(templates: Record<string, StoredTemplate>): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
  }

  static async downloadTemplate(id: string): Promise<void> {
    try {
      const templates = await this.loadTemplatesFromStorage();
      const template = templates[id];
      if (!template) {
        throw new Error('模板不存在');
      }

      const file: TemplateFile = {
        metadata: {
          name: template.name,
          version: '1.0',
          createdAt: new Date(template.createdAt),
          description: '',
        },
        config: template.config,
      };

      const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载模板失败:', error);
      throw error;
    }
  }

  static async loadFromFile(file: File): Promise<DebateConfig> {
    try {
      const text = await file.text();
      const data: TemplateFile = JSON.parse(text);
      
      if (!this.validateTemplateFile(data)) {
        throw new Error('无效的模板文件格式');
      }

      return data.config;
    } catch (error) {
      console.error('从文件加载模板失败:', error);
      throw error;
    }
  }

  private static validateTemplateFile(data: any): data is TemplateFile {
    return (
      data &&
      typeof data === 'object' &&
      'metadata' in data &&
      'config' in data &&
      typeof data.metadata === 'object' &&
      typeof data.metadata.name === 'string' &&
      typeof data.metadata.version === 'string'
    );
  }
} 