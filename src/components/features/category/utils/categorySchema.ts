import { z } from 'zod';

// Схема валидации Zod для формы категории
export const categorySchema = z.object({
  name: z.string().min(1, { message: 'Название категории обязательно' }),
  limit: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)), // Преобразуем пустую строку в undefined, затем в число
    z
      .number({ invalid_type_error: 'Лимит должен быть числом' })
      .positive({ message: 'Лимит должен быть положительным числом' })
      .min(0.01, { message: 'Лимит должен быть больше 0' })
  ),
});

// Определяем тип с учетом preprocessor, который может вернуть undefined
export type CategoryFormData = {
  name: string;
  limit?: number;
}; 