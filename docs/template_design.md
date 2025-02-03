# 辩论模板设计文档

## 1. 模板配置项分类

### 1.1 基础配置项（模板固定项）
- 主题配置
  - 主题名称
  - 主题背景说明
  - 主题类型
- 规则配置
  - 辩论形式（正反方/自由辩论）
  - 基本规则说明
  - 高级规则设置
    - 字数限制
    - 引用规则
    - 回应要求
    - 立场转换
    - 证据支持要求
- 裁判配置
  - 评分规则说明
  - 评分维度设置

### 1.2 动态配置项（每次使用时设置）
- 参与者配置
  - 参与人数
  - AI角色选择
  - 角色分配
  - 用户参与设置
- 时间配置
  - 每轮时间限制
  - 总时长设置
- 特殊规则
  - 临时规则调整
  - 特殊条件设置

## 2. 模板管理功能

### 2.1 模板操作
- 加载模板
- 下载模板文件
- 另存为模板
- 删除模板

### 2.2 模板持久化
- 存储位置：LocalStorage
- 存储格式：JSON
- 存储结构：
```typescript
interface TemplateStorage {
  templates: {
    [id: string]: {
      name: string;
      createdAt: Date;
      updatedAt: Date;
      config: DebateConfig;
    }
  }
}
```

### 2.3 模板文件格式
```typescript
interface TemplateFile {
  metadata: {
    name: string;
    version: string;
    createdAt: Date;
    description?: string;
  };
  config: DebateConfig;
}
```

## 3. 实现细节

### 3.1 模板持久化实现
```typescript
class TemplateManager {
  private static STORAGE_KEY = 'debate_templates';

  // 保存模板
  static async saveTemplate(name: string, config: DebateConfig): Promise<string> {
    const templates = await this.loadTemplates();
    const id = generateUUID();
    
    templates[id] = {
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      config
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    return id;
  }

  // 加载所有模板
  static async loadTemplates(): Promise<Record<string, Template>> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  // 下载模板文件
  static async downloadTemplate(id: string): Promise<void> {
    const templates = await this.loadTemplates();
    const template = templates[id];
    
    if (!template) {
      throw new Error('Template not found');
    }

    const fileContent = JSON.stringify({
      metadata: {
        name: template.name,
        version: '1.0',
        createdAt: template.createdAt,
      },
      config: template.config
    }, null, 2);

    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  // 从文件加载模板
  static async loadFromFile(file: File): Promise<TemplateFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          resolve(content);
        } catch (error) {
          reject(new Error('Invalid template file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
```

### 3.2 模板操作流程

1. **保存模板**
   - 获取当前配置
   - 请求用户输入模板名称
   - 调用`TemplateManager.saveTemplate`
   - 显示成功提示

2. **加载模板**
   - 显示模板列表对话框
   - 用户选择模板
   - 加载模板配置
   - 更新UI状态

3. **下载模板**
   - 用户选择要下载的模板
   - 调用`TemplateManager.downloadTemplate`
   - 浏览器触发下载

4. **从文件加载**
   - 用户选择模板文件
   - 调用`TemplateManager.loadFromFile`
   - 验证模板格式
   - 更新配置 