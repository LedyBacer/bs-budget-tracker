import { useMemo } from 'react';
import { GroupedTransactions, TransactionWithCategoryName } from '../utils/types';
import { format, startOfDay } from 'date-fns';

export function useTransactionGroups(transactions: TransactionWithCategoryName[]) {
  // Группировка транзакций по дате
  const groupedTransactions = useMemo(() => {
    const groups: GroupedTransactions = {};

    // Группируем транзакции по дате (игнорируя время)
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const dateKey = format(startOfDay(date), 'yyyy-MM-dd');

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(transaction);
    });

    // Сортируем транзакции в каждой группе по времени (новые сверху)
    Object.keys(groups).forEach((dateKey) => {
      groups[dateKey].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });

    return groups;
  }, [transactions]);

  // Получаем отсортированные по дате ключи групп (новые сверху)
  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedTransactions).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [groupedTransactions]);

  return {
    groupedTransactions,
    sortedGroupKeys,
  };
} 