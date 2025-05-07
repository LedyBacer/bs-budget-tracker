import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types';
import { useGetCategoriesByBudgetIdQuery } from '@/lib/redux/api';

export const useCategoriesLoader = (budgetId: string, open: boolean) => {
  const [error, setError] = useState<string | null>(null);
  
  // Используем Redux Query API вместо прямых вызовов mockApi
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories,
    refetch: loadCategories,
    error: categoriesError
  } = useGetCategoriesByBudgetIdQuery(budgetId, {
    // Не запрашиваем данные, если форма закрыта
    skip: !open || !budgetId
  });

  // Обрабатываем возможные ошибки
  useEffect(() => {
    if (categoriesError) {
      console.error('Failed to load categories:', categoriesError);
      setError('Ошибка загрузки категорий');
    } else {
      setError(null);
    }
  }, [categoriesError]);

  // Загружаем категории при открытии формы
  useEffect(() => {
    if (open && budgetId) {
      loadCategories();
    }
  }, [open, budgetId, loadCategories]);

  return {
    categories,
    isLoadingCategories,
    error,
    loadCategories
  };
}; 