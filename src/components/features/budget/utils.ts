import { Budget } from '@/types';

/**
 * Форматирует ошибку в строку для отображения пользователю
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Неизвестная ошибка';
}

/**
 * Типы для многократно используемых пропсов
 */
export interface BudgetHandlers {
  onBudgetSaved: () => void;
}

export interface BudgetFormControlProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} 