// hooks/useBudgetsRedux.ts
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  useGetBudgetsQuery,
  useAddBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} from '@/lib/redux/api';
import { selectBudget, selectCurrentBudgetId } from '@/lib/redux/slices/budgetsSlice';
import { popup } from '@telegram-apps/sdk-react';
import { Budget } from '@/types';

export const useBudgetsRedux = () => {
  const dispatch = useAppDispatch();
  const currentBudgetId = useAppSelector(selectCurrentBudgetId);

  const {
    data: allBudgets = [],
    isLoading: isLoadingBudgets,
    error,
    refetch: reloadBudgetsQuery,
  } = useGetBudgetsQuery();

  const [addBudgetMutation] = useAddBudgetMutation();
  const [updateBudgetMutation] = useUpdateBudgetMutation();
  const [deleteBudgetMutation] = useDeleteBudgetMutation();

  const currentBudget = allBudgets.find((b) => b.id === currentBudgetId) || null;
  const errorLoadingBudgets = error ? new Error('Ошибка загрузки бюджетов') : null;

  const selectBudgetAction = useCallback(
    (budgetId: string | null) => {
      dispatch(selectBudget(budgetId));
    },
    [dispatch]
  );

  const reloadBudgets = useCallback(async () => {
    // console.log('useBudgetsRedux: reloading budgets');
    await reloadBudgetsQuery();
    // dispatch(incrementDataVersion()); // УДАЛЕНО
  }, [reloadBudgetsQuery]);

  const addBudgetAction = useCallback(
    async (name: string, totalAmount: number): Promise<Budget | null> => {
      try {
        const newBudget = await addBudgetMutation({ name, totalAmount }).unwrap();
        // RTK Query инвалидирует 'Budget LIST', useGetBudgetsQuery обновится
        // Выбираем новый бюджет
        selectBudgetAction(newBudget.id);
        return newBudget;
      } catch (err: any) {
        console.error('Failed to add budget:', err);
        popup.open.ifAvailable({
          title: 'Ошибка добавления',
          message: err.data?.error || err.message || 'Неизвестная ошибка',
        });
        return null;
      }
    },
    [addBudgetMutation, selectBudgetAction]
  );

  const updateBudgetAction = useCallback(
    async (id: string, name: string, totalAmount: number): Promise<Budget | null> => {
      try {
        const updatedBudget = await updateBudgetMutation({ id, name, totalAmount }).unwrap();
        // RTK Query инвалидирует тег бюджета и 'Budget LIST', данные обновятся
        return updatedBudget;
      } catch (err: any) {
        console.error('Failed to update budget:', err);
        popup.open.ifAvailable({
          title: 'Ошибка обновления',
          message: err.data?.error || err.message || 'Неизвестная ошибка',
        });
        return null;
      }
    },
    [updateBudgetMutation]
  );

  const deleteBudgetAction = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const success = await deleteBudgetMutation(id).unwrap();
        // RTK Query инвалидирует теги, данные обновятся
        if (success && currentBudgetId === id) {
          selectBudgetAction(null); // Сбрасываем выбор, если удалили текущий
        }
        return success;
      } catch (err: any) {
        console.error('Failed to delete budget:', err);
        popup.open.ifAvailable({
          title: 'Ошибка удаления',
          message: err.data?.error || err.message || 'Неизвестная ошибка',
        });
        return false;
      }
    },
    [deleteBudgetMutation, currentBudgetId, selectBudgetAction]
  );

  return {
    allBudgets,
    currentBudget,
    isLoadingBudgets,
    errorLoadingBudgets,
    selectBudget: selectBudgetAction,
    reloadBudgets,
    addBudget: addBudgetAction,
    updateBudget: updateBudgetAction,
    deleteBudget: deleteBudgetAction,
  };
};
