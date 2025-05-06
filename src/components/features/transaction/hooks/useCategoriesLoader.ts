import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types';
import * as mockApi from '@/lib/mockData';

export const useCategoriesLoader = (budgetId: string, open: boolean) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!budgetId) return;
    
    setIsLoadingCategories(true);
    setError(null);
    
    try {
      const cats = await mockApi.getCategoriesByBudgetId(budgetId);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Ошибка загрузки категорий');
    } finally {
      setIsLoadingCategories(false);
    }
  }, [budgetId]);

  // Загружаем категории при открытии формы
  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open, loadCategories]);

  return {
    categories,
    isLoadingCategories,
    error,
    loadCategories
  };
}; 