import { formatNumberWithSpaces, parseFormattedNumber } from '@/lib/utils';
import { Category, Transaction } from '@/types';
import * as mockApi from '@/lib/mockData';
import { FullTransactionFormData, SimpleTransactionFormData } from './schemas';

/**
 * Обработка изменения суммы в поле ввода и форматирование с разделителями
 */
export const handleAmountChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setFormattedAmount: React.Dispatch<React.SetStateAction<string>>,
  setValue: (name: "amount", value: number) => void
) => {
  const value = e.target.value;
  const formatted = formatNumberWithSpaces(value);
  setFormattedAmount(formatted);
  setValue("amount", parseFormattedNumber(value) || 0);
};

/**
 * Форматирование даты для input type="datetime-local"
 */
export const formatDateForInput = (date: Date | undefined): string => {
  if (!date) return '';
  try {
    // Корректируем часовой пояс перед форматированием
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    // Проверяем, валидна ли дата после коррекции
    if (isNaN(localDate.getTime())) {
      console.error('Invalid date after timezone offset adjustment:', date);
      return '';
    }
    return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  } catch (e) {
    console.error('Error formatting date for input:', date, e);
    return '';
  }
};

/**
 * Загрузка категорий для бюджета
 */
export const loadCategories = async (
  budgetId: string,
  setIsLoadingCategories: React.Dispatch<React.SetStateAction<boolean>>,
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>,
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>
): Promise<void> => {
  if (!budgetId) return;
  
  setIsLoadingCategories(true);
  try {
    const cats = await mockApi.getCategoriesByBudgetId(budgetId);
    setCategories(cats);
  } catch (error) {
    console.error('Failed to load categories:', error);
    setSubmitError('Ошибка загрузки категорий');
  } finally {
    setIsLoadingCategories(false);
  }
};

/**
 * Получение начальных значений для полной формы транзакций
 */
export const getFullFormDefaultValues = (transaction?: Transaction | null): FullTransactionFormData => {
  return {
    type: transaction?.type || 'expense',
    amount: transaction?.amount || 0,
    categoryId: transaction?.category_id || '',
    name: transaction?.name || '',
    comment: transaction?.comment || '',
    createdAt: transaction?.transaction_date ? new Date(transaction.transaction_date) : new Date(),
  };
};

/**
 * Получение начальных значений для упрощенной формы транзакций
 */
export const getSimpleFormDefaultValues = (): SimpleTransactionFormData => {
  return {
    type: 'expense' as const,
    amount: 0,
    categoryId: '',
  };
}; 