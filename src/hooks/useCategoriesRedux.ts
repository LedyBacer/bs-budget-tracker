import { useCallback } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { 
  useGetCategoriesByBudgetIdQuery, 
  useAddCategoryMutation, 
  useUpdateCategoryMutation, 
  useDeleteCategoryMutation 
} from '@/lib/redux/api';
import { incrementDataVersion } from '@/lib/redux/slices/budgetsSlice';
import { popup } from '@telegram-apps/sdk-react';
import { Category } from '@/types';

export const useCategoriesRedux = (budgetId: string | null) => {
  const dispatch = useAppDispatch();
  
  // Запрос списка категорий
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories, 
    error,
    refetch: reloadCategoriesQuery
  } = useGetCategoriesByBudgetIdQuery(budgetId || '', { skip: !budgetId });

  // Мутации для добавления, обновления и удаления категорий
  const [addCategoryMutation] = useAddCategoryMutation();
  const [updateCategoryMutation] = useUpdateCategoryMutation();
  const [deleteCategoryMutation] = useDeleteCategoryMutation();

  // Ошибка загрузки категорий
  const errorLoadingCategories = error ? new Error('Ошибка загрузки категорий') : null;

  // Перезагрузка категорий
  const reloadCategories = useCallback(async () => {
    if (budgetId) {
      await reloadCategoriesQuery();
      dispatch(incrementDataVersion());
    }
  }, [budgetId, reloadCategoriesQuery, dispatch]);

  // Добавление категории
  const addCategory = useCallback(async (name: string, limit: number): Promise<Category | null> => {
    if (!budgetId) return null;
    
    try {
      const newCategory = await addCategoryMutation({ budgetId, name, limit }).unwrap();
      dispatch(incrementDataVersion());
      return newCategory;
    } catch (error) {
      console.error('Failed to add category:', error);
      popup.open.ifAvailable({
        title: 'Ошибка добавления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return null;
    }
  }, [budgetId, addCategoryMutation, dispatch]);

  // Обновление категории
  const updateCategory = useCallback(async (
    categoryId: string,
    name: string,
    limit: number
  ): Promise<Category | null> => {
    try {
      const updatedCategory = await updateCategoryMutation({ categoryId, name, limit }).unwrap();
      dispatch(incrementDataVersion());
      return updatedCategory;
    } catch (error) {
      console.error('Failed to update category:', error);
      popup.open.ifAvailable({
        title: 'Ошибка обновления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return null;
    }
  }, [updateCategoryMutation, dispatch]);

  // Удаление категории
  const deleteCategory = useCallback(async (categoryId: string): Promise<boolean> => {
    try {
      const success = await deleteCategoryMutation(categoryId).unwrap();
      if (success) {
        dispatch(incrementDataVersion());
      }
      return success;
    } catch (error) {
      console.error('Failed to delete category:', error);
      popup.open.ifAvailable({
        title: 'Ошибка удаления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return false;
    }
  }, [deleteCategoryMutation, dispatch]);

  return {
    categories,
    isLoadingCategories,
    errorLoadingCategories,
    reloadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}; 