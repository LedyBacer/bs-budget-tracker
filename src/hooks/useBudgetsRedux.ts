import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { 
  useGetBudgetsQuery, 
  useAddBudgetMutation, 
  useUpdateBudgetMutation, 
  useDeleteBudgetMutation 
} from '@/lib/redux/api';
import { selectBudget, selectCurrentBudgetId, incrementDataVersion } from '@/lib/redux/slices/budgetsSlice';
import { popup } from '@telegram-apps/sdk-react';
import { Budget } from '@/types';

export const useBudgetsRedux = () => {
  const dispatch = useAppDispatch();
  const currentBudgetId = useAppSelector(selectCurrentBudgetId);
  
  // Запрос списка бюджетов
  const { 
    data: allBudgets = [], 
    isLoading: isLoadingBudgets, 
    error,
    refetch: reloadBudgetsQuery
  } = useGetBudgetsQuery();

  // Мутации для добавления, обновления и удаления бюджетов
  const [addBudgetMutation] = useAddBudgetMutation();
  const [updateBudgetMutation] = useUpdateBudgetMutation();
  const [deleteBudgetMutation] = useDeleteBudgetMutation();

  // Находим текущий бюджет
  const currentBudget = allBudgets.find(b => b.id === currentBudgetId) || null;

  // Ошибка загрузки бюджетов
  const errorLoadingBudgets = error ? new Error('Ошибка загрузки бюджетов') : null;

  // Выбрать бюджет
  const selectBudgetAction = useCallback((budgetId: string | null) => {
    dispatch(selectBudget(budgetId));
  }, [dispatch]);

  // Перезагрузка бюджетов
  const reloadBudgets = useCallback(async () => {
    await reloadBudgetsQuery();
    // После перезагрузки обновляем версию данных для обновления зависимых компонентов
    dispatch(incrementDataVersion());
  }, [reloadBudgetsQuery, dispatch]);

  // Добавление бюджета
  const addBudgetAction = useCallback(async (name: string, totalAmount: number): Promise<Budget | null> => {
    try {
      const newBudget = await addBudgetMutation({ name, totalAmount }).unwrap();
      selectBudgetAction(newBudget.id);
      return newBudget;
    } catch (error) {
      console.error('Failed to add budget:', error);
      popup.open.ifAvailable({
        title: 'Ошибка добавления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return null;
    }
  }, [addBudgetMutation, selectBudgetAction]);

  // Обновление бюджета
  const updateBudgetAction = useCallback(async (
    id: string,
    name: string,
    totalAmount: number
  ): Promise<Budget | null> => {
    try {
      const updatedBudget = await updateBudgetMutation({ id, name, totalAmount }).unwrap();
      return updatedBudget;
    } catch (error) {
      console.error('Failed to update budget:', error);
      popup.open.ifAvailable({
        title: 'Ошибка обновления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return null;
    }
  }, [updateBudgetMutation]);

  // Удаление бюджета
  const deleteBudgetAction = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await deleteBudgetMutation(id).unwrap();
      if (success && currentBudgetId === id) {
        selectBudgetAction(null);
      }
      return success;
    } catch (error) {
      console.error('Failed to delete budget:', error);
      popup.open.ifAvailable({
        title: 'Ошибка удаления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return false;
    }
  }, [deleteBudgetMutation, currentBudgetId, selectBudgetAction]);

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