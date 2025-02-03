import { BaseEntity } from '../validation/schemas/base.schema';
import { v4 as uuidv4 } from 'uuid';
import { FormData, CreateFormData } from '../../common/types/form';

export function createBaseEntity<T extends BaseEntity>(data: FormData<T>): T {
  const now = Date.now();
  const entity = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
    ...data,
  };
  return entity as unknown as T;
}

export function createFormData<T extends BaseEntity>(
  data: Partial<CreateFormData<T>> = {}
): CreateFormData<T> {
  return {
    ...data,
  } as CreateFormData<T>;
}

export function createNestedFormData<T extends object>(
  data: Partial<T> = {}
): T {
  return {
    ...data,
  } as T;
}

export function createInitialEntity<T extends BaseEntity>(
  data: Partial<Omit<T, keyof BaseEntity>>
): Omit<T, keyof BaseEntity> {
  return {
    ...data,
  } as Omit<T, keyof BaseEntity>;
} 