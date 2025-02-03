import { Template, TemplateCategory, TemplateTag } from '../types';

interface MigrationContext {
  currentVersion: string;
  targetVersion: string;
  data: {
    templates: Template[];
    categories?: TemplateCategory[];
    tags?: TemplateTag[];
  };
}

interface MigrationResult {
  success: boolean;
  data: MigrationContext['data'];
  errors?: string[];
  warnings?: string[];
}

type MigrationFunction = (context: MigrationContext) => Promise<MigrationResult>;

// 版本迁移映射
const migrations: Record<string, MigrationFunction> = {
  '1.0.0': async (context) => {
    // 1.0.0 是基础版本，不需要迁移
    return {
      success: true,
      data: context.data,
    };
  },
  '1.1.0': async (context) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 迁移模板数据
      const migratedTemplates = context.data.templates.map(template => ({
        ...template,
        content: {
          ...template.content,
          rules: {
            ...template.content.rules,
            // 添加新的规则字段，设置默认值
            advancedRules: {
              ...template.content.rules.advancedRules,
              requireEvidence: true,
              argumentTypes: ['factual', 'logical', 'example'],
            },
          },
        },
      }));

      return {
        success: true,
        data: {
          ...context.data,
          templates: migratedTemplates,
        },
        warnings,
      };
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
      return {
        success: false,
        data: context.data,
        errors,
        warnings,
      };
    }
  },
  '1.2.0': async (context) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 迁移模板数据
      const migratedTemplates = context.data.templates.map(template => ({
        ...template,
        content: {
          ...template.content,
          rules: {
            ...template.content.rules,
            // 添加评分规则字段，设置默认值
            scoring: {
              dimensions: {
                logic: { weight: 30, criteria: ['论证完整性', '推理严谨性'] },
                naturalness: { weight: 20, criteria: ['表达流畅性', '语言自然度'] },
                compliance: { weight: 20, criteria: ['规则遵守度', '格式规范性'] },
                consistency: { weight: 15, criteria: ['立场一致性', '观点连贯性'] },
                responsiveness: { weight: 15, criteria: ['回应相关性', '反驳有效性'] },
              },
              bonusPoints: {
                innovation: 5,
                persuasiveness: 5,
                clarity: 5,
              },
            },
          },
        },
      }));

      return {
        success: true,
        data: {
          ...context.data,
          templates: migratedTemplates,
        },
        warnings,
      };
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
      return {
        success: false,
        data: context.data,
        errors,
        warnings,
      };
    }
  },
};

// 版本比较函数
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }

  return 0;
};

// 获取迁移路径
const getMigrationPath = (from: string, to: string): string[] => {
  const versions = Object.keys(migrations).sort(compareVersions);
  const fromIndex = versions.findIndex(v => compareVersions(v, from) >= 0);
  const toIndex = versions.findIndex(v => compareVersions(v, to) >= 0);

  return versions.slice(fromIndex, toIndex + 1);
};

// 执行迁移
export const migrateData = async (
  data: MigrationContext['data'],
  fromVersion: string,
  toVersion: string
): Promise<MigrationResult> => {
  const migrationPath = getMigrationPath(fromVersion, toVersion);
  const errors: string[] = [];
  const warnings: string[] = [];

  let currentData = data;

  for (const version of migrationPath) {
    const migration = migrations[version];
    if (!migration) {
      errors.push(`未找到版本 ${version} 的迁移函数`);
      continue;
    }

    try {
      const result = await migration({
        currentVersion: version,
        targetVersion: toVersion,
        data: currentData,
      });

      if (!result.success) {
        errors.push(...(result.errors || []));
        return {
          success: false,
          data: currentData,
          errors,
          warnings: [...warnings, ...(result.warnings || [])],
        };
      }

      currentData = result.data;
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    } catch (error) {
      if (error instanceof Error) {
        errors.push(`版本 ${version} 迁移失败：${error.message}`);
      }
      return {
        success: false,
        data: currentData,
        errors,
        warnings,
      };
    }
  }

  return {
    success: true,
    data: currentData,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}; 