import { z } from 'zod';
import { StorageError, StorageErrorCodes, TableNames } from '../types';
import { characterConfigSchema, characterTemplateSchema } from './schemas/character.schema';
import { gameRulesSchema } from './schemas/game-rules.schema';

export class ValidationError extends StorageError {
  constructor(
    message: string,
    public errors: z.ZodError,
  ) {
    super(message, StorageErrorCodes.VALIDATION_ERROR, true);
    this.name = 'ValidationError';
  }
}

export class Validator {
  private schemas = new Map<string, z.ZodType>();

  constructor() {
    this.initSchemas();
  }

  private initSchemas() {
    this.schemas.set(TableNames.Characters, characterConfigSchema);
    this.schemas.set(TableNames.CharacterTemplates, characterTemplateSchema);
    this.schemas.set(TableNames.GameRules, gameRulesSchema);
  }

  async validateData<T>(tableName: string, data: T): Promise<void> {
    const schema = this.schemas.get(tableName);
    if (!schema) {
      throw new StorageError(
        `表 ${tableName} 没有对应的验证模式`,
        StorageErrorCodes.VALIDATION_ERROR,
        false
      );
    }

    try {
      await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('数据验证失败', error);
      }
      throw error;
    }
  }

  async validateBulkData<T>(tableName: string, dataList: T[]): Promise<void> {
    const schema = this.schemas.get(tableName);
    if (!schema) {
      throw new StorageError(
        `表 ${tableName} 没有对应的验证模式`,
        StorageErrorCodes.VALIDATION_ERROR,
        false
      );
    }

    try {
      await Promise.all(dataList.map(data => schema.parseAsync(data)));
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('批量数据验证失败', error);
      }
      throw error;
    }
  }
} 