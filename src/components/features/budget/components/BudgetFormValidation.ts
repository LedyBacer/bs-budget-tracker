import { z } from 'zod';

// Схема валидации Zod для бюджета
export const budgetSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Название бюджета обязательно' })
    .max(50, { message: 'Название слишком длинное (макс. 50)' }),
  total_amount: z.preprocess(
    (val) => {
      if (val === '' || val === undefined) return 0;
      return Number(val);
    },
    z
      .number({ invalid_type_error: 'Сумма должна быть числом' })
      .nonnegative({ message: 'Сумма должна быть положительной' })
      .min(0, { message: 'Сумма должна быть больше или равна 0' })
  ),
});

export type BudgetFormData = z.infer<typeof budgetSchema>; 