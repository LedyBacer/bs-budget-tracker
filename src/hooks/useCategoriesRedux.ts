// hooks/useCategoriesRedux.ts
import { useCallback } from 'react';
// import { useAppDispatch } from '@/lib/redux/hooks'; // Не нужен dispatch, если нет incrementDataVersion
import {
  useGetCategoriesByBudgetIdQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/lib/redux/api';
// import { incrementDataVersion } from '@/lib/redux/slices/budgetsSlice'; // УДАЛЕНО
import { popup } from '@telegram-apps/sdk-react';
import { Category } from '@/types';

export const useCategoriesRedux = (budgetId: string | null) => {
  // const dispatch = useAppDispatch(); // Не нужен

  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    error,
    refetch: reloadCategoriesQuery,
  } = useGetCategoriesByBudgetIdQuery(
    budgetId ? { budget_id: budgetId } : { budget_id: '' }, 
    { skip: !budgetId }
  );

  const [addCategoryMutation] = useAddCategoryMutation();
  const [updateCategoryMutation] = useUpdateCategoryMutation();
  const [deleteCategoryMutation] = useDeleteCategoryMutation();

  const errorLoadingCategories = error ? new Error('Ошибка загрузки категорий') : null;

  const reloadCategories = useCallback(async () => {
    if (budgetId) {
      // console.log('useCategoriesRedux: reloading categories for budget', budgetId);
      await reloadCategoriesQuery();
      // dispatch(incrementDataVersion()); // УДАЛЕНО
    }
  }, [budgetId, reloadCategoriesQuery]);

  const addCategory = useCallback(
    async (name: string, limit_amount: number): Promise<Category | null> => {
      if (!budgetId) return null;

      try {
        const newCategory = await addCategoryMutation({ 
          budget_id: budgetId, 
          data: { 
            name, 
            limit_amount 
          } 
        }).unwrap();
        // RTK Query инвалидирует теги 'Category LIST' и 'Budget', данные обновятся
        // dispatch(incrementDataVersion()); // УДАЛЕНО
        return newCategory;
      } catch (err: any) {
        console.error('Failed to add category:', err);
        popup.open.ifAvailable({
          title: 'Ошибка добавления',
          message: err.data?.error || err.message || 'Неизвестная ошибка',
        });
        return null;
      }
    },
    [budgetId, addCategoryMutation]
  );

  const updateCategory = useCallback(
    async (categoryId: string, name: string, limit_amount: number): Promise<Category | null> => {
      try {
        const updatedCategory = await updateCategoryMutation({ 
          category_id: categoryId, 
          data: { 
            name, 
            limit_amount 
          } 
        }).unwrap();
        // RTK Query инвалидирует теги 'Category', 'Category LIST' и 'Budget', данные обновятся
        // dispatch(incrementDataVersion()); // УДАЛЕНО
        return updatedCategory;
      } catch (err: any) {
        console.error('Failed to update category:', err);
        popup.open.ifAvailable({
          title: 'Ошибка обновления',
          message: err.data?.error || err.message || 'Неизвестная ошибка',
        });
        return null;
      }
    },
    [updateCategoryMutation]
  );

  const deleteCategory = useCallback(
    async (categoryId: string): Promise<boolean> => {
      try {
        await deleteCategoryMutation(categoryId).unwrap();
        // RTK Query инвалидирует теги, данные обновятся
        // if (success) { // УДАЛЕНО
        //   dispatch(incrementDataVersion());
        // }
        return true; // Возвращаем true, так как операция прошла успешно
      } catch (err: any) {
        console.error('Failed to delete category:', err);
        popup.open.ifAvailable({
          title: 'Ошибка удаления',
          message: err.data?.error || err.message || 'Неизвестная ошибка',
        });
        return false;
      }
    },
    [deleteCategoryMutation]
  );

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
