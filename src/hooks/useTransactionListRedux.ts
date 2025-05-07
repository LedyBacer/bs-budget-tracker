import { useState, useCallback, useEffect } from 'react';
import { Transaction, WebAppUser } from '@/types';
import { useTransactionsRedux } from './useTransactionsRedux';
import { useCategoriesRedux } from './useCategoriesRedux';
import { TransactionWithCategoryName } from '@/components/features/transaction/utils/types';

export const useTransactionListRedux = (budgetId: string | null) => {
  // Состояния для пагинации и загрузки
  const [page, setPage] = useState(1);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  
  // Используем redux хуки для транзакций и категорий
  const { 
    transactions: rawTransactions, 
    isLoadingTransactions,
    reloadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction 
  } = useTransactionsRedux(budgetId, { page, limit: 10 });
  
  const { 
    categories, 
    isLoadingCategories,
    reloadCategories 
  } = useCategoriesRedux(budgetId);

  // Вычисляем транзакции с именами категорий
  const transactions: TransactionWithCategoryName[] = rawTransactions.map(transaction => {
    const category = categories.find(c => c.id === transaction.categoryId);
    return {
      ...transaction,
      categoryName: category?.name || 'Неизвестная категория',
    };
  });

  // Определяем, есть ли еще страницы для загрузки
  useEffect(() => {
    // Если получили неполную страницу или ничего, считаем что больше нет транзакций
    setHasMoreTransactions(rawTransactions.length === 10);
  }, [rawTransactions]);

  // Извлекаем уникальных пользователей из транзакций
  const uniqueUsers = rawTransactions.reduce<WebAppUser[]>((acc, transaction) => {
    const exists = acc.find(user => user.id === transaction.author.id);
    if (!exists && transaction.author) {
      acc.push(transaction.author as WebAppUser);
    }
    return acc;
  }, []);

  // Функция загрузки большего количества транзакций
  const loadMore = useCallback(() => {
    if (hasMoreTransactions && !isLoadingTransactions) {
      setPage(prevPage => prevPage + 1);
    }
  }, [hasMoreTransactions, isLoadingTransactions]);

  // Функция полной перезагрузки данных
  const reloadData = useCallback(async () => {
    setPage(1);
    await Promise.all([
      reloadTransactions(),
      reloadCategories()
    ]);
  }, [reloadTransactions, reloadCategories]);

  // Обработчик удаления транзакции
  const handleDeleteTransaction = useCallback(async (transactionId: string) => {
    await deleteTransaction(transactionId);
  }, [deleteTransaction]);

  return {
    transactions,
    categories,
    uniqueUsers,
    isLoading: isLoadingTransactions || isLoadingCategories,
    hasMoreTransactions,
    loadMore,
    reloadData,
    addTransaction,
    updateTransaction,
    deleteTransaction: handleDeleteTransaction,
  };
}; 