import { useCallback } from 'react';
import { calculateCategoryBalances } from '../utils/categoryUtils';
import { CategoryWithBalance } from '../utils/categoryUtils';
import { useCategoriesRedux } from '@/hooks/useCategoriesRedux';
import { useTransactionsRedux } from '@/hooks/useTransactionsRedux';

interface UseCategoryDataResult {
  categoriesWithBalance: CategoryWithBalance[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Хук для обработки данных категорий и транзакций с использованием Redux
 */
export function useCategoryData(budgetId: string | null | undefined): UseCategoryDataResult {
  // Получаем данные и методы из Redux для категорий
  const {
    categories,
    isLoadingCategories,
    reloadCategories,
  } = useCategoriesRedux(budgetId || null);

  // Получаем данные и методы из Redux для транзакций
  const {
    transactions,
    isLoadingTransactions,
    reloadTransactions,
  } = useTransactionsRedux(budgetId || null);

  // Определяем функцию обновления данных
  const refetch = useCallback(async () => {
    if (!budgetId) return;
    
    // Перезагрузим и категории, и транзакции
    await Promise.all([
      reloadCategories(),
      reloadTransactions()
    ]);
  }, [budgetId, reloadCategories, reloadTransactions]);

  // Рассчитываем категории с балансами
  const categoriesWithBalance = calculateCategoryBalances(categories, transactions);

  return {
    categoriesWithBalance,
    isLoading: isLoadingCategories || isLoadingTransactions,
    refetch,
  };
} 