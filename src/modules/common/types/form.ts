import { BaseEntity } from '../../storage/validation/schemas/base.schema';

export type FormData<T extends BaseEntity> = Omit<T, keyof BaseEntity | 'usageCount' | 'lastUsed'>;

export interface FormState<T extends BaseEntity> {
  data: FormData<T>;
  errors: Array<{
    field: keyof FormData<T>;
    message: string;
  }>;
  isDirty: boolean;
  isSubmitting: boolean;
}

export type NestedFormData<T> = {
  [K in keyof T]: T[K] extends BaseEntity
    ? FormData<T[K]>
    : T[K] extends object
    ? NestedFormData<T[K]>
    : T[K];
};

export type CreateFormData<T extends BaseEntity> = FormData<T>;

export type UpdateFormData<T extends BaseEntity> = Partial<FormData<T>>; 