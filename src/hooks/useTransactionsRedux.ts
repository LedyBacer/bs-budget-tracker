import { useCallback } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { 
  useGetTransactionsByBudgetIdQuery, 
  useAddTransactionMutation, 
  useUpdateTransactionMutation,
  useDeleteTransactionMutation
} from '@/lib/redux/api';
import { incrementDataVersion } from '@/lib/redux/slices/budgetsSlice';
import { popup } from '@telegram-apps/sdk-react';
import { Transaction, TransactionType, WebAppUser } from '@/types';

interface TransactionQueryOptions {
  page?: number;
  limit?: number;
  dateRange?: 'all' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';
  startDate?: string;
  endDate?: string;
  type?: 'all' | 'expense' | 'income';
  categoryId?: string;
  userId?: string;
}

export const useTransactionsRedux = (budgetId: string | null, options?: TransactionQueryOptions) => {
  const dispatch = useAppDispatch();
  
  // Запрос списка транзакций
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions, 
    error,
    refetch: reloadTransactionsQuery
  } = useGetTransactionsByBudgetIdQuery(
    { budgetId: budgetId || '', options }, 
    { skip: !budgetId }
  );

  // Мутации для добавления, обновления и удаления транзакций
  const [addTransactionMutation] = useAddTransactionMutation();
  const [updateTransactionMutation] = useUpdateTransactionMutation();
  const [deleteTransactionMutation] = useDeleteTransactionMutation();

  // Ошибка загрузки транзакций
  const errorLoadingTransactions = error ? new Error('Ошибка загрузки транзакций') : null;

  // Перезагрузка транзакций
  const reloadTransactions = useCallback(async () => {
    if (budgetId) {
      await reloadTransactionsQuery();
      dispatch(incrementDataVersion());
    }
  }, [budgetId, reloadTransactionsQuery, dispatch]);

  // Добавление транзакции
  const addTransaction = useCallback(async (
    categoryId: string,
    type: TransactionType,
    amount: number,
    author: Pick<WebAppUser, 'id' | 'first_name' | 'last_name' | 'username'>,
    name?: string,
    comment?: string,
    createdAt?: Date
  ): Promise<Transaction | null> => {
    if (!budgetId) return null;
    
    try {
      const newTransaction = await addTransactionMutation({
        budgetId,
        categoryId,
        type,
        amount,
        author,
        name,
        comment,
        createdAt
      }).unwrap();
      
      dispatch(incrementDataVersion());
      return newTransaction;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      popup.open.ifAvailable({
        title: 'Ошибка добавления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return null;
    }
  }, [budgetId, addTransactionMutation, dispatch]);

  // Обновление транзакции
  const updateTransaction = useCallback(async (
    transactionId: string,
    data: Partial<{
      name?: string;
      type: TransactionType;
      amount: number;
      categoryId: string;
      comment?: string;
      createdAt?: Date;
    }>
  ): Promise<Transaction | null> => {
    try {
      const updatedTransaction = await updateTransactionMutation({
        transactionId,
        data
      }).unwrap();
      
      dispatch(incrementDataVersion());
      return updatedTransaction;
    } catch (error) {
      console.error('Failed to update transaction:', error);
      popup.open.ifAvailable({
        title: 'Ошибка обновления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return null;
    }
  }, [updateTransactionMutation, dispatch]);

  // Удаление транзакции
  const deleteTransaction = useCallback(async (transactionId: string): Promise<boolean> => {
    try {
      const success = await deleteTransactionMutation(transactionId).unwrap();
      if (success) {
        dispatch(incrementDataVersion());
      }
      return success;
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      popup.open.ifAvailable({
        title: 'Ошибка удаления',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
      return false;
    }
  }, [deleteTransactionMutation, dispatch]);

  return {
    transactions,
    isLoadingTransactions,
    errorLoadingTransactions,
    reloadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}; 