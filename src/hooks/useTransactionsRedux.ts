// hooks/useTransactionsRedux.ts
import { useCallback } from 'react';
// import { useAppDispatch } from '@/lib/redux/hooks'; // Не нужен
import {
  useGetTransactionsByBudgetIdQuery,
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} from '@/lib/redux/api';
// import { incrementDataVersion } from '@/lib/redux/slices/budgetsSlice'; // УДАЛЕНО
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

export const useTransactionsRedux = (
  budgetId: string | null,
  options?: TransactionQueryOptions
) => {
  // const dispatch = useAppDispatch(); // Не нужен

  // useGetTransactionsByBudgetIdQuery теперь возвращает объект { transactions: Transaction[], totalCount: number }
  const {
    data, // Это объект TransactionsResponse
    isLoading: isLoadingTransactions,
    error,
    refetch: reloadTransactionsQuery,
  } = useGetTransactionsByBudgetIdQuery({ budgetId: budgetId || '', options }, { skip: !budgetId });

  // Извлекаем транзакции и totalCount из data
  const transactions = data?.transactions || [];
  const totalTransactionsCount = data?.totalCount || 0;

  const [addTransactionMutation] = useAddTransactionMutation();
  const [updateTransactionMutation] = useUpdateTransactionMutation();
  const [deleteTransactionMutation] = useDeleteTransactionMutation();

  const errorLoadingTransactions = error ? new Error('Ошибка загрузки транзакций') : null;

  const reloadTransactions = useCallback(async () => {
    if (budgetId) {
      // console.log('useTransactionsRedux: reloading transactions for budget', budgetId, 'with options', options);
      await reloadTransactionsQuery();
      // dispatch(incrementDataVersion()); // УДАЛЕНО
    }
  }, [budgetId, options, reloadTransactionsQuery]); // Добавил options в зависимости, если они влияют на refetch

  const addTransaction = useCallback(
    async (
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
          createdAt,
        }).unwrap();
        // RTK Query инвалидирует теги, данные обновятся (список транзакций, суммы, бюджет, категория)
        // dispatch(incrementDataVersion()); // УДАЛЕНО
        return newTransaction;
      } catch (err: any) {
        console.error('Failed to add transaction:', err);
        popup.open.ifAvailable({
          title: 'Ошибка добавления',
          message: err.data?.error || err.message || 'Неизвестная ошибка',
        });
        return null;
      }
    },
    [budgetId, addTransactionMutation]
  );

  const updateTransaction = useCallback(
    async (
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
          data,
        }).unwrap();
        // RTK Query инвалидирует теги, данные обновятся
        // dispatch(incrementDataVersion()); // УДАЛЕНО
        return updatedTransaction;
      } catch (err: any) {
        console.error('Failed to update transaction:', err);
        popup.open.ifAvailable({
          title: 'Ошибка обновления',
          message: err.data?.error || err.message || 'Неизвестная ошибка',
        });
        return null;
      }
    },
    [updateTransactionMutation]
  );

  const deleteTransaction = useCallback(
    async (transactionId: string): Promise<boolean> => {
      try {
        const success = await deleteTransactionMutation(transactionId).unwrap();
        // RTK Query инвалидирует теги, данные обновятся
        // if (success) { // УДАЛЕНО
        //   dispatch(incrementDataVersion());
        // }
        return success;
      } catch (err: any) {
        console.error('Failed to delete transaction:', err);
        popup.open.ifAvailable({
          title: 'Ошибка удаления',
          message: err.data?.error || err.message || 'Неизвестная ошибка',
        });
        return false;
      }
    },
    [deleteTransactionMutation]
  );

  return {
    transactions, // Массив транзакций для текущего запроса (страницы/фильтра)
    totalTransactionsCount, // Общее количество транзакций, соответствующее фильтрам (не только на текущей странице)
    isLoadingTransactions,
    errorLoadingTransactions,
    reloadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
