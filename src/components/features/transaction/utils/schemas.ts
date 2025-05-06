import { z } from 'zod';

// Базовая схема для транзакций, используемая в обеих формах
export const baseTransactionSchema = {
  type: z.enum(['expense', 'income'], { required_error: 'Выберите тип транзакции' }),
  amount: z.preprocess(
    (val) => (val === '' || val === undefined) ? 0 : Number(val),
    z
      .number({ invalid_type_error: 'Сумма должна быть числом' })
      .min(0, { message: 'Сумма должна быть больше или равна 0' })
  ),
  categoryId: z.string().min(1, { message: 'Выберите категорию' }),
};

// Упрощённая схема для SimpleTransactionForm
export const simpleTransactionSchema = z.object({
  ...baseTransactionSchema
});

// Полная схема для TransactionForm с дополнительными полями
export const fullTransactionSchema = z.object({
  ...baseTransactionSchema,
  // Для полной формы сумма должна быть положительной
  amount: z.preprocess(
    (val) => (val === '' || val === undefined) ? 0 : Number(val),
    z
      .number({ invalid_type_error: 'Сумма должна быть числом' })
      .positive({ message: 'Сумма должна быть положительной' })
      .min(0.01, { message: 'Сумма должна быть больше 0' })
  ),
  name: z.string().optional(),
  comment: z.string().optional(),
  createdAt: z.date({ required_error: 'Выберите дату' }),
});

// Типы для использования в компонентах
export type SimpleTransactionFormData = z.infer<typeof simpleTransactionSchema>;
export type FullTransactionFormData = z.infer<typeof fullTransactionSchema>; 