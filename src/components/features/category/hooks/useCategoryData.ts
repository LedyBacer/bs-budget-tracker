import { useState, useCallback, useEffect } from 'react';
import { Category, Transaction } from '@/types';
import * as mockApi from '@/lib/mockData';
import { calculateCategoryBalances } from '../utils/categoryUtils';
import { CategoryWithBalance } from '../utils/categoryUtils';

interface UseCategoryDataResult {
  categories: Category[];
  transactions: Transaction[];
  categoriesWithBalance: CategoryWithBalance[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Хук для загрузки и обработки данных категорий и транзакций
 */
export function useCategoryData(budgetId?: string): UseCategoryDataResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!budgetId) return;
    
    setIsLoading(true);
    try {
      const [cats, trans] = await Promise.all([
        mockApi.getCategoriesByBudgetId(budgetId),
        mockApi.getTransactionsByBudgetId(budgetId),
      ]);
      setCategories(cats);
      setTransactions(trans);
    } catch (error) {
      console.error('Failed to load categories/transactions:', error);
      // TODO: Добавить уведомление пользователя об ошибке
    } finally {
      setIsLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Рассчитываем категории с балансами
  const categoriesWithBalance = calculateCategoryBalances(categories, transactions);

  return {
    categories,
    transactions,
    categoriesWithBalance,
    isLoading,
    refetch: loadData,
  };
} 