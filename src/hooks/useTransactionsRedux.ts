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

  // Преобразуем опции из нашего формата в формат API, пропуская пустые значения
  const apiQueryParams = budgetId ? {
    budget_id: budgetId,
    skip: options?.page ? (options.page - 1) * (options.limit || 10) : undefined,
    limit: options?.limit,
    // Добавляем параметры только если они имеют непустые значения
    ...(options?.categoryId && options.categoryId !== 'all' ? { category_id: options.categoryId } : {}),
    ...(options?.userId && options.userId !== 'all' ? { author_user_id: parseInt(options.userId) } : {}),
    ...(options?.type && options.type !== 'all' ? { type: options.type } : {}),
    ...(options?.startDate ? { start_date: options.startDate } : {}),
    ...(options?.endDate ? { end_date: options.endDate } : {})
  } : { budget_id: '' }; // Всегда передаем объект, но с пустым budget_id, если budgetId не задан

  // useGetTransactionsByBudgetIdQuery теперь возвращает объект { transactions: Transaction[], totalCount: number }
  const {
    data, // Это объект TransactionsResponse
    isLoading: isLoadingTransactions,
    error,
    refetch: reloadTransactionsQuery,
  } = useGetTransactionsByBudgetIdQuery(apiQueryParams, { skip: !budgetId });

  // Извлекаем транзакции и totalCount из data
  const transactions = data?.transactions || [];
  const totalTransactionsCount = data?.total_count || 0;

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
      category_id: string,
      type: TransactionType,
      amount: number,
      author: Pick<WebAppUser, 'id' | 'first_name' | 'last_name' | 'username'>,
      name?: string,
      comment?: string,
      transaction_date?: Date
    ): Promise<Transaction | null> => {
      if (!budgetId) return null;

      try {
        const newTransaction = await addTransactionMutation({
          budget_id: budgetId,
          data: {
            type,
            amount,
            name,
            comment,
            category_id,
            transaction_date: transaction_date?.toISOString(),
          }
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
        category_id: string;
        comment?: string;
        transaction_date?: Date;
      }>
    ): Promise<Transaction | null> => {
      try {
        // Преобразуем данные в формат API
        const apiData = {
          name: data.name,
          type: data.type,
          amount: data.amount,
          category_id: data.category_id,
          comment: data.comment,
          transaction_date: data.transaction_date?.toISOString()
        };

        const updatedTransaction = await updateTransactionMutation({
          transaction_id: transactionId,
          data: apiData
        }).unwrap();
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
        await deleteTransactionMutation(transactionId).unwrap();
        // После успешного удаления явно вызываем refetch для обновления списка
        await reloadTransactionsQuery();
        return true; // Возвращаем true, так как операция прошла успешно
      } catch (err: any) {
        console.error('Failed to delete transaction:', err);
        popup.open.ifAvailable({
          title: 'Ошибка удаления',
          message: err.data?.error || err.message || 'Неизвестная ошибка',
        });
        return false;
      }
    },
    [deleteTransactionMutation, reloadTransactionsQuery]
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
